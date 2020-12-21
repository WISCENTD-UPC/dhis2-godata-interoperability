
import fs from 'fs'

import * as R from 'ramda'

import { organisationUnitToLocation } from '../mappings/location'
import { logAction, logDone } from '../util'

const stringify = JSON.stringify.bind(JSON)

// Copy organisation units and exports the result hierarchically in a file
// TEMPORAL BEHAVIOR: since we are waiting to be able to upload directly in bulk
// to godata from this script, right now it behaves different in the browser (if no outputFile
// is provided, the JSON file is automatically downloaded) and in the command line (if an outputFile
// is provided, the JSON file is created with that name).
export const copyOrganisationUnits = (dhis2, godata, config, _ = {
  fs,
  stringify,
  encodeURIComponent,
  document
}) =>
  async (outputFile) => {
  logAction('Fetching organisation units')
  const organisationUnits = await dhis2.getOrganisationUnitsFromParent(config.rootID)
  logDone()

  logAction('Transforming organisation units to locations')
  const locations = await sendLocationsToGoData(config, organisationUnits)
  logDone()
  
  if (outputFile != null) {
    logAction(`Writing result into ${outputFile}`)
    _.fs.writeFileSync(outputFile, _.stringify(locations))
    logDone()
  } else {
    logAction('Downloading JSON file')
    const data = "data:text/json;charset=utf-8," + _.encodeURIComponent(_.stringify(locations))
    const a = _.document.createElement('a')
    _.document.body.appendChild(a)
    a.setAttribute("href", data)
    a.setAttribute("download", "organisation-units.json")
    a.click()
    a.remove()
    logDone()
  }
}

// Recursively separates a location in two parts: the location itself and its children
export function adaptLocationToHierarchy (location) {
  return {
    location: R.dissoc('children', location),
    children: R.map(adaptLocationToHierarchy, location.children)
  }
}

// Adds a location to its parent children array
export function addLocationToParent (indexedLocations, location) {
  const parentID = location.parentLocationId
  return parentID != null
    ? R.over(
      R.lensPath([parentID, 'children']),
      R.append(indexedLocations[location.id]),
      indexedLocations) 
    : indexedLocations
}

// Given the list of locations (already transformed from organisation units)
// creates a hierarchy (parent-children relationships) and returns the location
// with administrative level 0
export function createLocationHierarchy (config) {
  return (locations) => {
    if (locations.length === 0) return {}

    const rootID = config.rootID
    const indexedLocations = R.indexBy(R.prop('id'), locations)
    return R.pipe(
      R.sortBy(R.prop('geographicalLevelId')),
      R.reverse,
      R.reduce(addLocationToParent, indexedLocations),
      R.prop(rootID),
      adaptLocationToHierarchy
    )(locations)
  }
}

// Maps organisation unit to location, creates the hierarchy and returns and array
// TODO: once godata supports pressisting ids through the API, push the result instead of
// creating a file
export function sendLocationsToGoData (config, organisationUnits) {
  return R.pipe(
    R.map(organisationUnitToLocation),
    createLocationHierarchy(config),
    Array
  )(organisationUnits)
}

