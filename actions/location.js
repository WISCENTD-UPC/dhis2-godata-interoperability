
const fs = require('fs')

const R = require('ramda')

const { organisationUnitToLocation } = require('../mappings/location')

const stringify = JSON.stringify.bind(JSON)

const copyOrganisationUnits = (dhis2, godata, config, _ = { fs, stringify }) =>
  async (outputFile) => {
  const organisationUnits = await dhis2.getOrganisationUnitsFromParent(config.rootID)
  const locations = await sendLocationsToGoData(config, organisationUnits)
  _.fs.writeFileSync(outputFile, _.stringify(locations))
}

function adaptLocationToHierarchy (location) {
  return {
    location: R.dissoc('children', location),
    children: R.map(adaptLocationToHierarchy, location.children)
  }
}

function addLocationToParent (indexedLocations, location) {
  const parentID = location.parentLocationId
  return parentID != null
    ? R.over(
      R.lensPath([parentID, 'children']),
      R.append(indexedLocations[location.id]),
      indexedLocations) 
    : indexedLocations
}

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

function sendLocationsToGoData (config, organisationUnits) {
  return R.pipe(
    R.map(organisationUnitToLocation),
    createLocationHierarchy(config),
    Array
  )(organisationUnits)
}

module.exports = { copyOrganisationUnits }

