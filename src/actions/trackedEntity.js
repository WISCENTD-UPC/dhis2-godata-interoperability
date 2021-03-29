
import * as R from 'ramda'

import { 
  caseToTrackedEntity,
  healthOutcomeSelector
} from '../mappings/trackedEntity'
import {
  dependencies,
  mapListDisplayNameToIDs,
  getIDFromDisplayName,
  allPromises,
  logAction,
  logDone
} from '../util'
import { loadCases } from './common'

export const copyTrackedEntities = (dhis2, godata, config, _) => async () => {
  _ = dependencies({ loadCases, logAction, logDone }, _)

  _.logAction('Fetching resources')
  const [
    programs,
    programStages,
    dataElements,
    attributes,
    trackedEntityTypes,
    organisationUnits,
    outbreaks ] = await loadResources(dhis2, godata, config)
  _.logDone()

  _.logAction('Reading configuration')
  config = R.pipe(
    R.over(
      R.lensProp('dhis2CasesProgram'),
      _ => getIDFromDisplayName(programs, _)
    ),
    mapListDisplayNameToIDs(attributes, 'dhis2KeyAttributes'), 
    mapListDisplayNameToIDs(trackedEntityTypes, 'dhis2KeyTrackedEntityTypes'),
    mapListDisplayNameToIDs(programStages, 'dhis2KeyProgramStages'),
    mapListDisplayNameToIDs(dataElements, 'dhis2KeyDataElements'),
  )(config)
  _.logDone()

  _.logAction('Fetching cases from Go.Data')
  const cases = await _.loadCases(godata, outbreaks)
  const teIDs = await dhis2.getNewIds(cases.length)
  _.logDone()

  await processTrackedEntities(
    dhis2,
    config,
    organisationUnits,
    teIDs,
    cases,
    _
  )

}

// Load resources from dhis2 and godata
export function loadResources (dhis2, godata) {
  return allPromises([
    dhis2.getPrograms(),
    dhis2.getProgramStages(),
    dhis2.getDataElements(),
    dhis2.getTrackedEntitiesAttributes(),
    dhis2.getTrackedEntityTypes(),
    dhis2.getOrganisationUnits(),
    godata.getOutbreaks()])
}

export async function processTrackedEntities (dhis2, config, organisationUnits, teIDs, cases, _) {
  _ = dependencies({ logAction, logDone }, _)

   _.logAction('Transforming cases to tracked entity instances')
  const trackedEntities = await transformOrgUnits(dhis2, config, cases, organisationUnits, teIDs)
  _.logDone()

  _.logAction('Sending tracked entity instances to DHIS2')
  const response = await sendTrackedEntitiesToDHIS2(dhis2, trackedEntities)
  _.logDone()
}

// Maps case to tracked entity, assigns DHIS2 ids and returns an array
// Saves dict with old cases IDs from godata and new tracked entities IDs from dhis2
export async function transformOrgUnits (dhis2, config, cases, orgUnits, teIDs) {
  const oldIds = cases.map(c => c.id)
  const idsDict = R.zipObj(oldIds, teIDs)
  await dhis2.saveOnDataStore('dhis-godata-interoperability', 'trackedEntityIDs', idsDict)

  return {
    trackedEntityInstances: R.pipe(
      assignDHIS2IDs(orgUnits, idsDict),
      R.map(caseToTrackedEntity(config)),
      addEvents(config)
    )(cases)
  }
}

// Find the organisation unit a tracked entity instance 
// belongs to from the orgUnits list.
export function assignDHIS2IDs (orgUnits, idsDict) {
  return (cases) => {
    if (cases.length === 0) return {}

    return R.map(
      R.pipe(
        R.over(R.lensProp('id'), id => idsDict[id]),
        R.over(
          R.lensProp('usualPlaceOfResidenceLocationId'), 
          code => R.find(R.propEq('code', code))(orgUnits).id
        )
      )
    )(cases)
  }
}

export function addEvents (config) {
  return (trackedEntities) => { 
    return R.map(te => {
      const trackedEntity = te.outcomeId != null ?
        R.over(
          R.lensPath(['enrollments', 0, 'events']),
          (events) => R.append(healthOutcomeSelector(config)(te), events), 
        te) : te

      return R.pipe(
        R.dissoc('outcomeId'),
        R.dissoc('dateOfOutcome')
      )(trackedEntity)
    }
    )(trackedEntities)
  }
}

// Send tracked entity instances to DHIS2
export function sendTrackedEntitiesToDHIS2 (dhis2, trackedEntities) {
  return dhis2.createTrackedEntityInstances(trackedEntities)
}