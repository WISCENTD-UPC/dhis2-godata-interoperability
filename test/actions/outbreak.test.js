
const R = require('ramda')
const { v4: uuid } = require('uuid')

const outbreakActions = require('../../actions/outbreak')
const config = require('../../config')
const constants = require('../../config/constants')

const { programs, orgUnits, trackedEntities } = require('../test-util/mocks')

const defaultDate = '2020-09-01'
const resolve = Promise.resolve.bind(Promise)

test('outbreakActions.createOutbreaks group 0 mode', outbreakCreationTest({
  testConfig: {
    outbreakCreationMode: 0,
    outbreakCreationGroupingLevel: 0
  },
  expected: (testConfig) => [
    outbreak(testConfig, {
      name: orgUnits[0].name,
      startDate: trackedEntities[0][0].created,
      locationIds: [ orgUnits[0].id, orgUnits[1].id, orgUnits[2].id, orgUnits[3].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[0].level),
    })
  ]
}))

test('outbreakActions.createOutbreaks group 1 mode', outbreakCreationTest({
  testConfig: {
    outbreakCreationMode: 0,
    outbreakCreationGroupingLevel: 1
  },
  expected: (testConfig) => [
    outbreak(testConfig, {
      name: orgUnits[0].name,
      startDate: trackedEntities[0][0].created,
      locationIds: [ orgUnits[0].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[0].level)
    }),
    outbreak(testConfig, {
      name: orgUnits[1].name,
      startDate: trackedEntities[1][0].created,
      locationIds: [ orgUnits[1].id, orgUnits[3].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[1].level)
    }),
    outbreak(testConfig, {
      name: orgUnits[2].name,
      startDate: defaultDate,
      locationIds: [ orgUnits[2].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[1].level)
    })
  ]
}))

test('outbreakActions.createOutbreaks expand mode', outbreakCreationTest({
  testConfig: {
    outbreakCreationMode: 1
  },
  expected: (testConfig) => [
    outbreak(testConfig, {
      name: orgUnits[0].name,
      startDate: trackedEntities[0][0].created,
      locationIds: [ orgUnits[0].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[0].level)
    }),
    outbreak(testConfig, {
      name: orgUnits[1].name,
      startDate: trackedEntities[1][0].created,
      locationIds: [ orgUnits[1].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[1].level)
    }),
    outbreak(testConfig, {
      name: orgUnits[2].name,
      startDate: defaultDate,
      locationIds: [ orgUnits[2].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[2].level)
    }),
    outbreak(testConfig, {
      name: orgUnits[3].name,
      startDate: trackedEntities[3][0].created,
      locationIds: [ orgUnits[3].id ],
      reportingGeographicalLevelId: constants.geographicalLevelId(orgUnits[3].level)
    })
  ]
}))

test('outbreakActions.loadResources', async () => {
  const programs = uuid()
  const orgUnits = uuid()
  const getPrograms = jest.fn().mockReturnValue(programs)
  const getOrganisationUnitsFromParent = jest.fn().mockReturnValue(orgUnits)
  const dhis2 = { getPrograms, getOrganisationUnitsFromParent }

  const rootID = uuid()
  const testConfig = R.assoc('rootID', rootID, config)

  const response = await outbreakActions.loadResources(dhis2, testConfig)

  expect(response).toStrictEqual([ programs, orgUnits ])
  expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(rootID)
})

test('outbreakActions.selectGroupingLevel group 0 mode', selectGroupingLevelTest({
  mode: 'GROUP',
  administrativeLevel: 0,
  expectedResult: 0
}))

test('outbreakActions.selectGroupingLevel group 5 mode', selectGroupingLevelTest({
  mode: 'GROUP',
  administrativeLevel: 5,
  expectedResult: 2
}))

test('outbreakActions.selectGroupingLevel expand mode', selectGroupingLevelTest({
  mode: 'EXPAND',
  expectedResult: 2
}))

function outbreakCreationTest ({ testConfig, expected }) {
  return async () => {
    const getPrograms = jest.fn().mockReturnValue(resolve(programs))
    const getOrganisationUnitsFromParent = jest.fn().mockReturnValue(resolve(orgUnits))
    const loadTrackedEntityInstances = jest.fn().mockReturnValue(resolve(trackedEntities))
    const postOutbreaks = () => R.identity
    const date = () => defaultDate
    const dhis2 = {
      getPrograms,
      getOrganisationUnitsFromParent
    }

    testConfig = R.mergeDeepRight(config, testConfig)

    const response = await outbreakActions.createOutbreaks(
      dhis2, {}, testConfig, { postOutbreaks, loadTrackedEntityInstances, Date: date })()
    
    expect(getPrograms).toHaveBeenCalledWith()
    expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(testConfig.rootID)
    expect(loadTrackedEntityInstances)
      .toHaveBeenCalledWith(dhis2, orgUnits, programs[0].id)
    expect(response).toStrictEqual(expected(testConfig))
  }
}

function selectGroupingLevelTest ({ mode, administrativeLevel = null, expectedResult }) {
  return () => {
    const testConfig = R.pipe(
      R.assoc('outbreakCreationMode', constants.OUTBREAK_CREATION_MODE[mode]),
      R.assoc('outbreakCreationGroupingLevel', administrativeLevel)
    )(config)

    const result = outbreakActions.selectGroupingLevel(orgUnits, testConfig)

    expect(result).toBe(expectedResult)
  }
}

function outbreak (testConfig, base) {
  const country = 'Trainingland'
  testConfig = R.assoc('countries', [ country ], testConfig)

  return R.mergeDeepLeft(base, { 
    ...testConfig.outbreakConfig,
    disease: constants.disease(testConfig.disease),
    endDate: null,
    countries: [ { id: constants.country(country) } ],
    generateFollowUpsTeamAssignmentAlgorithm: constants.followupAssignmentAlgorithm(0),
    caseInvestigationTemplate: [],
    contactFollowUpTemplate: [],
    labResultsTemplate: [],
    arcGisServers: []
  })
}

