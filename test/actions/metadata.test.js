
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

import * as metadataActions from '../../src/actions/metadata'
import config from '../../src/config'
import constants from '../../src/config/constants/dhis'

import {
  optionSets,
  options
} from '../test-util/mocks'

const resolve = Promise.resolve.bind(Promise)

test('metadataActions.copyMetadata', async () => {
  const getOptionSets = jest.fn().mockReturnValue(resolve(optionSets))
  const getOptions = jest.fn().mockReturnValue(resolve(options))
  const getOptionSet = jest.fn().mockReturnValue(resolve(optionSets[0]))
  const createReferenceData = jest.fn()

  const dhis2 = { getOptionSets, getOptions, getOptionSet }
  const godata = { createReferenceData }

  await metadataActions.copyMetadata(dhis2, godata, config)()

  const configOptionSets = R.keys(config.metadata.optionSets)

  expect(getOptionSets).toHaveBeenCalledTimes(1)
  expect(getOptions).toHaveBeenCalledTimes(1)
  expect(getOptionSet).toHaveBeenCalledWith(optionSets[0].id)
  expect(createReferenceData).toHaveBeenNthCalledWith(1, {
    categoryId: constants.referenceDataCategoryID(configOptionSets[0]),
    value: options[0].displayName,
    active: true
  })
  expect(createReferenceData).toHaveBeenNthCalledWith(2, {
    categoryId: constants.referenceDataCategoryID(configOptionSets[0]),
    value: options[1].displayName,
    active: true
  })
})

test.todo('metadataActions.processMetadata')

test('metadataActions.loadResources', async () => {
  const uuids = [ uuid(), uuid() ]
  const getOptionSets = jest.fn().mockReturnValue(resolve(uuids[0]))
  const getOptions = jest.fn().mockReturnValue(resolve(uuids[1]))

  const dhis2 = { getOptionSets, getOptions }
  const godata = {}

  const response = await metadataActions.loadResources(dhis2, godata, config)

  expect(response).toStrictEqual(uuids)
})

test('metadataActions.mapOptionSetIDFromDisplayName', () => {
  const optionSet = [ 'Vaccine', 'Vaccine types' ]
  const response = metadataActions.mapOptionSetIDFromDisplayName(optionSets)(optionSet)
  expect(response).toStrictEqual([ 'Vaccine', optionSets[0].id ])
})

test('metadataActions.loadOptionSets', async () => {
  const getOptionSet = jest.fn().mockReturnValue(resolve(optionSets[0]))
  const dhis2 = { getOptionSet }
  
  const optionSet = [ 'Vaccine', optionSets[0].id ]
  const response = await metadataActions.loadOptionSets(dhis2)(optionSet)

  expect(response).toStrictEqual([ 'Vaccine', optionSets[0].options ])
})

test('metadataActions.mapOptionsFromID', () => {
  const optionSet = [ 'Vaccine', [ { id: options[0].id }, { id: options[1].id } ] ]
  
  const response = metadataActions.mapOptionsFromID(options)(optionSet)
  
  expect(response).toStrictEqual([ 'Vaccine', options ])
})

test('metadataActions.transformOptions', () => {
  const optionSet = [ 'Vaccine', options ]
  
  const response = metadataActions.transformOptions()(optionSet)
  
  expect(response).toStrictEqual([{
    categoryId: constants.referenceDataCategoryID('Vaccine'),
    active: true,
    value: options[0].displayName
  }, {
    categoryId: constants.referenceDataCategoryID('Vaccine'),
    active: true,
    value: options[1].displayName
  }])
})

test('metadataActions.sendOptionSetsToGoData', async () => {
  const options = [ uuid(), uuid() ]
  const responses = [ uuid(), uuid() ]
  const createReferenceData = jest.fn()
    .mockReturnValueOnce(resolve(responses[0]))
    .mockReturnValueOnce(resolve(responses[1]))
  const godata = { createReferenceData }

  const response = await metadataActions.sendOptionSetsToGoData(godata)(options)

  expect(response).toStrictEqual(responses)
  expect(createReferenceData).toHaveBeenNthCalledWith(1, options[0])
  expect(createReferenceData).toHaveBeenNthCalledWith(2, options[1])
})

