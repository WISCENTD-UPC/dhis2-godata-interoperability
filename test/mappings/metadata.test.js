
const { v4: uuid } = require('uuid')

const metadataMappings = require('../../mappings/metadata')
const constants = require('../../config/constants')

test('metadataMappings.optionToReferenceData', () => {
  const response = metadataMappings.optionToReferenceData('Vaccine')({
    id: uuid(),
    displayName: 'Malaria'
  })
  expect(response).toStrictEqual({
    categoryId: constants.referenceDataCategoryID('Vaccine'),
    active: true,
    value: 'Malaria'
  })
})

