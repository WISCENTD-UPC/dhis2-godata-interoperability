
import { v4 as uuid } from 'uuid'

import * as relationshipMappings from '../../src/mappings/relationship'
import config from '../../src/config'
import constants from '../../src/config/constants/dhis'

const model = {
  trackedEntityInstance: uuid(),
  relationship: {
    created: '2020-09-01'
  }
}

test('relationshipMappings.trackedEntityToRelationship', () => {
  expect(relationshipMappings.trackedEntityToRelationship(config)(model)).toStrictEqual({
    persons: [{
      id: model.trackedEntityInstance,
      source: false,
      target: false
    }],
    contactDate: model.relationship.created,
    contactDateEstimated: false,
    certaintyLevelId: constants.certaintyLevel(),
    people: []
  })
})

