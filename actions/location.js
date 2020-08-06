
const fs = require('fs')

const R = require('ramda')

const { organisationUnitToLocation } = require('../mappings/location')

const copyOrganisationUnits = (dhis2, godata, config) => async (outputFile) => {
  const organisationUnits = await dhis2.getOrganisationUnitsFromParent(config.rootID)
  const locations = await sendLocationsToGoData(organisationUnits)
  fs.writeFileSync(outputFile, JSON.stringify(locations))
}

// HELPERS

function adaptLocationToHierarchy (location) {
  return {
    location: R.dissoc('children', location),
    children: R.map(adaptLocationToHierarchy, location.children)
  }
}

function createLocationHierarchy (locations) {
  const rootID = locations[0].id
  const indexedLocations = R.reduce((acc, location) => R.assoc(location.id, location, acc), {}, locations)
  return R.pipe(
    R.sortBy(R.prop('level')),
    R.reverse,
    R.reduce((indexedLocations, location) => {
      const parentID = R.prop('parentLocationId', location)
      if (parentID != null) {
        const parent = R.prop(parentID, indexedLocations)
        parent.children.push(location)
      }
      return indexedLocations
    }, indexedLocations),
    R.prop(rootID),
    adaptLocationToHierarchy
  )(locations)
}

function sendLocationsToGoData (organisationUnits) {
  return R.pipe(
    R.map(organisationUnitToLocation),
    createLocationHierarchy,
    _ => [_]
  )(organisationUnits)
}

module.exports = { copyOrganisationUnits }

