
import * as R from 'ramda'

import { processMetadata } from './metadata'
import { selectGroupingLevel, processOutbreaks } from './outbreak'
import { processCases } from './case'
import { processContacts } from './contact'
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

export const fullTransferGoData = (dhis2, godata, config, _) => async () => {
  _ = dependencies({
    loadResources,
    loadTrackedEntityInstances,
    logAction,
    logDone
  }, _)

  const [
    user,
    optionSets,
    options,
    programs,
    programStages,
    dataElements,
    attributes,
    relationships,
    orgUnits
  ] = await _.loadResources(dhis2, godata, config)

  _.logAction('Reading configuration')
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  config = mapAttributeNamesToIDs(attributes)(config)
  const groupingLevel = selectGroupingLevel(orgUnits, config)
  _.logDone()

  const cases = await _.loadTrackedEntityInstances(dhis2, orgUnits, casesProgramID)

  const results = {}
  results.metadata = await processMetadata(dhis2, godata, config, optionSets, options)
  results.outbreaks = await processOutbreaks(
    godata, config, orgUnits, groupingLevel)(cases)
  results.cases = await processCases(
    godata, config, orgUnits, programStages, dataElements, cases)(results.outbreaks)
  results.contacts = await processContacts(
    dhis2, godata, config, user)(results.outbreaks)

  return results
}

export function loadResources (dhis2, godata, config) {
  return allPromises([
    godata.login(),
    dhis2.getOptionSets(),
    dhis2.getOptions(),
    dhis2.getPrograms(),
    dhis2.getProgramStages(),
    dhis2.getDataElements(),
    dhis2.getTrackedEntitiesAttributes(),
    dhis2.getRelationshipTypes(),
    dhis2.getOrganisationUnitsFromParent(config.rootID)
  ])
}

