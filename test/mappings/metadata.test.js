
import { v4 as uuid } from 'uuid'

import metadataMappings from '../../mappings/metadata'
import constants from '../../config/constants'

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

