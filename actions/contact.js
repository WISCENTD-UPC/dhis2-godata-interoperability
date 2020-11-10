
const util = require('util')

const R = require('ramda')

const { loadTrackedEntityInstances } = require('./common')
const {
  getIDFromDisplayName,
  mapAttributeNamesToIDs,
  completeSchema,
  allPromises,
  logAction,
  logDone } = require('../util')
const { trackedEntityToContact } = require('../mappings/case')
const { trackedEntityToRelationship } = require('../mappings/relationship')

// Copy dhis2 contacts and create additional persons and their relationships in Go.Data
const copyContacts = (dhis2, godata, config) => async () => {
  logAction('Fetching resources')
  const [ relationships, attributes, outbreaks, user ] = await loadResources(dhis2, godata, config)
  logDone()
  logAction('Reading configuration')
  config = mapAttributeNamesToIDs(attributes)(config)
  const contactsRelationshipID = getIDFromDisplayName(relationships, config.dhis2ContactsRelationship)
  logDone()

  logAction('Fetching tracked entity instances and transforming them')
  const contacts = await loadContactsForOutbreaks(dhis2, godata, config)(outbreaks)
  logDone()
  
  logAction('Sending contacts to Go.Data')
  await sendContactsToGoData(godata, user)(contacts)
  logDone()
}

// Load resources from DHIS2 and Go.Data
function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getRelationshipTypes(),
    dhis2.getTrackedEntitiesAttributes(),
    godata.getOutbreaks(),
    godata.login()
  ])
}

// Selects the side of the relationship that represents the contact
function selectRelationshipSide (caseID) {
  return (relationship) => {
    const fromID = R.path(['from', 'trackedEntityInstance', 'trackedEntityInstance'], relationship)
    const selector = fromID !== caseID ? 'from' : 'to'

    return R.pipe(
      R.path([selector, 'trackedEntityInstance']),
      R.assoc('relationship', R.dissoc(selector, relationship))
    )(relationship)
  }
}

// Check if the contact is already a case
function checkIfIsCase (casesIDs) {
  return (contact) => R.assoc('isCase', R.includes(contact.trackedEntityInstance, casesIDs), contact)
}

// Groups relationship and contacts of a case
function addRelationshipsAndContacts (config) {
  return R.reduce((acc, contact) => {
    const { isCase } = contact
    const prop = isCase ? 'relationships' : 'contacts'
    const schema = isCase
      ? trackedEntityToRelationship(config)
      : {
        contact: trackedEntityToContact(config),
        relationship: trackedEntityToRelationship(config)
      }
    
    return R.over(R.lensProp(prop), R.append(completeSchema(schema)(contact)), acc)
  }, { contacts: [], relationships: [] })
}

// Loads contacts and relationships for a case
async function loadContactsForCase (dhis2, config, casesIDs, caseID) {
  const contacts = await dhis2.getTrackedEntityRelationships(caseID)
  
  return R.pipe(
    R.map(selectRelationshipSide(caseID)),
    R.map(checkIfIsCase(casesIDs)),
    addRelationshipsAndContacts(config)
  )(contacts)
}

// Load relationships and contacts for an entire outbreaks
function loadContactsForOutbreak (dhis2, godata, config) {
  return R.map(async (outbreakID) => {
    const cases = await godata.getOutbreakCases(outbreakID)
    const casesIDs = R.pluck('id', cases)

    return {
      outbreakID: outbreakID,
      cases: await allPromises(R.map(async (id) => ({
        caseID: id,
        ...(await loadContactsForCase(dhis2, config, casesIDs, id))
      }), casesIDs))
    }
  })
}

// Load relationships and contacts for all the outbreaks
function loadContactsForOutbreaks (dhis2, godata, config) {
  return R.pipe(
    R.pluck('id'),
    loadContactsForOutbreak(dhis2, godata, config),
    allPromises
  )
}

// Push relationships and contacts to Go.Data
function sendContactsToGoData (godata, user) {
  return R.pipe(R.map(
    async (outbreak) => {
      const cases = outbreak.cases
      await godata.activateOutbreakForUser(user.userId, outbreak.outbreakID)

      return await allPromises(
        R.map(({ caseID, contacts, relationships }) => allPromises([
          contacts.length > 0
            ? godata.createCaseContacts(outbreak.outbreakID, caseID, contacts)
            : Promise.resolve([]),
          relationships.length > 0
            ? godata.createCaseRelationships(outbreak.outbreakID, caseID, relationships)
            : Promise.resolve([])
        ]), cases)
      )
    }
  ), allPromises)
}

module.exports = { copyContacts }

