
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants'

// SELECTORS
export const contactIDSelector = R.prop('trackedEntityInstance')
export const contactDateSelector = R.path(['relationship', 'created'])

// MAPPINGS
export const trackedEntityToRelationship = (config) => completeSchema({
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

