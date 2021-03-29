
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants/dhis'
import config from '../config'

export const optionToReferenceData = (optionSet) => completeSchema({
  active: true,
  categoryId: constants.referenceDataCategoryID(optionSet),
  value: R.prop('displayName')
})

