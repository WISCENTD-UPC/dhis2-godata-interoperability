
import * as R from 'ramda'

import { locationToOrganizationUnit } from '../mappings/orgUnit'
import { 
  getIDFromDisplayName,
  dependencies, 
  logAction, 
  logDone,
  cleanCache
} from '../util'

export const copyLocations = (dhis2, godata, config, _) => async () => {
  _ = dependencies({ logAction, logDone, cleanCache }, _)
  
  _.logAction('Fetching locations')
  const locations = await godata.getLocations()
  _.logDone()

  _.logAction('Transforming locations to organisation units')
  const newIds = await dhis2.getNewIds(locations.length)
  const programs = await dhis2.getPrograms()
  config = R.pipe(
    R.over(
      R.lensProp('dhis2CasesProgram'),
      _ => getIDFromDisplayName(programs, _)
    ),
    R.over(
      R.lensProp('dhis2ContactsProgram'),
      _ => getIDFromDisplayName(programs, _)
    ),
  )(config)

  const orgUnits = transformOrgUnits(config, locations, newIds)
  _.logDone()

  _.logAction('Sending organisation units to DHIS2')
  await sendOrgUnitsToDHIS2(config, dhis2, orgUnits)
  await _.cleanCache()
  _.logDone()
}

// Adds an orgUnit to its parent children array
export function addOrgUnitToParent (orgUnitsList, orgUnit) {
  const parentID = orgUnit.parent != undefined ? orgUnit.parent.id : null
  if (parentID != null) {
    const parent = R.find(R.propEq('id', parentID))(orgUnitsList)
    parent.children.push({ id: orgUnit.id })
  } 
  return orgUnitsList
}

// Given the list of orgUnits (already transformed from locations)
// creates a hierarchy (parent-children relationships)
export function createOrgUnitHierarchy () {
  return (orgUnits) => {
    if (orgUnits.length === 0) return {}

    return R.pipe(
      R.sortBy(R.prop('level')),
      R.reverse,
      R.reduce(addOrgUnitToParent, orgUnits),
    )(orgUnits)
  }
}

export function exchangeIds (idsDict) {
  return (orgUnits) => {
    if (orgUnits.length === 0) return {}

    const exchange = (id) => idsDict[id]
    const checkParent = (ou) => ou.parent.id != undefined ? ou : R.dissoc('parent')(ou)
    return R.map(
      R.pipe(
        R.over(R.lensProp("id"), exchange),
        R.over(R.lensPath(["parent", "id"]), exchange),
        checkParent
      )
    )(orgUnits)
  }
}

// Maps location to organization unit, creates the hierarchy and returns an array
export function transformOrgUnits (config, locations, newIds) {
  const oldIds = locations.map(ou => ou.id)
  const idsDict = R.zipObj(oldIds, newIds)

  return {
    organisationUnits: R.pipe(
      R.map(locationToOrganizationUnit()),
      exchangeIds(idsDict),
      createOrgUnitHierarchy(config)
    )(locations)
  }
}

export async function sendOrgUnitsToDHIS2 (config, dhis2, orgUnits) {
  await dhis2.createOrganisationUnits(orgUnits)
  const user = await dhis2.getCurrentUser()

  const permissions = {
    firstName: user.firstName,
    surname: user.surname,
    userCredentials: user.userCredentials,
    teiSearchOrganisationUnits: [
      ...user.teiSearchOrganisationUnits,
    ],
    organisationUnits: [
      ...user.organisationUnits,
    ],
    dataViewOrganisationUnits: [
      ...user.dataViewOrganisationUnits,
    ]
  }

  const programs = {
    additions: [
      { id: config.dhis2CasesProgram }, 
      { id: config.dhis2ContactsProgram }
    ],
    deletions: []
  }

  orgUnits.organisationUnits.map(ou => {
    permissions.teiSearchOrganisationUnits.push({ id: ou.id })
    permissions.organisationUnits.push({ id: ou.id })
    permissions.dataViewOrganisationUnits.push({ id: ou.id })
  })

  await dhis2.givePermissions(user.userCredentials.userInfo.id, permissions)

  orgUnits.organisationUnits.map(async ou => {
    try {
      await dhis2.addProgramsToOrgUnit(ou.id, programs)
    } catch {}
  })

}
