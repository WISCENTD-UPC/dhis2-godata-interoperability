
const R = require('ramda')

const { completeSchema } = require('../util')
const constants = require('../config/constants')

// SELECTORS
const contactIDSelector = R.prop('trackedEntityInstance')
const contactDateSelector = R.path(['relationship', 'created'])

// MAPPINGS
const trackedEntityToRelationship = (config) => completeSchema({
  persons: [
    {
      id: contactIDSelector,
      source: false,
      target: false
    }
  ],
  contactDate: contactDateSelector,
  contactDateEstimated: false,
  certaintyLevelId: constants.certaintyLevel(),
  // TODO -> exposureTypeId: ,
  // TODO -> exposureFrequencyId: ,
  // TODO -> exposureDurationId: ,
  // TODO -> socialRelationshipTypeId: ,
  people: []
})

module.exports = { trackedEntityToRelationship }

