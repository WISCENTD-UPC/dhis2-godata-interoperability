import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

import * as orgUnitActions from '../../src/actions/orgUnit'
import config from '../../src/config'
import constants from '../../src/config/constants/godata'
import { createUUIDs } from '../test-util/util'
import { getIDFromDisplayName } from '../../src/util'
import { programs, locations, orgUnitsIDs, dhis2User } from '../test-util/mocks'

const uuids = createUUIDs()
const resolve = Promise.resolve.bind(Promise)
const testConfig = R.pipe(
  R.over(
    R.lensProp('dhis2CasesProgram'),
    _ => getIDFromDisplayName(programs, _)
  ),
  R.over(
    R.lensProp('dhis2ContactsProgram'),
    _ => getIDFromDisplayName(programs, _)
  ),
)(config)

test('orgUnitActions.copyLocations', async () => {
  const getPrograms = jest.fn().mockReturnValue(resolve(programs))
  const getNewIds = jest.fn().mockReturnValue(resolve(orgUnitsIDs))
  const getLocations = jest.fn().mockReturnValue(resolve(locations))
  const createOrganisationUnits = jest.fn()
  const getCurrentUser = jest.fn().mockReturnValue(resolve(dhis2User))
  const givePermissions = jest.fn()
  const addProgramsToOrgUnit = jest.fn()
  
  const dhis2 = { 
    getPrograms, 
    getNewIds,
    createOrganisationUnits,
    getCurrentUser,
    givePermissions,
    addProgramsToOrgUnit
  }
  const godata = { getLocations }

  await orgUnitActions.copyLocations(dhis2, godata, config)()

  expect(getPrograms).toHaveBeenCalledWith()
  expect(getPrograms).toHaveBeenCalledTimes(1)
  expect(getNewIds).toHaveBeenCalledWith(locations.length)
  expect(getNewIds).toHaveBeenCalledTimes(1)
  expect(getLocations).toHaveBeenCalledWith()
  expect(getLocations).toHaveBeenCalledTimes(1)
})

test('orgUnitActions.transformOrgUnits', () => {
  const response = orgUnitActions.transformOrgUnits(testConfig, locations, orgUnitsIDs)
  const expected = { 
    organisationUnits: [
      orgUnit_(0, locations[0], {
        children: [
          { id: orgUnitsIDs[2] },
          { id: orgUnitsIDs[1] }
        ]
      }),
      orgUnit_(1, locations[1], {
        children: [{ id: orgUnitsIDs[3] }],
        parent: { id: orgUnitsIDs[0] }
      }),
      orgUnit_(2, locations[2], { 
        children: [], 
        parent: { id: orgUnitsIDs[0] }
      }),
      orgUnit_(3, locations[3], { 
        children: [], 
        parent: { id: orgUnitsIDs[1] }
      })
    ]
  }
  expect(response).toStrictEqual(expected)
})

test('orgUnitActions.addOrgUnitToParent', () => {
  const orgUnits = [
    { id: uuids('o-1'), children: [] },
    { id: uuids('o-2'), children: [] },
    { id: uuids('o-3'), children: [] }
  ]
  const orgUnit = { id: uuids('o-3'), parent: { id: uuids('o-1') } }
  const response = orgUnitActions.addOrgUnitToParent(orgUnits, orgUnit)

  orgUnits[0].children.push({ id: orgUnit.id })
  expect(response).toStrictEqual(orgUnits)
})

test('orgUnitActions.createOrgUnitHierarchy', () => {
  const orgUnits = [
    { id: uuids('o-1'), level: 1, children: [] },
    { id: uuids('o-2'), level: 2, children: [], parent: { id: uuids('o-1') } },
    { id: uuids('o-3'), level: 3, children: [], parent: { id: uuids('o-2') } }
  ]
  const expected = [
    { id: uuids('o-1'), level: 1, children: [{ id: uuids('o-2') }] },
    { id: uuids('o-2'), level: 2, children: [{ id: uuids('o-3') }], parent: { id: uuids('o-1') } },
    { id: uuids('o-3'), level: 3, children: [], parent: { id: uuids('o-2') } }
  ]
  const response = orgUnitActions.createOrgUnitHierarchy()(orgUnits)
  expect(response).toStrictEqual(expected)
})

test('orgUnitActions.exchangeIds', () => {
  const orgUnits = [
    { id: uuids('o-1'), parent: { id: null } },
    { id: uuids('o-2'), parent: { id: uuids('o-1') } },
    { id: uuids('o-3'), parent: { id: uuids('o-2') } },
    { id: uuids('o-4'), parent: { id: uuids('o-2') } },
  ]
  const idsDict = R.zipObj(orgUnits.map(ou => ou.id), orgUnitsIDs)
  const expected = [
    { id: orgUnitsIDs[0] },
    { id: orgUnitsIDs[1], parent: { id: orgUnitsIDs[0] } },
    { id: orgUnitsIDs[2], parent: { id: orgUnitsIDs[1] } },
    { id: orgUnitsIDs[3], parent: { id: orgUnitsIDs[1] } },
  ]
  const response = orgUnitActions.exchangeIds(idsDict)(orgUnits)
  expect(response).toStrictEqual(expected)
})

test('orgUnitActions.sendOrgUnitsToDHIS2', async () => {
  const createOrganisationUnits = jest.fn()
  const getCurrentUser = jest.fn().mockReturnValue(resolve(dhis2User))
  const givePermissions = jest.fn()
  const addProgramsToOrgUnit = jest.fn()
  
  const dhis2 = { 
    createOrganisationUnits,
    getCurrentUser,
    givePermissions,
    addProgramsToOrgUnit
  }
  const orgUnits = {
    organisationUnits: [
      { id: uuids('o-1'), level: 0 },
      { id: uuids('o-2'), level: 1 },
      { id: uuids('o-3'), level: 2 }
    ]
  }
  const listaIds = orgUnits.organisationUnits.map(ou => ({ id: ou.id }))
  const programs = {
    additions: [
      { id: config.dhis2CasesProgram }, 
      { id: config.dhis2ContactsProgram }
    ],
    deletions: []
  }
  const permissions = {
    firstName: dhis2User.firstName,
    surname: dhis2User.surname,
    userCredentials: dhis2User.userCredentials,
    teiSearchOrganisationUnits: [
      ...dhis2User.teiSearchOrganisationUnits,
      ...listaIds
    ],
    organisationUnits: [
      ...dhis2User.organisationUnits,
      ...listaIds
    ],
    dataViewOrganisationUnits: [
      ...dhis2User.dataViewOrganisationUnits,
      ...listaIds
    ]
  }

  await orgUnitActions.sendOrgUnitsToDHIS2(config, dhis2, orgUnits)
  expect(createOrganisationUnits).toHaveBeenCalledWith(orgUnits)
  expect(createOrganisationUnits).toHaveBeenCalledTimes(1)
  expect(getCurrentUser).toHaveBeenCalledWith()
  expect(getCurrentUser).toHaveBeenCalledTimes(1)
  expect(givePermissions).toHaveBeenCalledWith(dhis2User.userCredentials.userInfo.id, permissions)
  expect(givePermissions).toHaveBeenCalledTimes(1)
  expect(addProgramsToOrgUnit).toHaveBeenCalledTimes(orgUnits.organisationUnits.length)
  expect(addProgramsToOrgUnit).toHaveBeenNthCalledWith(
    1,
    orgUnits.organisationUnits[0].id,
    programs
  )
  expect(addProgramsToOrgUnit).toHaveBeenNthCalledWith(
    2,
    orgUnits.organisationUnits[1].id,
    programs
  )
  expect(addProgramsToOrgUnit).toHaveBeenNthCalledWith(
    3,
    orgUnits.organisationUnits[2].id,
    programs
  )
})

function orgUnit_ (index, location, hierarchy) {
  return R.merge(hierarchy, {
    id: orgUnitsIDs[index],
    code: location.id,
    name: location.name,
    shortName: location.name,
    geometry: {
      type: "Point",
      coordinates: [location.geoLocation.lng, location.geoLocation.lat]
    },
    level: constants.geographicalLevelId(location.geographicalLevelId),
    lastUpdated: location.updatedAt,
    openingDate: location.createdAt
  })
}