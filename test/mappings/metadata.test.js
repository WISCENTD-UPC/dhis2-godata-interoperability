
import { v4 as uuid } from 'uuid'

import * as metadataMappings from '../../src/mappings/metadata'
import constants from '../../src/config/constants/dhis'

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

