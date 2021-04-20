import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

import * as trackedEntityActions from '../../src/actions/trackedEntity'
import config from '../../src/config'
import constants from '../../src/config/constants/godata'
import { createUUIDs } from '../test-util/util'
import { getIDFromDisplayName, mapListDisplayNameToIDs } from '../../src/util'
import { programs, orgUnitsIDs, cases, outbreaks, programStages, dataElements, attributes, trackedEntityTypes, orgUnits, trackedEntityIDs } from '../test-util/mocks'

const uuids = createUUIDs()
const resolve = Promise.resolve.bind(Promise)

const testConfig = R.pipe(
  R.over(
    R.lensProp('dhis2CasesProgram'),
    _ => getIDFromDisplayName(programs, _)
  ),
  mapListDisplayNameToIDs(attributes, 'dhis2KeyAttributes'), 
  mapListDisplayNameToIDs(trackedEntityTypes, 'dhis2KeyTrackedEntityTypes'),
  mapListDisplayNameToIDs(programStages, 'dhis2KeyProgramStages'),
  mapListDisplayNameToIDs(dataElements, 'dhis2KeyDataElements')
)(config)
const testCases = R.flatten(cases)

test('trackedEntityActions.copyTrackedEntities', async () => {
  const getPrograms = jest.fn().mockReturnValue(resolve(programs))
  const getProgramStages = jest.fn().mockReturnValue(resolve(programStages))
  const getDataElements = jest.fn().mockReturnValue(resolve(dataElements))
  const getTrackedEntitiesAttributes = jest.fn().mockReturnValue(resolve(attributes))
  const getTrackedEntityTypes = jest.fn().mockReturnValue(resolve(trackedEntityTypes))
  const getOrganisationUnits = jest.fn().mockReturnValue(resolve(orgUnits))
  const getOutbreaks = jest.fn().mockReturnValue(resolve(outbreaks))
  const loadCases = jest.fn().mockReturnValue(resolve(R.flatten(cases)))
  const getNewIds = jest.fn().mockReturnValue(resolve(orgUnitsIDs))
  const createTrackedEntityInstances = jest.fn()
  
  const dhis2 = { 
    getPrograms, 
    getProgramStages,
    getDataElements,
    getTrackedEntitiesAttributes,
    getTrackedEntityTypes,
    getOrganisationUnits,
    getNewIds,
    createTrackedEntityInstances
  }
  const godata = { getOutbreaks }

  await trackedEntityActions.copyTrackedEntities(dhis2, godata, config, {
    loadCases
  })()

  expect(getPrograms).toHaveBeenCalledWith()
  expect(getProgramStages).toHaveBeenCalledWith()
  expect(getDataElements).toHaveBeenCalledWith()
  expect(getTrackedEntitiesAttributes).toHaveBeenCalledWith()
  expect(getTrackedEntityTypes).toHaveBeenCalledWith()
  expect(getOrganisationUnits).toHaveBeenCalledWith()
  expect(getOutbreaks).toHaveBeenCalledWith()
  expect(loadCases).toHaveBeenCalledWith(godata, outbreaks)
  expect(getNewIds).toHaveBeenCalledWith(cases.length)
})

test('trackedEntityActions.loadResources', async () => {
  const getPrograms = jest.fn().mockReturnValue(resolve(programs))
  const getProgramStages = jest.fn().mockReturnValue(resolve(programStages))
  const getDataElements = jest.fn().mockReturnValue(resolve(dataElements))
  const getTrackedEntitiesAttributes = jest.fn().mockReturnValue(resolve(attributes))
  const getTrackedEntityTypes = jest.fn().mockReturnValue(resolve(trackedEntityTypes))
  const getOrganisationUnits = jest.fn().mockReturnValue(resolve(orgUnits))
  const getOutbreaks = jest.fn().mockReturnValue(resolve(outbreaks))

  const dhis2 = { 
    getPrograms, 
    getProgramStages,
    getDataElements,
    getTrackedEntitiesAttributes,
    getTrackedEntityTypes,
    getOrganisationUnits
  }
  const godata = { getOutbreaks }
  const response = await trackedEntityActions.loadResources(dhis2, godata)

  expect(response).toStrictEqual([ programs, programStages, dataElements, attributes, trackedEntityTypes, orgUnits, outbreaks])
})

test('trackedEntityActions.processTrackedEntities', async () => {
  const createTrackedEntityInstances = jest.fn()
  const dhis2 = { createTrackedEntityInstances }
  await trackedEntityActions.processTrackedEntities(dhis2, testConfig, orgUnits, trackedEntityIDs, testCases)

  const expected = {
    trackedEntityInstances: [
      trackedEntity_(
        0, testConfig, testCases[0], [
          {
            attribute: testConfig.dhis2KeyAttributes.dateOfBirth,
            value: testCases[0].dob
          },
          {
            attribute: testConfig.dhis2KeyAttributes.address,
            value: testCases[0].addresses[0].addressLine1
          }
        ], 
        [ outcomeSelector(0, testConfig, testCases[0]) ]
      ),
      trackedEntity_(
        1, testConfig, testCases[1], [
          {
            attribute: testConfig.dhis2KeyAttributes.age,
            value: testCases[1].age.years
          }
        ],
        [ outcomeSelector(1, testConfig, testCases[1]) ]
      ),
      trackedEntity_(2, testConfig, testCases[2], [], []),
      trackedEntity_(3, testConfig, testCases[3], [], [])
    ]
  }
  expect(createTrackedEntityInstances).toHaveBeenCalledTimes(1)
  expect(createTrackedEntityInstances).toHaveBeenCalledWith(expected)
})

test('trackedEntityActions.assignDHIS2IDs', () => {
  const cases = [
    { id: testCases[0].id, usualPlaceOfResidenceLocationId: testCases[0].usualPlaceOfResidenceLocationId },
    { id: testCases[1].id, usualPlaceOfResidenceLocationId: testCases[1].usualPlaceOfResidenceLocationId },
    { id: testCases[2].id, usualPlaceOfResidenceLocationId: testCases[2].usualPlaceOfResidenceLocationId },
    { id: testCases[3].id, usualPlaceOfResidenceLocationId: testCases[3].usualPlaceOfResidenceLocationId }
  ]
  const expected = [
    { id: trackedEntityIDs[0], usualPlaceOfResidenceLocationId: orgUnitsIDs[0] },
    { id: trackedEntityIDs[1], usualPlaceOfResidenceLocationId: orgUnitsIDs[1] },
    { id: trackedEntityIDs[2], usualPlaceOfResidenceLocationId: orgUnitsIDs[2] },
    { id: trackedEntityIDs[3], usualPlaceOfResidenceLocationId: orgUnitsIDs[3] }
  ]
  const idsDict = R.zipObj(testCases.map(c => c.id), trackedEntityIDs)
  const response = trackedEntityActions.assignDHIS2IDs(orgUnits, idsDict)(cases)
  expect(response).toStrictEqual(expected)
})

test('trackedEntityActions.addEvents', () => {
  const trackedEntities = [
    R.merge(
      trackedEntity_(0, testConfig, testCases[0], [], []),
      { 
        outcomeId: testCases[0].outcomeId, 
        dateOfOutcome: testCases[0].dateOfOutcome
      }
    ),
    R.merge(
      trackedEntity_(1, testConfig, testCases[1], [], []),
      { 
        outcomeId: testCases[1].outcomeId, 
        dateOfOutcome: testCases[1].dateOfOutcome
      }
    ),
    trackedEntity_(2, testConfig, testCases[2], [], []),
    trackedEntity_(3, testConfig, testCases[3], [], [])
  ]
  const expected = [
    trackedEntity_(0, testConfig, testCases[0], [], [ outcomeSelector(0, testConfig, testCases[0]) ]),
    trackedEntity_(1, testConfig, testCases[1], [], [ outcomeSelector(1, testConfig, testCases[1]) ]),
    trackedEntity_(2, testConfig, testCases[2], [], []),
    trackedEntity_(3, testConfig, testCases[3], [], [])
  ]
  const response = trackedEntityActions.addEvents(testConfig)(trackedEntities)
  expect(response).toStrictEqual(expected)
})

function outcomeSelector (index, config, case_) {
  return {
    program: config.dhis2CasesProgram,
    orgUnit: orgUnitsIDs[index],
    programStage: config.dhis2KeyProgramStages.healthOutcome,
    eventDate: case_.dateOfOutcome,
    dataValues: [{
      dataElement: config.dhis2KeyDataElements.healthOutcome,
      value: constants.healthOutcome(case_.outcomeId),
      created: case_.dateOfOutcome
    }]
  }
}

function trackedEntity_ (index, config, case_, attributes, outcome) {
  return {
    orgUnit: orgUnitsIDs[index],
    trackedEntityInstance: trackedEntityIDs[index],
    trackedEntityType: config.dhis2KeyTrackedEntityTypes.person,
    created: case_.dateOfReporting,
    attributes: [ 
      { 
        attribute: config.dhis2KeyAttributes.firstName,
        value: case_.firstName
      },
      {
        attribute: config.dhis2KeyAttributes.surname,
        value: case_.lastName
      },
      {
        attribute: config.dhis2KeyAttributes.sex,
        value: constants.gender(case_.gender)
      },
      ...attributes
    ],
    enrollments: [ 
      {
        program: config.dhis2CasesProgram,
        orgUnit: orgUnitsIDs[index],
        events: [{
          program: config.dhis2CasesProgram,
          orgUnit: orgUnitsIDs[index],
          programStage: config.dhis2KeyProgramStages.labResults,
          eventDate: case_.classificationHistory[0].startDate,
          dataValues: [{
            dataElement: config.dhis2KeyDataElements.labTestResult,
            value: constants.labTestResult(case_.classificationHistory[0].classification),
            created: case_.classificationHistory[0].startDate
          }]
        }, ...outcome]
      }

    ],
  }
}
