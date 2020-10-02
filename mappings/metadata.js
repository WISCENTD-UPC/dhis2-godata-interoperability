
const R = require('ramda')

const { completeSchema } = require('../util')
const constants = require('../config/constants')
const config = require('../config')

const optionToReferenceData = (optionSet) => completeSchema({
  active: true,
  categoryId: constants.referenceDataCategoryID(optionSet),
  value: R.prop('displayName')
})

module.exports = { optionToReferenceData }

