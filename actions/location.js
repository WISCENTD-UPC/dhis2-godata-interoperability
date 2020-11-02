
const fs = require('fs')

const R = require('ramda')

const { organisationUnitToLocation } = require('../mappings/location')
const { logAction, logDone } = require('../util')

const stringify = JSON.stringify.bind(JSON)

// Copy organisation units and exports the result hierarchically in a file
const copyOrganisationUnits = (dhis2, godata, config, _ = { fs, stringify }) =>
  async (outputFile) => {
  logAction('Fetching organisation units')
  const organisationUnits = await dhis2.getOrganisationUnitsFromParent(config.rootID)
  logDone()

  logAction('Transforming organisation units to locations')
  const locations = await sendLocationsToGoData(config, organisationUnits)
  logDone()
  
  logAction(`Writing result into ${outputFile}`)
  _.fs.writeFileSync(outputFile, _.stringify(locations))
  logDone()
}

// Recursively separates a location in two parts: the location itself and its children
function adaptLocationToHierarchy (location) {
  return {
    location: R.dissoc('children', location),
    children: R.map(adaptLocationToHierarchy, location.children)
  }
}

// Adds a location to its parent children array
function addLocationToParent (indexedLocations, location) {
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
function createLocationHierarchy (config) {
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
function sendLocationsToGoData (config, organisationUnits) {
  return R.pipe(
    R.tap(R.pipe(R.pluck('geometry'), R.forEach(console.log))),
    R.map(organisationUnitToLocation),
    R.tap(R.pipe(R.pluck('geoLocation'), R.forEach(console.log))),
    createLocationHierarchy(config),
    Array
  )(organisationUnits)
}

module.exports = { copyOrganisationUnits }

