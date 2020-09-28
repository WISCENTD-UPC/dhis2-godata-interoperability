
const R = require('ramda')
const { v4: uuid } = require('uuid')
const { createUUIDs } = require('../test-util/util')
const uuids = createUUIDs()

const caseActions = require('../../actions/case')
const config = require('../../config')
const constants = require('../../config/constants')

const {
  orgUnits,
  programs,
  programStages,
  dataElements,
  attributes,
  trackedEntities,
  outbreaks,
  user
} = require('../test-util/mocks')

const resolve = Promise.resolve.bind(Promise)

test('caseActions.copyCases', async () => {
  const getPrograms = jest.fn().mockReturnValue(resolve(programs))
  const getProgramStages = jest.fn().mockReturnValue(resolve(programStages))
  const getDataElements = jest.fn().mockReturnValue(resolve(dataElements))
  const getTrackedEntitiesAttributes = jest.fn().mockReturnValue(resolve(attributes))
  const getOrganisationUnitsFromParent = jest.fn().mockReturnValue(resolve(orgUnits))
  const getOutbreaks = jest.fn().mockReturnValue(resolve(outbreaks))
  const login = jest.fn().mockReturnValue(resolve(user))
  const activateOutbreakForUser = jest.fn()
  const createOutbreakCase = jest.fn()
  const loadTrackedEntityInstances = jest.fn().mockReturnValue(resolve(trackedEntities))
  
  const dhis2 = {
    getPrograms,
    getProgramStages,
    getDataElements,
    getTrackedEntitiesAttributes,
    getOrganisationUnitsFromParent
  }
  const godata = {
    getOutbreaks,
    login,
    activateOutbreakForUser,
    createOutbreakCase
  }

  await caseActions.copyCases(dhis2, godata, config, {
    loadTrackedEntityInstances
  })()

  expect(getPrograms).toHaveBeenCalledWith()
  expect(getProgramStages).toHaveBeenCalledWith()
  expect(getDataElements).toHaveBeenCalledWith()
  expect(getTrackedEntitiesAttributes).toHaveBeenCalledWith()
  expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(config.rootID)
  expect(loadTrackedEntityInstances).toHaveBeenCalledWith(dhis2, orgUnits, programs[0].id)
  expect(getOutbreaks).toHaveBeenCalledWith()
  expect(login).toHaveBeenCalledWith()
  expect(login).toHaveBeenCalledTimes(1)
  expect(activateOutbreakForUser).toHaveBeenCalledTimes(1)
  expect(activateOutbreakForUser).toHaveBeenCalledWith(user.userId, outbreaks[0].id)
  expect(createOutbreakCase).toHaveBeenCalledTimes(3)
  expect(createOutbreakCase).toHaveBeenNthCalledWith(
    1,
    outbreaks[0].id,
    case_(trackedEntities[0][0], {
      classification: constants.caseClassification('confirmed')
    })
  )
  expect(createOutbreakCase).toHaveBeenNthCalledWith(
    2,
    outbreaks[0].id,
    case_(trackedEntities[1][0], {
      classification: constants.caseClassification('probable')
    })
  )
  expect(createOutbreakCase).toHaveBeenNthCalledWith(
    3,
    outbreaks[0].id,
    case_(trackedEntities[3][0], {
      classification: constants.caseClassification('NOT_A_CASE_DISCARDED')
    })
  )
})

test('caseActions.loadResources', async () => {
  
  const getPrograms = jest.fn().mockReturnValue(resolve(programs))
  const getProgramStages = jest.fn().mockReturnValue(resolve(programStages))
  const getDataElements = jest.fn().mockReturnValue(resolve(dataElements))
  const getTrackedEntitiesAttributes = jest.fn().mockReturnValue(resolve(attributes))
  const getOrganisationUnitsFromParent = jest.fn().mockReturnValue(resolve(orgUnits))
  const getOutbreaks = jest.fn().mockReturnValue(resolve(outbreaks))

  const dhis2 = { 
    getPrograms, 
    getProgramStages,
    getDataElements,
    getTrackedEntitiesAttributes,
    getOrganisationUnitsFromParent
  }
  const godata = { getOutbreaks }

  const rootID = uuid()
  const testConfig = R.assoc('rootID', rootID, config)

  const response = await caseActions.loadResources(dhis2, godata, testConfig)

  expect(response).toStrictEqual([ programs, programStages, dataElements, attributes, orgUnits, outbreaks])
  expect(getOrganisationUnitsFromParent).toHaveBeenCalledWith(rootID)
})

test('caseActions.findOutbreackForCase', () => {
  const locationID = trackedEntities[0][0].orgUnit
  const available = R.pipe(
    R.reduceBy((acc, el) => R.append(el, acc), [], R.path(['locationIds', 0]))
  )(outbreaks)

  const response = caseActions.findOutbreackForCase(available, orgUnits, locationID)
  expect(response).toStrictEqual(outbreaks[0].id)
})

test('caseActions.assignOutbreak', () => {
  const response = caseActions.assignOutbreak(outbreaks, orgUnits)(trackedEntities[0][0])
  const expected = R.assoc('outbreak', outbreaks[0].id, trackedEntities[0][0])
  expect(response).toStrictEqual(expected)
})

test('caseActions.addLabRequestStage', () => {
  const labRequestID = uuid()
  const data = uuid()
  const te = {
    events: [
      {
        programStage: labRequestID,
        dataValues: data
      }
    ]
  }

  const response = caseActions.addLabRequestStage(labRequestID)(te)
  const expected = R.assoc('labRequestStage', te.events[0], te)
  expect(response).toStrictEqual(expected)
})

test('caseActions.addLabResultStage', () => {
  const labResultsID = uuid()
  const data = uuid()
  const te = {
    events: [
      {
        programStage: labResultsID,
        dataValues: data
      }
    ]
  }

  const response = caseActions.addLabResultStage(labResultsID)(te)
  const expected = R.assoc('labResultStage', te.events[0], te)
  expect(response).toStrictEqual(expected)
})

test('caseActions.findDataValueByID w/ dataValues', findDataValueByIDTest({
  id: uuids('1'),
  dataValues: [
    { dataElement: uuids('1'), value: uuids('2') }
  ],
  expectedResult: { dataElement: uuids('1'), value: uuids('2') }
}))

test('caseActions.findDataValueByID w/o dataValues', findDataValueByIDTest({
  id: uuid(),
  expectedResult: undefined
}))

test('caseActions.checkDataValue correct value', checkDataValueTest({
  dataValues: [
    { dataElement: uuids('1'), value: uuids('2') }
  ],
  dataElement: uuids('1'),
  value: uuids('2'),
  expectedResult: true
}))

test('caseActions.checkDataValue incorrect value', checkDataValueTest({
  dataValues: [
    { dataElement: uuids('1'), value: uuids('2') }
  ],
  dataElement: uuids('1'),
  value: uuids('3'),
  expectedResult: false
}))

test('caseActions.checkDataValuesConditions positive value', checkDataValuesConditionsTest({
  conditions: [ [ uuids('1'), 'Positive' ] ], 
  dataValues: { 
    dataElement: uuids('1'), 
    value: 'Positive'
  },
  expectedResult: true
}))

test('caseActions.checkDataValuesConditions negative value', checkDataValuesConditionsTest({
  conditions: [ [ uuids('1'), 'Positive' ] ], 
  dataValues: { 
    dataElement: uuids('1'), 
    value: 'Negative'
  },
  expectedResult: false
}))

test('caseActions.addLabResult positive value', addLabResultTest({
  conditions: [ [ uuids('1'), 'Positive' ] ], 
  dataValues: { 
    dataElement: uuids('1'), 
    value: 'Positive'
  },
  expectedResult: 'POSITIVE'
}))

test('caseActions.addLabResult negative value', addLabResultTest({
  conditions: [ [ uuids('1'), 'Positive' ] ], 
  dataValues: { 
    dataElement: uuids('1'), 
    value: 'Negative'
  },
  expectedResult: 'NEGATIVE'
}))

test('caseActions.addCaseClassification CONFIRMED', addCaseClassificationTest({
  trackedEntity: {
    labResult: 'POSITIVE',
    labResultStage: uuid(),
    labRequestStage: uuid()
  }, 
  expectedResult: 'CONFIRMED'
}))

test('caseActions.addCaseClassification NOT_A_CASE_DISCARDED', addCaseClassificationTest({
  trackedEntity: {
    labResult: 'NEGATIVE',
    labResultStage: uuid(),
    labRequestStage: uuid()
  }, 
  expectedResult: 'NOT_A_CASE_DISCARDED'
}))

test('caseActions.addCaseClassification PROBABLE', addCaseClassificationTest({
  trackedEntity: {
    labResult: null,
    labResultStage: null,
    labRequestStage: uuid()
  }, 
  expectedResult: 'PROBABLE'
}))

test('caseActions.addCaseClassification SUSPECT', addCaseClassificationTest({
  trackedEntity: {
    labResult: null,
    labResultStage: null,
    labRequestStage: null
  }, 
  expectedResult: 'SUSPECT'
}))

test('caseActions.addLabInformation', () => {
  const labResultsID = uuid()
  const labRequestID = uuid()
  const dataID = uuid()
  const conditions = [ [ dataID, 'Positive' ] ]
  const te = {
    events: [
      {
        programStage: labRequestID,
        dataValues: []
      },
      {
        programStage: labResultsID,
        dataValues: [
          { dataElement: dataID , value: 'Positive' }
        ]
      }
    ]
  }
  const response = caseActions.addLabInformation(labResultsID, labRequestID, conditions, config)(te)
  const expected = R.pipe(
    R.assoc('labResultStage', te.events[1]), 
    R.assoc('labRequestStage', te.events[0]),
    R.assoc('labResult', 'POSITIVE'),
    R.assoc('caseClassification', 'CONFIRMED')
  )(te)

  expect(response).toStrictEqual(expected)
})

test('caseActions.sendCasesToGoData', async () => {
  const login = jest.fn().mockReturnValue(resolve(user))
  const activateOutbreakForUser = jest.fn()
  const createOutbreakCase = jest.fn()

  const godata = {
    login,
    activateOutbreakForUser,
    createOutbreakCase
  }
  const testOutbreaks = [
    {
      outbreak: outbreaks[0].id,
      id: trackedEntities[0][0].trackedEntityInstance,
      firstName: trackedEntities[0][0].attributes[0].value,
      lastName: trackedEntities[0][0].attributes[1].value,
      gender: constants.gender(trackedEntities[0][0].attributes[2].value),
      ocupation: constants.ocupation(),
      dateOfReporting: trackedEntities[0][0].created,
      riskLevel: constants.riskLevel(),
      vaccinesReceived: [],
      documents: [],
      addresses: [{
        typeID: constants.addressTypeID(),
        locationId: trackedEntities[0][0].orgUnit,
        address: trackedEntities[0][0].attributes[3].value
      }],
      classification: constants.caseClassification('confirmed'),
      dateRanges: [],
      questionnaireAnswers: {},
      dateOfBirth: trackedEntities[0][0].attributes[4].value,
      dob: null
    }
  ]
  
  const response = await caseActions.sendCasesToGoData(godata)(testOutbreaks)
  
  expect(login).toHaveBeenCalledWith()
  expect(login).toHaveBeenCalledTimes(1)
  expect(activateOutbreakForUser).toHaveBeenCalledTimes(1)
  expect(activateOutbreakForUser).toHaveBeenCalledWith(user.userId, outbreaks[0].id)
  expect(createOutbreakCase).toHaveBeenCalledTimes(1)
  expect(createOutbreakCase).toHaveBeenCalledWith(
    outbreaks[0].id,
    case_(trackedEntities[0][0], {
      classification: constants.caseClassification('confirmed')
    })
  )

})

function findDataValueByIDTest ({ id, dataValues = null, expectedResult }) {
  return () => {
    const result = caseActions.findDataValueByID(dataValues, id)
    expect(result).toStrictEqual(expectedResult)
  }
}

function checkDataValueTest ({ dataValues = null, dataElement, value, expectedResult }) {
  return () => {
    const result = caseActions.checkDataValue(dataValues, dataElement, value)
    expect(result).toBe(expectedResult)
  }
}

function checkDataValuesConditionsTest ({ conditions, dataValues = null, expectedResult }) {
  return () => {
    const trackedEntity = {
      labResultStage: {
        dataValues: [ dataValues ]
      }
    }
    const response = caseActions.checkDataValuesConditions(conditions)(trackedEntity)
    expect(response).toBe(expectedResult)
  }
}

function addLabResultTest ({ conditions, dataValues = null, expectedResult }) {
  return () => {
    const trackedEntity = {
      labResultStage: {
        dataValues: [ dataValues ]
      }
    }
    const response = caseActions.addLabResult(conditions)(trackedEntity)
    const expected = R.assoc('labResult', expectedResult, trackedEntity)
    expect(response).toStrictEqual(expected)
  }
}

function addCaseClassificationTest ({ trackedEntity, expectedResult }) {
  return () => {
    const response = caseActions.addCaseClassification()(trackedEntity)
    const expected = R.assoc('caseClassification', expectedResult, trackedEntity)
    expect(response).toStrictEqual(expected)
  }
}

function case_ (te, base) {
  return R.mergeDeepLeft(base, {
    id: te.trackedEntityInstance,
    firstName: te.attributes[0].value,
    lastName: te.attributes[1].value,
    gender: constants.gender(te.attributes[2].value),
    ocupation: constants.ocupation(),
    dateOfReporting: te.created,
    riskLevel: constants.riskLevel(),
    vaccinesReceived: [],
    documents: [],
    addresses: [{
      typeID: constants.addressTypeID(),
      locationId: te.orgUnit,
      address: te.attributes[3].value
    }],
    dateRanges: [],
    questionnaireAnswers: {},
    dateOfBirth: te.attributes[4].value,
    dob: null
  })
}

