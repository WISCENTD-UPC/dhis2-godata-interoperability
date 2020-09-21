
const R = require('ramda')

const { loadTrackedEntityInstances } = require('./common')
const {
  getIDFromDisplayName,
  mapAttributeNamesToIDs,
  allPromises,
  logAction,
  logDone } = require('../util')
const { trackedEntityToCase } = require('../mappings/case')

// Copy tracked enitities in the case program from dhis2 to godata (transforming the schema
// and adding extra information like case classifiction)
const copyCases = (dhis2, godata, config, _ = { loadTrackedEntityInstances }) => async () => {
  logAction('Fetching resources')
  const [
    programs,
    programStages,
    dataElements,
    attributes,
    organisationUnits,
    outbreaks ] = await loadResources(dhis2, godata, config)
  logDone()

  logAction('Reading configuration')
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  const [ labRequestID, labResultsID, symptomsID ] = R.map(getIDFromDisplayName(programStages), [
    config.dhis2KeyProgramStages.labRequest,
    config.dhis2KeyProgramStages.labResults,
    config.dhis2KeyProgramStages.symptoms
  ])
  const confirmedTestConditions = R.map(
    R.adjust(0, getIDFromDisplayName(dataElements)),
    config.dhis2DataElementsChecks.confirmedTest)
  config = mapAttributeNamesToIDs(attributes)(config)
  logDone()

  logAction('Fetching tracked entity instances')
  const trackedEntities = await _.loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID)
  logDone()

  await R.pipe(
    R.flatten,
    R.tap(() => logAction('Assiging outbreaks to tracked entity instances')),
    R.map(assignOutbreak(outbreaks, organisationUnits)),
    R.tap(() => logDone()),
    R.tap(() => logAction('Adding additional information to tracked entity instances')),
    R.map(addLabInformation(labResultsID, labRequestID, confirmedTestConditions, config)),
    R.tap(() => logDone()),
    R.tap(() => logAction('Transforming tracked entity instances to cases')),
    R.map(trackedEntityToCase(config)),
    R.tap(() => logDone()),
    R.tap(() => logAction('Sending cases to Go.Data')),
    sendCasesToGoData(godata)
  )(trackedEntities)

  logDone()
}

// Load resources from dhis2 and godata
function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getPrograms(),
    dhis2.getProgramStages(),
    dhis2.getDataElements(),
    dhis2.getTrackedEntitiesAttributes(),
    dhis2.getOrganisationUnitsFromParent(config.rootID),
    godata.getOutbreaks()])
}

// Find the grouping outbreak a tracked entity instance (its associated org unit)
// belongs to from the avaliable locations.
function findOutbreackForCase (available, orgUnits, locationID) {
  if (available[locationID] != null) {
    return R.path([locationID, 0, 'id'], available)
  } else {
    const parentID = R.find(R.propEq('id', locationID), orgUnits).parent.id
    return findOutbreackForCase(available, orgUnits, parentID)
  }
}

// Find the grouping outbreak a tracked entity instance (its associated org unit)
// belongs to from the outbreak list.
function assignOutbreak (outbreaks, orgUnits) {
  const locationsAvaliable = R.pipe(
    R.reduceBy((acc, el) => R.append(el, acc), [], R.path(['locationIds', 0]))
  )(outbreaks)
  return (trackedEntity) => R.assoc(
    'outbreak',
    findOutbreackForCase(locationsAvaliable, orgUnits, trackedEntity.orgUnit),
    trackedEntity)
}

// Add lab request stage to a tracked entity instance
function addLabRequestStage (labRequestID) {
  return (te) =>
    R.assoc('labRequestStage', R.find(R.propEq('programStage', labRequestID), te.events), te)
}

// Add lab results stage to a tracked entity instance
// TODO: one tracked entity can have more than one event of this kind
// This is not handled right now
function addLabResultStage (labResultsID) {
  return (te) =>
    R.assoc('labResultStage', R.find(R.propEq('programStage', labResultsID), te.events), te)
}

// Find data value from the data values list given the id of the element
function findDataValueByID (dataValues, id) {
  return R.find(R.propEq('dataElement', id), dataValues || [])
}

// Check that a dataElement from a list has a specific value
function checkDataValue (dataValues, dataElement, value) {
  return R.propEq(
    'value',
    value,
    findDataValueByID(dataValues, dataElement) || {}
  )
}

// Check a series of data elements in a list have specific values
function checkDataValuesConditions (conditions) {
  return R.allPass(
    R.map(
      ([dataElement, value]) => te => 
        checkDataValue(R.path(['labResultStage', 'dataValues'], te), dataElement, value),
      conditions
    ))
}

// Add lab result to a tracked entity
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

// Add case classification to a tracked entity instance
function addCaseClassification () {
  return (te) => R.assoc('caseClassification',
    te.labResult === 'POSITIVE'
      ? 'CONFIRMED'
      : te.labResult === 'NEGATIVE' && te.labResultStage != null
        ? 'NOT_A_CASE_DISCARDED'
        : te.labResultStage == null && te.labRequestStage != null
          ? 'PROBABLE'
          : 'SUSPECT',
    te)
}

// Add additional lab information and case classification to a tracked entity instance
function addLabInformation (labResultsID, labRequestID, confirmedTestConditions, config) {
  return R.pipe(
    addLabResultStage(labResultsID),
    addLabRequestStage(labRequestID),
    addLabResult(confirmedTestConditions),
    addCaseClassification(config)
  )
}

// Send cases to go data, activating outbreaks and login user automatically
function sendCasesToGoData (godata) {
  return R.pipe(
    R.groupBy(R.prop('outbreak')),
    async (outbreaks) => {
      const user = await godata.login()
      for (let outbreak in outbreaks) {
        const cases = outbreaks[outbreak]
        await godata.activateOutbreakForUser(user.userId, outbreak)
        await allPromises(R.map(case_ => godata.createOutbreakCase(outbreak, R.dissoc('outbreak', case_)), cases))
      }
    }
  )
}

module.exports = { copyCases }

