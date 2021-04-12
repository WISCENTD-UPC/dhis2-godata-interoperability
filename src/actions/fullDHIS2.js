import * as R from 'ramda'
import { transformOrgUnits, sendOrgUnitsToDHIS2 } from './orgUnit'
import { processTrackedEntities } from './trackedEntity'
import { loadCases } from './common'
import {
  dependencies,
  getIDFromDisplayName,
  mapListDisplayNameToIDs,
  allPromises,
  logAction,
  logDone
} from '../util'

export const fullTransferDHIS2 = (dhis2, godata, config, _) => async () => {
    _ = dependencies({
        loadResources,
        loadCases,
        logAction,
        logDone
    }, _)

    const [
        programs,
        programStages,
        dataElements,
        attributes,
        trackedEntityTypes,
        organisationUnits,
        outbreaks,
        locations 
    ] = await loadResources(dhis2, godata, config)

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

    _.logAction('Transforming organisation units to locations')
    const newIds = await dhis2.getNewIds(locations.length)
    const orgUnits = transformOrgUnits(config, locations, newIds)
    _.logDone()

    _.logAction('Sending organisation units to DHIS2')
    await sendOrgUnitsToDHIS2(config, dhis2, orgUnits)
    if (indexedDB !== undefined) {
        await deleteDB('dhis2tc')
    }
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

export function loadResources (dhis2, godata) {
    return allPromises([
        dhis2.getPrograms(),
        dhis2.getProgramStages(),
        dhis2.getDataElements(),
        dhis2.getTrackedEntitiesAttributes(),
        dhis2.getTrackedEntityTypes(),
        dhis2.getOrganisationUnits(),
        godata.getOutbreaks(),
        godata.getLocations()
    ])
}