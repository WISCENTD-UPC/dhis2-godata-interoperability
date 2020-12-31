
import * as R from 'ramda'

import { loadTrackedEntityInstances } from './common'
import {
  dependencies,
  getIDFromDisplayName,
  mapAttributeNamesToIDs,
  allPromises,
  promisePipeline,
  logAction,
  logDone
} from '../util'
import { trackedEntityToCase } from '../mappings/case'

// Copy tracked enitities in the case program from dhis2 to godata (transforming the schema
// and adding extra information like case classifiction)
export const copyCases = (dhis2, godata, config, _) => async () => {
  _ = dependencies({ loadTrackedEntityInstances, logAction, logDone }, _)

  _.logAction('Fetching resources')
  const [
    programs,
    programStages,
    dataElements,
    attributes,
    organisationUnits,
    outbreaks ] = await loadResources(dhis2, godata, config)
  _.logDone()

  _.logAction('Reading configuration')
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  config = mapAttributeNamesToIDs(attributes)(config)
  _.logDone()

  _.logAction('Fetching tracked entity instances')
  const cases = await _.loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID)
  _.logDone()
  
  return await processCases(
    godata,
    config,
    organisationUnits,
    programStages,
    dataElements,
    cases,
    _
  )(outbreaks)
}

// Load resources from dhis2 and godata
export function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getPrograms(),
    dhis2.getProgramStages(),
    dhis2.getDataElements(),
    dhis2.getTrackedEntitiesAttributes(),
    dhis2.getOrganisationUnitsFromParent(config.rootID),
    godata.getOutbreaks()])
}

// Transform resources from dhis2 to create cases in Go.Data
export function processCases (godata, config, organisationUnits, programStages, dataElements, cases, _) {
  _ = dependencies({ logAction, logDone }, _)

  _.logAction('Transforming resources')
  const programStagesIDs = R.map(getIDFromDisplayName(programStages), [
    config.dhis2KeyProgramStages.clinicalExamination,
    config.dhis2KeyProgramStages.labRequest,
    config.dhis2KeyProgramStages.labResults,
    config.dhis2KeyProgramStages.healthOutcome,
    config.dhis2KeyProgramStages.symptoms
  ])
  const confirmedTestConditions = R.map(
    R.adjust(0, getIDFromDisplayName(dataElements)),
    config.dhis2DataElementsChecks.confirmedTest)
  _.logDone()

  return (outbreaks) => promisePipeline(
    R.tap(() => _.logAction('Assiging outbreaks to tracked entity instances')),
    R.map(assignOutbreak(outbreaks, organisationUnits)),
    R.tap(() => _.logDone()),
    R.tap(() => _.logAction('Adding additional information to tracked entity instances')),
    R.map(addLabInformation(programStagesIDs, dataElements, confirmedTestConditions, config)),
    R.tap(() => _.logDone()),
    R.tap(() => _.logAction('Transforming tracked entity instances to cases')),
    R.map(trackedEntityToCase(config)),
    R.tap(() => _.logDone()),
    R.tap(() => _.logAction('Sending cases to Go.Data')),
    sendCasesToGoData(godata),
    R.tap(() => _.logDone())
  )(cases)
}

// Find the grouping outbreak a tracked entity instance (its associated org unit)
// belongs to from the avaliable locations.
export function findOutbreackForCase (available, orgUnits, locationID) {
  if (available[locationID] != null) {
    return R.path([locationID, 0, 'id'], available)
  } else {
    const parentID = R.find(R.propEq('id', locationID), orgUnits).parent.id
    return findOutbreackForCase(available, orgUnits, parentID)
  }
}

// Find the grouping outbreak a tracked entity instance (its associated org unit)
// belongs to from the outbreak list.
export function assignOutbreak (outbreaks, orgUnits) {
  const locationsAvaliable = R.pipe(
    R.reduceBy((acc, el) => R.append(el, acc), [], R.path(['locationIds', 0]))
  )(outbreaks)
  return (trackedEntity) => R.assoc(
    'outbreak',
    findOutbreackForCase(locationsAvaliable, orgUnits, trackedEntity.orgUnit),
    trackedEntity)
}

// Find an event in a list by ID and parse is dataElements, including the displayName
export function findAndTransformEvent (dataElements, programID, events) {
  return R.pipe(
    R.find(R.propEq('programStage', programID)),
    R.prop('dataValues'),
    R.defaultTo([]),
    R.map(dataValue => R.assoc(
      'displayName',
      R.pipe(R.find(R.propEq('id', dataValue.dataElement)), R.prop('displayName'))(dataElements),
      dataValue))
  )(events)
}

// ADD the parsed data elements of an event of a tracked entity instance
// by the program stage ID the event is part of
export function addEvent (dataElements, eventName, programStageID) {
  return (te) => {
    const event = findAndTransformEvent(dataElements, programStageID, te.events)
    return R.assoc(eventName, event, te)
  }
}

// Find data value from the data values list given the id of the element
export function findDataValueByID (dataValues, id) {
  return R.find(R.propEq('dataElement', id), dataValues || [])
}

// Check that a dataElement from a list has a specific value
export function checkDataValue (dataValues, dataElement, value) {
  return R.propEq(
    'value',
    value,
    findDataValueByID(dataValues, dataElement) || {}
  )
}

// Check a series of data elements in a list have specific values
export function checkDataValuesConditions (conditions) {
  return R.allPass(
    R.map(
      ([dataElement, value]) => te => 
        checkDataValue(R.prop('labResultStage', te), dataElement, value),
      conditions
    ))
}

// Add lab result to a tracked entity
// TODO: support for 'inconclusive', 'not performed'... results
export function addLabResult (confirmedTestConditions) {
  return (te) => R.ifElse(
    R.propSatisfies(_ => _ !== [], 'labResultStage'),
    R.assoc('labResult',
      checkDataValuesConditions(confirmedTestConditions)(te) ? 'POSITIVE' : 'NEGATIVE'
    ),
    R.identity()
  )(te)
}

// Add case classification to a tracked entity instance
export function addCaseClassification () {
  return (te) => R.assoc('caseClassification',
    te.labResult === 'POSITIVE'
      ? 'CONFIRMED'
      : te.labResult === 'NEGATIVE' && te.labResultStage.length > 0
        ? 'NOT_A_CASE_DISCARDED'
        : te.labRequestStage.length > 0
          ? 'PROBABLE'
          : 'SUSPECT',
    te)
}

// Add additional lab information and case classification to a tracked entity instance
export function addLabInformation (programsIDs, dataElements, confirmedTestConditions, config) {
  const [
    clinicalExaminationID,
    labRequestID,
    labResultsID,
    healthOutcomeID,
    symptomsID ] = programsIDs
  const addEventByID = R.partial(addEvent, [ dataElements ])

  return R.pipe(
    addEventByID('clinicalExamination', clinicalExaminationID),
    addEventByID('labRequestStage', labRequestID),
    addEventByID('labResultStage', labResultsID),
    addEventByID('healthOutcome', healthOutcomeID),
    addEventByID('symptoms', symptomsID),
    addLabResult(confirmedTestConditions),
    addCaseClassification(config)
  )
}

// Send cases to go data, activating outbreaks and login user automatically
export function sendCasesToGoData (godata) {
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

