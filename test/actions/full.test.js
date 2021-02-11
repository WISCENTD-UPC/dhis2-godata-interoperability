
import * as R from 'ramda'

import * as fullTransferActions from '../../src/actions/full'
import { trackedEntityToCase } from '../../src/mappings/case'
import { mapAttributeNamesToIDs } from '../../src/util'
import constants from '../../src/config/constants'
import config from '../../src/config'

import { mock } from '../test-util/util'
import {
  user,
  optionSets,
  options,
  programs,
  programStages,
  dataElements,
  attributes,
  relationshipTypes,
  orgUnits,
  trackedEntities,
  outbreaks,
  outbreakCases,
  relationships
} from '../test-util/mocks'

const resolve = Promise.resolve.bind(Promise)

test('fullTransferActions.fullTransfer', async () => {
  const testTrackedEntities = R.flatten(trackedEntities).slice(0, 2)
  
  const loadResources = mock(resolve([
    user,
    optionSets,
    options,
    programs,
    programStages,
    dataElements,
    attributes,
    relationshipTypes,
    orgUnits
  ]))
  const loadTrackedEntityInstances = mock(resolve(testTrackedEntities))
  const _ = { loadResources, loadTrackedEntityInstances }

  const getOptionSet = mock(resolve(optionSets[0]))
  const getTrackedEntityRelationships = mock(resolve(relationships[0]))
  const dhis2 = {
    getOptionSet,
    getTrackedEntityRelationships
  }
  
  const expected = {}
  expected.metadata = getExpectedMetadata(config, options)
  expected.cases = getExpectedCases(
    testTrackedEntities,
    attributes,
    config,
    [ 'CONFIRMED', 'SUSPECT' ])

  const login = mock(resolve(user))
  const createReferenceData = R.identity
  const createOutbreakCase = jest.fn()
    .mockReturnValueOnce(resolve(expected.cases[0]))
    .mockReturnValueOnce(resolve(expected.cases[1]))
  const activateOutbreakForUser = mock()
  const createOutbreak = mock(resolve(outbreaks[0]))
  const getOutbreakCases = mock(resolve(outbreakCases.slice(0, 2)))
  const createCaseRelationships = mock(resolve(relationships[0][0]))
  const godata = {
    login,
    createReferenceData,
    activateOutbreakForUser,
    createOutbreak,
    createOutbreakCase,
    getOutbreakCases,
    createCaseRelationships
  }

  const results = await fullTransferActions.fullTransfer(dhis2, godata, config, _)()

  expect(results.metadata).toStrictEqual(expected.metadata)
  expect(getOptionSet).toHaveBeenCalledWith(optionSets[0].id)
  expect(activateOutbreakForUser).toHaveBeenCalledWith(user.userId, outbreaks[0].id)
  expect(createOutbreakCase).toHaveBeenNthCalledWith(1, outbreaks[0].id, expected.cases[0])
  expect(createOutbreakCase).toHaveBeenNthCalledWith(2, outbreaks[0].id, expected.cases[1])
  expect(getOutbreakCases).toHaveBeenCalledWith(outbreaks[0].id)
  expect(createCaseRelationships).toHaveBeenNthCalledWith(
    1,
    outbreaks[0].id,
    testTrackedEntities[0].trackedEntityInstance,
    [ relation('2020-09-01', testTrackedEntities[1].trackedEntityInstance) ])
  expect(createCaseRelationships).toHaveBeenNthCalledWith(
    2,
    outbreaks[0].id,
    testTrackedEntities[1].trackedEntityInstance,
    [ relation('2020-09-01', testTrackedEntities[0].trackedEntityInstance) ])
})

test('fullTransferActions.loadResources', async () => {
  const login = mock(resolve(user))
  const getOptionSets = mock(resolve(optionSets))
  const getOptions = mock(resolve(options))
  const getPrograms = mock(resolve(programs))
  const getProgramStages = mock(resolve(programStages))
  const getDataElements = mock(resolve(dataElements))
  const getTrackedEntitiesAttributes = mock(resolve(attributes))
  const getRelationshipTypes = mock(resolve(relationshipTypes))
  const getOrganisationUnitsFromParent = mock(resolve(orgUnits))

  const dhis2 = {
    getOptionSets,
    getOptions,
    getPrograms,
    getProgramStages,
    getDataElements,
    getTrackedEntitiesAttributes,
    getRelationshipTypes,
    getOrganisationUnitsFromParent
  }
  const godata = { login }

  const result = await fullTransferActions.loadResources(dhis2, godata, config)

  expect(login).toHaveBeenCalledWith()
  expect(getOptionSets).toHaveBeenCalledWith()
  expect(getOptions).toHaveBeenCalledWith()
  expect(getPrograms).toHaveBeenCalledWith()
  expect(getProgramStages).toHaveBeenCalledWith()
  expect(getDataElements).toHaveBeenCalledWith()
  expect(getTrackedEntitiesAttributes).toHaveBeenCalledWith()
  expect(getRelationshipTypes).toHaveBeenCalledWith()
  expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(config.rootID)
  expect(result).toStrictEqual([
    user,
    optionSets,
    options,
    programs,
    programStages,
    dataElements,
    attributes,
    relationshipTypes,
    orgUnits
  ])
})

function getExpectedMetadata (config, options) {
  return R.map((_) => ({
    active: true,
    categoryId: constants.referenceDataCategoryID(
      R.keys(config.metadata.optionSets)[0]),
    value: _
  }), R.map(R.prop('displayName'), options))
}

function getExpectedCases (trackedEntities, attributes, config, classifications) {
  return R.pipe(
    (cases) => cases.map(
      (case_, i) => R.assoc('caseClassification', classifications[i], case_)),
    R.map(trackedEntityToCase(
      mapAttributeNamesToIDs(attributes)(config)
    ))
  )(trackedEntities)
}

function relation (date, contactID) {
  return {
    contactDate: date,
    people: [],
    contactDateEstimated: false,
    certaintyLevelId: constants.certaintyLevel(),
    persons: [{
      id: contactID,
      target: false,
      source: false
    }]
  }
}

