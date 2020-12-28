
import util from 'util'

import * as R from 'ramda'

import { loadTrackedEntityInstances } from './common'
import {
  getIDFromDisplayName,
  mapAttributeNamesToIDs,
  completeSchema,
  allPromises,
  promisePipeline,
  logAction,
  logDone } from '../util'
import { trackedEntityToContact } from '../mappings/case'
import { trackedEntityToRelationship } from '../mappings/relationship'

// Copy dhis2 contacts and create additional persons and their relationships in Go.Data
export const copyContacts = (dhis2, godata, config, _ = { logAction }) => async () => {
  logAction('Fetching resources')
  const [
    relationships, // TODO -> this is not in use. It should filter relationship types
    attributes,
    outbreaks,
    user ] = await loadResources(dhis2, godata, config)
  logDone()

  logAction('Reading configuration')
  config = mapAttributeNamesToIDs(attributes)(config)
  logDone()
  
  return processContacts(dhis2, godata, config, user, _)(outbreaks)
}

// Load resources from DHIS2 and Go.Data
export function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getRelationshipTypes(),
    dhis2.getTrackedEntitiesAttributes(),
    godata.getOutbreaks(),
    godata.login()
  ])
}

// Transforms resources from dhis2 to send contacts to Go.Data
export function processContacts (dhis2, godata, config, user, _ = { logAction }) {
  return promisePipeline(
    R.tap(() => _.logAction('Fetching contacts and transforming them')),
    loadContactsForOutbreaks(dhis2, godata, config),
    R.tap(() => logDone()),
    R.tap(() => _.logAction('Sending contacts to Go.Data')),
    sendContactsToGoData(godata, user),
    R.tap(() => logDone())
  )
}

// Selects the side of the relationship that represents the contact
export function selectRelationshipSide (caseID) {
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
export function checkIfIsCase (casesIDs) {
  return (contact) => R.assoc('isCase', R.includes(contact.trackedEntityInstance, casesIDs), contact)
}

// Groups relationship and contacts of a case
export function addRelationshipsAndContacts (config) {
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
export async function loadContactsForCase (dhis2, config, casesIDs, caseID) {
  const contacts = await dhis2.getTrackedEntityRelationships(caseID)
  
  return R.pipe(
    R.map(selectRelationshipSide(caseID)),
    R.map(checkIfIsCase(casesIDs)),
    addRelationshipsAndContacts(config)
  )(contacts)
}

// Load relationships and contacts for an entire outbreaks
export function loadContactsForOutbreak (dhis2, godata, config) {
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
export function loadContactsForOutbreaks (dhis2, godata, config) {
  return R.pipe(
    R.pluck('id'),
    loadContactsForOutbreak(dhis2, godata, config),
    allPromises
  )
}

// Push relationships and contacts to Go.Data
export function sendContactsToGoData (godata, user) {
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

