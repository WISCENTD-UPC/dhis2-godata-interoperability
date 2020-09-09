
const { v4: uuid } = require('uuid')

const relationshipMappings = require('../../mappings/relationship')
const config = require('../../config')
const constants = require('../../config/constants')

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

