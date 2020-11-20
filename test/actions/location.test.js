
const R = require('ramda')
const { v4: uuid } = require('uuid')
const { createUUIDs } = require('../test-util/util')
const uuids = createUUIDs()

const locationActions = require('../../actions/location')
const config = require('../../config')
const constants = require('../../config/constants')

const { orgUnits } = require('../test-util/mocks')

const prop = R.curry((prop, i) => R.path([i, prop], orgUnits))
const id = prop('id')
const parentLocationId = R.pipe(prop('parent'), R.prop('id'))
const name = prop('name')
const geoLocation = i => R.pipe(R.path([i, 'geometry', 'coordinates']), R.zipObj(['lng', 'lat']))(orgUnits)
const geographicalLevelId = R.pipe(prop('level'), constants.geographicalLevelId)
const updatedAt = prop('lastUpdated')
const createdAt = prop('created')
const location = i => ({
  id: id(i),
  parentLocationId: parentLocationId(i),
  name: name(i),
  geoLocation: geoLocation(i),
  geographicalLevelId: geographicalLevelId(i),
  updatedAt: updatedAt(i),
  createdAt: createdAt(i),
  active: true,
  deleted: false,
  identifiers: [],
  synonyms: []
})

// WARNING -> the order in children is important for the test to pass
// TODO -> find a way to do this with a consistent order
test('locationActions.copyOrganisationUnits', async () => {
  const stringify = R.identity
  const writeFileSync = jest.fn()
  const fs = { writeFileSync }
  const getOrganisationUnitsFromParent = jest.fn().mockReturnValue(orgUnits)
  const dhis2 = { getOrganisationUnitsFromParent }
  const godata = {}
  const outputFile = uuid()
  
  const testConfig = R.mergeDeepRight(config, { rootID: location(0).id })

  await locationActions.copyOrganisationUnits(
    dhis2, godata, testConfig, { fs, stringify })(outputFile)

  expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(testConfig.rootID)
  const expected = [{
    location: location(0),
    children: [
      { location: location(2), children: [] },
      {
        location: location(1),
        children: [ { location: location(3), children: [] } ]
      }
    ]
  }]
  expect(writeFileSync).toHaveBeenCalledWith(outputFile, expected)
})
test('locationActions.adaptLocationToHierarchy w/o children', adaptLocationToHierarchyTest({
  location: {
    id: uuids('1'),
    children: []
  }, 
  expectedResult: {
    children: [],
    location: { id: uuids('1') }
  }
}))

test('locationActions.adaptLocationToHierarchy w/ children', adaptLocationToHierarchyTest({
  location: {
    id: uuids('1'),
    children: [
      { 
        id: uuids('2'),
        children: []
      }
    ]
  }, 
  expectedResult: {
    children: [
      {
        children: [],
        location: { id: uuids('2') }
      }
    ],
    location: { id: uuids('1') }
  }
}))

test('locationActions.addLocationToParent no parentLocationId', addLocationToParentTest({
  locations: [
    {
      id: uuids('1'),
      parentLocationId: undefined,
      children: [
        { id: uuids('2'), children: [] }
      ]
    },
    {
      id: uuids('2'),
      parentLocationId: uuids('1'),
      children: []
    }
  ],
  location: {
    id: uuids('1'),
    parentLocationId: undefined,
    children: [
      { id: uuids('2'), children: [] }
    ]
  },
  expected: (locations) => R.indexBy(R.prop('id'), locations)
}))

test('locationActions.addLocationToParent w/ parentLocationId', addLocationToParentTest({
  locations: [
    {
      id: uuids('1'),
      parentLocationId: undefined,
      children: [
        { id: uuids('2'), children: [] }
      ]
    },
    {
      id: uuids('2'),
      parentLocationId: uuids('1'),
      children: []
    }
  ],
  location: {
    id: uuids('2'),
    parentLocationId: uuids('1'),
    children: []
  },
  expected: (locations) => { 
    const indexedLocations = R.indexBy(R.prop('id'), locations)
    return R.set(
      R.lensPath([locations[0].id, 'children']),
      R.append(locations[1], locations[0].children),
      indexedLocations
    )
  }
}))

test('locationActions.createLocationHierarchy', () => {
  const rootID = uuids('1')
  const testConfig = R.assoc('rootID', rootID, config)
  const locations = [
    {
      id: uuids('1'),
      parentLocationId: undefined,
      geographicalLevelId: geographicalLevelId(0),
      children: []
    },
    {
      id: uuids('2'),
      parentLocationId: uuids('1'),
      geographicalLevelId:  geographicalLevelId(1),
      children: []
    }
  ]
  const response = locationActions.createLocationHierarchy(testConfig)(locations)
  const expected = {
    children: [
      {
        children: [],
        location: R.dissoc('children', locations[1])
      }
    ],
    location: R.dissoc('children', locations[0])
  }
  expect(response).toStrictEqual(expected)
})

test('locationActions.sendLocationsToGoData', async () => {
  const testConfig = R.assoc('rootID', orgUnits[0].id, config)
  const response = await locationActions.sendLocationsToGoData(testConfig, orgUnits)
  const expected = [{
    location: location(0),
    children: [
      { location: location(2), children: [] },
      {
        location: location(1),
        children: [ { location: location(3), children: [] } ]
      }
    ]
  }]
  expect(response).toStrictEqual(expected)
})

function adaptLocationToHierarchyTest ({ location, expectedResult }) {
  return () => {
    const response = locationActions.adaptLocationToHierarchy(location)
    expect(response).toStrictEqual(expectedResult)
  }
}

function addLocationToParentTest ({ locations, location, expected }) {
  return () => {
    const indexedLocations = R.indexBy(R.prop('id'), locations)
    const response = locationActions.addLocationToParent(indexedLocations, location)
    expect(response).toStrictEqual(expected(locations))
  }
}
