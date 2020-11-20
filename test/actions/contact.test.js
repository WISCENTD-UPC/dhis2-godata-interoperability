
const R = require('ramda')
const { v4: uuid } = require('uuid')
const { createUUIDs } = require('../test-util/util')
const uuids = createUUIDs()

const contactActions = require('../../actions/contact')
const config = require('../../config')
const constants = require('../../config/constants')

const { mapAttributeNamesToIDs } = require('../../util/index')

const {
  relationshipTypes,
  attributes,
  trackedEntities,
  relationships,
  outbreaks,
  outbreakCases,
  user
} = require('../test-util/mocks')

const resolve = Promise.resolve.bind(Promise)
const mock = (returnValue) => jest.fn().mockReturnValue(returnValue)
const mockPromise = R.pipe(resolve, mock)
const mockPromises = R.pipe(R.map(resolve), (arr) => {
  const mock = jest.fn()
  R.forEach(_ => mock.mockReturnValueOnce(_), arr)
  return mock
})

test('contactActions.copyContacts', async () => {
  const getRelationshipTypes = mockPromise(relationshipTypes)
  const getTrackedEntitiesAttributes = mockPromise(attributes)
  const getTrackedEntityRelationships = mockPromises(relationships)
  const getOutbreaks = mockPromise(outbreaks)
  const getOutbreakCases = mockPromise(outbreakCases)
  const login = mockPromise(user)
  const activateOutbreakForUser = mockPromise()
  const createCaseContacts = jest.fn()
  const createCaseRelationships = jest.fn()

  const dhis2 = {
    getRelationshipTypes,
    getTrackedEntitiesAttributes,
    getTrackedEntityRelationships
  }
  const godata = {
    getOutbreaks,
    getOutbreakCases,
    login,
    activateOutbreakForUser,
    createCaseContacts,
    createCaseRelationships
  }
  const testConfig = R.clone(config)

  await contactActions.copyContacts(dhis2, godata, testConfig, {})()
  
  expect(getOutbreakCases).toHaveBeenCalledWith(outbreaks[0].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(1, outbreakCases[0].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(2, outbreakCases[1].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(3, outbreakCases[2].id)
  expect(activateOutbreakForUser).toHaveBeenCalledWith(user.userId, outbreaks[0].id)
  expect(createCaseRelationships).toHaveBeenCalledWith(outbreaks[0].id, outbreakCases[0].id, [
    {
      persons: [{
        id: trackedEntities[1][0].trackedEntityInstance,
        source: false,
        target: false
      }],
      contactDate: relationships[0][0].created,
      contactDateEstimated: false,
      certaintyLevelId: constants.certaintyLevel(),
      people: []
    }
  ])
  const contact = relationships[1][0].from.trackedEntityInstance
  expect(createCaseContacts).toHaveBeenCalledWith(outbreaks[0].id, outbreakCases[1].id, [
    {
      contact: {
        id: contact.trackedEntityInstance,
        firstName: contact.attributes[0].value,
        lastName: contact.attributes[1].value,
        gender: constants.gender(contact.attributes[2].value),
        ocupation: constants.ocupation(),
        dateOfReporting: contact.created,
        riskLevel: constants.riskLevel(),
        vaccinesReceived: null,
        documents: [],
        addresses: [{
          typeID: constants.addressTypeID(),
          locationId: contact.orgUnit,
          address: contact.attributes[3].value
        }],
        dateOfBirth: contact.attributes[4].value,
        pregnancyStatus: null
      },
      relationship: {
        persons: [{
          id: contact.trackedEntityInstance,
          source: false,
          target: false
        }],
        contactDate: relationships[1][0].created,
        contactDateEstimated: false,
        certaintyLevelId: constants.certaintyLevel(),
        people: []
      }
    }
  ])
})

test('contactActions.loadResources', async () => {
  const getRelationshipTypes = mockPromise(relationshipTypes)
  const getTrackedEntitiesAttributes = mockPromise(attributes)
  const getOutbreaks = mockPromise(outbreaks)
  const login = mockPromise(user)

  const dhis2 = {
    getRelationshipTypes,
    getTrackedEntitiesAttributes
  }
  const godata = {
    getOutbreaks,
    login
  }
  const testConfig = uuid()

  const response = await contactActions.loadResources(dhis2, godata, testConfig)
  expect(response).toStrictEqual([ relationshipTypes, attributes, outbreaks, user])
})

test('contactActions.selectRelationshipSide from case', selectRelationshipSideTest({
  caseID: uuids('1'),
  relationship: {
    from: { trackedEntityInstance: { trackedEntityInstance: uuids('1') } },
    to: { trackedEntityInstance: { trackedEntityInstance: uuids('2') } }
  },
  expectedResult: {
    relationship: {
      from: { trackedEntityInstance: { trackedEntityInstance: uuids('1') } },
    },
    trackedEntityInstance: uuids('2')
  }
}))

test('contactActions.selectRelationshipSide to case', selectRelationshipSideTest({
  caseID: uuids('2'),
  relationship: {
    from: { trackedEntityInstance: { trackedEntityInstance: uuids('1') } },
    to: { trackedEntityInstance: { trackedEntityInstance: uuids('2') } }
  },
  expectedResult: {
    relationship: {
      to: { trackedEntityInstance: { trackedEntityInstance: uuids('2') } },
    },
    trackedEntityInstance: uuids('1')
  }
}))

test('contactActions.checkIfIsCase true', checkIfIsCaseTest({
  casesIDs: [ uuids('1'), uuids('2') ],
  contact: { trackedEntityInstance: uuids('1') },
  expectedResult: { trackedEntityInstance: uuids('1'), isCase: true }
}))

test('contactActions.checkIfIsCase false', checkIfIsCaseTest({
  casesIDs: [ uuids('1'), uuids('2') ],
  contact: { trackedEntityInstance: uuids('3') },
  expectedResult: { trackedEntityInstance: uuids('3'), isCase: false }
}))

test('contactActions.addRelationshipsAndContacts relationships', addRelationshipsAndContactsTest({
  contacts: [ rel_(relationships[0][0]) ],
  expected: (contacts) => { 
    return {
      relationships: [ relationship_(contacts[0]) ],
      contacts: []
    }
  }
}))

test('contactActions.addRelationshipsAndContacts contacts', addRelationshipsAndContactsTest({
  contacts: [ cont_(relationships[1][0]) ],
  expected: (contacts) => { 
    return {
      relationships: [],
      contacts: [ contact_(contacts[0]) ]
    }
  }
}))

test('contactActions.loadContactsForCase', async () => {
  const getTrackedEntityRelationships = mockPromises(relationships)
  const dhis2 = { getTrackedEntityRelationships }
  const testConfig = R.clone(config)
  const casesIDs = R.pluck('id', outbreakCases)
  const caseID = outbreakCases[0].id
  const contact = rel_(relationships[0][0])
  const expected = (contact) => { 
    return {
      relationships: [ relationship_(contact) ],
      contacts: []
    }
  }
  const response = await contactActions.loadContactsForCase(dhis2, testConfig, casesIDs, caseID)
  expect(getTrackedEntityRelationships).toHaveBeenCalledWith(caseID)
  expect(response).toStrictEqual(expected(contact))
})

test('contactActions.loadContactsForOutbreak', async () => {
  const getTrackedEntityRelationships = mockPromises(relationships)
  const getOutbreakCases = mockPromise(outbreakCases)
  const dhis2 = { getTrackedEntityRelationships }
  const godata = { getOutbreakCases }
  const testConfig = R.clone(config)
  
  await contactActions.loadContactsForOutbreak(dhis2, godata, testConfig)([ outbreaks[0].id ])

  expect(getOutbreakCases).toHaveBeenCalledWith(outbreaks[0].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(1, outbreakCases[0].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(2, outbreakCases[1].id)
  expect(getTrackedEntityRelationships).toHaveBeenNthCalledWith(3, outbreakCases[2].id)
})

test('contactActions.loadContactsForOutbreaks', async () => {
  const getTrackedEntityRelationships = mockPromises(relationships)
  const getOutbreakCases = mockPromise(outbreakCases)
  const dhis2 = { getTrackedEntityRelationships }
  const godata = { getOutbreakCases }
  const testConfig = mapAttributeNamesToIDs(attributes)(config)

  const relationship = rel_(relationships[0][0])
  const contact = cont_(relationships[1][0])
  const expected = [
    {
      outbreakID: outbreaks[0].id,
      cases: [
        {
          caseID: outbreakCases[0].id,
          relationships: [ relationship_(relationship) ],
          contacts: []
        },
        {
          caseID: outbreakCases[1].id,
          relationships: [],
          contacts: [ contact_(contact) ]
        },
        {
          caseID: outbreakCases[2].id,
          relationships: [],
          contacts: []
        }
      ]
    }
  ]
  const response = await contactActions.loadContactsForOutbreaks(dhis2, godata, testConfig)(outbreaks)
  expect(response).toStrictEqual(expected)
})

test('contactActions.sendContactsToGoData', async () => {
  const activateOutbreakForUser = mockPromise()
  const createCaseContacts = jest.fn()
  const createCaseRelationships = jest.fn()
  const godata = { 
    activateOutbreakForUser,
    createCaseContacts,
    createCaseRelationships
  }
  const relationship = relationship_(rel_(relationships[0][0]))
  const contact = contact_(cont_(relationships[1][0]))

  const testOutbreaks = [
    {
      outbreakID: outbreaks[0].id,
      cases: [
        {
          caseID: outbreakCases[0].id,
          relationships: [ relationship ],
          contacts: []
        },
        {
          caseID: outbreakCases[1].id,
          relationships: [],
          contacts: [ contact ]
        },
        {
          caseID: outbreakCases[2].id,
          relationships: [],
          contacts: []
        }
      ]
    }
  ]
  
  await contactActions.sendContactsToGoData(godata, user)(testOutbreaks)

  expect(activateOutbreakForUser).toHaveBeenCalledWith(user.userId, outbreaks[0].id)
  expect(createCaseRelationships).toHaveBeenCalledWith(outbreaks[0].id, outbreakCases[0].id, [ relationship ])
  expect(createCaseContacts).toHaveBeenCalledWith(outbreaks[0].id, outbreakCases[1].id, [ contact ])
})

function selectRelationshipSideTest ({ caseID, relationship, expectedResult }) {
  return () => {
    const response = contactActions.selectRelationshipSide(caseID)(relationship)
    expect(response).toStrictEqual(expectedResult)
  }
}

function checkIfIsCaseTest ({ casesIDs, contact, expectedResult }) {
  return () => {
    const response = contactActions.checkIfIsCase(casesIDs)(contact)
    expect(response).toStrictEqual(expectedResult)
  }
}

function addRelationshipsAndContactsTest ({ contacts, expected }) {
  return () => {
    const testConfig = mapAttributeNamesToIDs(attributes)(config)
    const response = contactActions.addRelationshipsAndContacts(testConfig)(contacts)
    expect(response).toStrictEqual(expected(contacts))
  }
}

function relationship_ (contact) {
  return {
    persons: [
      {
        id: contact.trackedEntityInstance,
        source: false,
        target: false
      }
    ],
    contactDate: contact.relationship.created,
    contactDateEstimated: false,
    certaintyLevelId: constants.certaintyLevel(),
    people: []
  }
}

function rel_ (contact) {
  return {
    relationship: {
      relationshipType: contact.relationshipType,
      created:  contact.created,
      from: {
        trackedEntityInstance: {
          trackedEntityInstance: contact.from.trackedEntityInstance.trackedEntityInstance
        }
      }
    },
    trackedEntityInstance: contact.to.trackedEntityInstance.trackedEntityInstance,
    isCase: true
  }
}

function cont_ (contact) {
  return {
    relationship: {
      relationshipType: contact.relationshipType,
      created: contact.created,
      to: {
        trackedEntityInstance: {
          trackedEntityInstance: contact.to.trackedEntityInstance.trackedEntityInstance
        }
      }
    },
    attributes: contact.from.trackedEntityInstance.attributes,
    trackedEntityInstance: contact.from.trackedEntityInstance.trackedEntityInstance,
    orgUnit: contact.from.trackedEntityInstance.orgUnit,
    created: contact.from.trackedEntityInstance.created,
    isCase: false
  }
}

function contact_ (contact) {
  return {
    contact: {
      id: contact.trackedEntityInstance,
      firstName: contact.attributes[0].value,
      lastName: contact.attributes[1].value,
      gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_'+contact.attributes[2].value.toUpperCase(),
      ocupation: constants.ocupation(),
      dateOfReporting: contact.created,
      riskLevel: constants.riskLevel(),
      vaccinesReceived: [],
      documents: [],
      addresses: [{
        typeID: constants.addressTypeID,
        locationId: contact.orgUnit,
        address: contact.attributes[3].value
      }],
      dateOfBirth: contact.attributes[4].value
    },
    relationship: relationship_(contact)
  }
}

