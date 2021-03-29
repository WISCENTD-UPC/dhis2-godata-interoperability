
import * as R from 'ramda'

import { locationToOrganizationUnit } from '../mappings/orgUnit'
import { dependencies, logAction, logDone } from '../util'

export const copyLocations = (dhis2, godata, config, _) => async () => {
  _ = dependencies({ logAction, logDone }, _)
  
  _.logAction('Fetching locations')
  const locations = await godata.getLocations()
  _.logDone()

  _.logAction('Transforming organisation units to locations')
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
  )
  const orgUnits = transformOrgUnits(config, locations, newIds)
  _.logDone()

  _.logAction('Sending organisation units to DHIS2')
  const response = await sendOrgUnitsToDHIS2(dhis2, orgUnits)
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
export function createOrgUnitHierarchy (config) {
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
      R.map(locationToOrganizationUnit(config)),
      exchangeIds(idsDict),
      createOrgUnitHierarchy(config)
    )(locations)
  }
}

export async function sendOrgUnitsToDHIS2 (dhis2, orgUnits) {
  return await dhis2.createOrganisationUnits(orgUnits)
}
