
const fs = require('fs')

const R = require('ramda')

const constants = require('../config/constants')
const { organisationUnitToLocation } = require('../mappings/location')
const { createOutbreakMapping } = require('../mappings/outbreak')
const { trackedEntityToCase } = require('../mappings/case')
const { getIDFromDisplayName } = require('../util')

const copyOrganisationUnits = (dhis2, godata, config) => async (outputFile) => {
  const organisationUnits = await dhis2.getOrganisationUnitsFromParent(config.rootID)
  const locations = await sendLocationsToGoData(R.identity, organisationUnits)
  fs.writeFileSync(outputFile, JSON.stringify(locations))
}

function findGroupingOutbreak (outbreaks, groupingLevel, outbreak) {
  if (outbreak.orgUnit.level <= (groupingLevel + 1)) {
    return outbreak
  } else {
    return findGroupingOutbreak(
      outbreaks, groupingLevel, R.prop(outbreak.orgUnit.parent.id, outbreaks))
  }
}

const createOutbreaks = (dhis2, godata, config) => async () => {
  const [ programs, organisationUnits ] = await Promise.all([
    dhis2.getPrograms(),
    dhis2.getOrganisationUnitsFromParent(config.rootID)
  ])

  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)

  const trackedEntities = await loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID)

  const maxLevel = R.pipe(R.map(R.prop('level')), R.reduce(R.max, 0))(organisationUnits)
  const groupingLevel = config.outbreakCreationMode === constants.OUTBREAK_CREATION_MODE.EXPAND
    ? maxLevel
    : config.outbreakCreationGroupingLevel != null
      ? R.min(config.outbreakCreationGroupingLevel, maxLevel)
      : maxLevel

  const outbreaks = R.reduce(
    (acc, el) => R.assoc(el.id, { orgUnit: el, trackedEntities: [] }, acc),
    {}, organisationUnits)

  return R.pipe(
    R.flatten,
    R.reduce((outbreaks, te) => R.over(
      R.lensPath([te.orgUnit, 'trackedEntities']),
      R.append(te),
      outbreaks
    ), outbreaks),
    (outbreaks) => R.reduce((acc, ob) => {
      const groupingOutbreak = findGroupingOutbreak(outbreaks, groupingLevel, ob)
      
      if (R.prop(groupingOutbreak.orgUnit.id, acc) == null) {
        return R.assoc(groupingOutbreak.orgUnit.id, groupingOutbreak, acc)
      } else {
        return R.over(
          R.lensPath([groupingOutbreak.orgUnit.id, 'trackedEntities']),
          R.concat(ob.trackedEntities),
          acc)
      }
    }, {}, R.values(outbreaks)),
    R.values,
    R.map(createOutbreakMapping(config)),
    postOutbreaks(godata)
  )(trackedEntities)
}

const copyCases = (dhis2, godata, config) => async () => {
  const [ programs, programStages, dataElements, attributes, organisationUnits, outbreaks ] = await Promise.all([
    dhis2.getPrograms(),
    dhis2.getProgramStages(),
    dhis2.getDataElements(),
    dhis2.getTrackedEntitiesAttributes(),
    dhis2.getOrganisationUnitsFromParent(config.rootID),
    godata.getOutbreaks()])

  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  const [ labRequestID, labResultsID, symptomsID ] = R.map(getIDFromDisplayName(programStages), [
    config.dhis2KeyProgramStages.labRequest,
    config.dhis2KeyProgramStages.labResults,
    config.dhis2KeyProgramStages.symptoms
  ])
  const confirmedTestConditions = R.map(
    R.adjust(0, getIDFromDisplayName(dataElements)),
    config.dhis2DataElementsChecks.confirmedTest)
  // Change TrackedEntitiesAttributes names to ids
  config = R.over(
    R.lensProp('dhis2KeyAttributes'),
    R.mapObjIndexed((value) => {
      return R.tap(console.log, R.find(R.propEq('displayName', value), attributes).id)
    }),
    config)

  return await R.pipe(
    R.flatten,
    R.map(assignOutbreak(outbreaks, organisationUnits)),
    R.map(R.pipe(
      addLabResultStage(labResultsID),
      addLabRequestStage(labRequestID),
      addLabResult(confirmedTestConditions),
      addCaseClassification(config)
    )),
    R.map(trackedEntityToCase(config)),
    sendCasesToGoData(godata)
  )(await loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID))
}

module.exports = { copyOrganisationUnits, createOutbreaks, copyCases }

async function loadTrackedEntityInstances (dhis2, organisationUnits, casesProgramID) {
  return Promise.all(
    R.map(async ou => {
      const trackedEntityInstances = await dhis2.getTrackedEntityInstances(ou.id, { program: casesProgramID })
      
      return Promise.all(R.pipe(
        R.filter(_ => _ != null),
        R.map(async te =>
          R.assoc('events', await dhis2.getTrackedEntityEvents(te.trackedEntityInstance), te))
        )(trackedEntityInstances))
    }, organisationUnits)
  )
}

function adaptLocationToHierarchy (location) {
  return {
    location: R.dissoc('children', location),
    children: R.map(adaptLocationToHierarchy, location.children)
  }
}

function createLocationHierarchy (locations) {
  const rootID = locations[0].id
  const indexedLocations = R.reduce((acc, location) => R.assoc(location.id, location, acc), {}, locations)
  return R.pipe(
    R.reverse,
    R.reduce((indexedLocations, location) => {
      const parentID = R.prop('parentLocationId', location)
      if (parentID != null) {
        const parent = R.prop(parentID, indexedLocations)
        parent.children.push(location)
      }
      return indexedLocations
    }, indexedLocations),
    R.prop(rootID),
    adaptLocationToHierarchy
  )(locations)
}

function sendLocationsToGoData (createLocation, organisationUnits) {
  return R.pipe(
    R.sortBy(R.prop('level')),
    R.map(organisationUnitToLocation),
    createLocationHierarchy,
    _ => [_]
  )(organisationUnits)
}

function postOutbreaks (godata) {
  return (outbreaks) => Promise.all(R.map(
    outbreak => godata.createOutbreak(outbreak),
    outbreaks
  ))
}

function findOutbreackForCase (available, orgUnits, locationID) {
  if (available[locationID] != null) {
    return R.path([locationID, 0, 'id'], available)
  } else {
    return findOutbreackForCase(available, orgUnits, R.find(R.propEq('id', locationID), orgUnits).parent.id)
  }
}

function assignOutbreak (outbreaks, orgUnits) {
  const locationsAvaliable = R.pipe(
    R.reduceBy((acc, el) => R.append(el, acc), [], R.path(['locationIds', 0]))
  )(outbreaks)
  return (trackedEntity) => R.assoc(
    'outbreak',
    findOutbreackForCase(locationsAvaliable, orgUnits, trackedEntity.orgUnit),
    trackedEntity)
}

function addLabRequestStage (labRequestID) {
  return (te) =>
    R.assoc('labRequestStage', R.find(R.propEq('programStage', labRequestID), te.events), te)
}

// TODO: one tracked entity can have more than one event of this kind
// This is not handled right now
function addLabResultStage (labResultsID) {
  return (te) =>
    R.assoc('labResultStage', R.find(R.propEq('programStage', labResultsID), te.events), te)
}

function findDataValueByID (dataValues, id) {
  return R.find(R.propEq('dataElement', id), dataValues || [])
}

function checkDataValue (dataValues, dataElement, value) {
  return R.propEq(
    'value',
    value,
    findDataValueByID(dataValues, dataElement) || {}
  )
}

function checkDataValuesConditions (conditions) {
  return R.allPass(
    R.map(
      ([dataElement, value]) => te => 
        checkDataValue(R.path(['labResultStage', 'dataValues'], te), dataElement, value),
      conditions
    ))
}

// TODO: support for 'inconclusive', 'not performed'... results
function addLabResult (confirmedTestConditions) {
  return (te) => R.ifElse(
    R.has('labResultStage'),
    R.assoc('labResult',
      checkDataValuesConditions(confirmedTestConditions)(te) ? 'POSITIVE' : 'NEGATIVE'
    ),
    R.identity()
  )(te)
}

function addCaseClassification () {
  return (te) => R.assoc('caseClassification',
    te.labResult === 'POSITIVE'
      ? 'CONFIRMED'
      : te.labResult === 'NEGATIVE' && te.labResultStage != null
        ? 'NOT_A_CASE_DISCARDED'
        : te.labResult == null && te.labRequestStage != null
          ? 'PROBABLE'
          : 'SUSPECT',
    te)
}

function sendCasesToGoData (godata) {
  return R.pipe(
    R.groupBy(R.prop('outbreak')),
    async (outbreaks) => {
      const user = await godata.login()
      console.log(user)
      for (let outbreak in outbreaks) {
        const cases = outbreaks[outbreak]
        console.log(outbreak)
        console.log(await godata.activateOutbreakForUser(user.userId, outbreak))
        await Promise.all(R.map(case_ => godata.createOutbreakCase(outbreak, R.dissoc('outbreak', case_)), cases))
      }
    }
  )
}

