
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

export const fullTransfer = (dhis2, godata, config, _) => async () => {
  _ = dependencies({ loadTrackedEntityInstances, logAction }, _)

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
  ] = await loadResources(dhis2, godata, config)

  _.logAction('Reading configuration')
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  config = mapAttributeNamesToIDs(attributes)(config)
  const groupingLevel = selectGroupingLevel(orgUnits, config)
  logDone()

  const cases = await _.loadTrackedEntityInstances(dhis2, orgUnits, casesProgramID)

  return await promisePipeline(
    () => processMetadata(dhis2, godata, config, optionSets, options),
    () => processOutbreaks(godata, config, orgUnits, groupingLevel)(cases),
    (outbreaks) => R.pipe(R.tap(console.log), promisePipeline(
      () => processCases(godata, config, orgUnits, programStages, dataElements, cases)(outbreaks),
      () => processContacts(dhis2, godata, config, user)(outbreaks)
    ))()
  )()
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

