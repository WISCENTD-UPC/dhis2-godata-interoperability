import { v4 as uuid } from 'uuid'

import * as orgUnitMappings from '../../src/mappings/orgUnit'
import constants from '../../src/config/constants/godata'

test('orgUnitMappings.locationToOrganizationUnit', () => {
    const model = {
        name: 'Trainingland',
        parentLocationId: uuid(),
        geoLocation: { lat: 46, lng: -163 },
        geographicalLevelId: 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_0',
        id: uuid(),
        createdAt: '__createdAt__',
        updatedAt: '__updatedAt__',
    }

    expect(orgUnitMappings.locationToOrganizationUnit()(model)).toStrictEqual({
        id: model.id,
        code: model.id,
        parent: { id: model.parentLocationId },
        name: model.name,
        shortName: model.name,
        geometry: {
            type: 'Point',
            coordinates: [model.geoLocation.lng, model.geoLocation.lat]
        },
        level: constants.geographicalLevelId(model.geographicalLevelId),
        lastUpdated: model.updatedAt,
        openingDate: model.createdAt,
        children: []
    })
})

