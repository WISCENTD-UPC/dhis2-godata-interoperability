
const R = require('ramda')

const contactActions = require('../../actions/contact')
const config = require('../../config')
const constants = require('../../config/constants')

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
        vaccinesReceived: [],
        documents: [],
        addresses: [{
          typeID: constants.addressTypeID(),
          locationId: contact.orgUnit,
          address: contact.attributes[3].value
        }],
        dateOfBirth: contact.attributes[4].value
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

