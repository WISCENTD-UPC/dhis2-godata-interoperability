
const { v4: uuid } = require('uuid')

const locationMappings = require('../../mappings/location')
const constants = require('../../config/constants')

test('locationMappings.organisationUnitToLocation base', organisationUnitToLocationTest())

test('locationMappings.organisationUnitToLocation polygon geometry', organisationUnitToLocationTest({
  model: {
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[[
        [ 164.7706, -67.6056 ],
        [ 164.7213, -67.6005 ],
        [ 164.7213, -67.6003 ],
        [ 164.7239, -67.5099 ],
        [ 164.7903, -67.5091 ],
        [ 164.8237, -67.5516 ],
        [ 164.8258, -67.5705 ],
        [ 164.8106, -67.5826 ],
        [ 164.7706, -67.6056 ]
      ]]]
    }
  },
  expected: {
    geoLocation: { lat: -67.57063333333332, lng: 164.77312222222224 }
  }
}))

function organisationUnitToLocationTest ({ model = {}, expected = {} } = {}) {
  return () => {
    const orgUnit = {
      id: uuid(),
      parent: { id: uuid() },
      name: 'Trainingland',
      level: 1,
      geometry: { type: 'Point', coordinates: [ 164.7706, -67.6056 ] },
      lastUpdated: new Date().toString(),
      created: new Date().toString(),
      noise: uuid(),
      ...model
    }

    const expectedResult = {
      id: orgUnit.id,
      parentLocationId: orgUnit.parent.id,
      name: orgUnit.name,
      geoLocation: { lat: -67.6056, lng: 164.7706 },
      geographicalLevelId: constants.geographicalLevelId(1),
      updatedAt: orgUnit.lastUpdated,
      createdAt: orgUnit.created,
      active: true,
      deleted: false,
      identifiers: [],
      synonyms: [],
      children: [],
      ...expected
    }

    expect(locationMappings.organisationUnitToLocation(orgUnit)).toStrictEqual(expectedResult)
  }
}

