
const util = require('util')

const R = require('ramda')

const { loadTrackedEntityInstances } = require('./common')
const {
  getIDFromDisplayName,
  mapAttributeNamesToIDs,
  completeSchema,
  allPromises } = require('../util')
const { trackedEntityToContact } = require('../mappings/case')
const { trackedEntityToRelationship } = require('../mappings/relationship')

const copyContacts = (dhis2, godata, config) => async () => {
  const [ relationships, attributes, outbreaks, user ] = await allPromises([
    dhis2.getRelationshipTypes(),
    dhis2.getTrackedEntitiesAttributes(),
    godata.getOutbreaks(),
    godata.login()
  ])

  config = mapAttributeNamesToIDs(attributes)(config)
  const contactsRelationshipID = getIDFromDisplayName(relationships, config.dhis2ContactsRelationship)

  const contacts = await loadContactsForOutbreaks(dhis2, godata, config)(outbreaks)

  return await sendContactsToGoData(godata, user)(contacts)
}

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

function checkIfIsCase (casesIDs) {
  return (contact) => R.assoc('isCase', R.includes(contact.trackedEntityInstance, casesIDs), contact)
}

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

async function loadContactsForCase (dhis2, config, casesIDs, caseID) {
  const contacts = await dhis2.getTrackedEntityRelationships(caseID)
  return R.pipe(
    R.map(selectRelationshipSide(caseID)),
    R.map(checkIfIsCase(casesIDs)),
    addRelationshipsAndContacts(config)
  )(contacts)
}

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

function loadContactsForOutbreaks (dhis2, godata, config) {
  return R.pipe(
    R.pluck('id'),
    loadContactsForOutbreak(dhis2, godata, config),
    allPromises
  )
}

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

