
const R = require('ramda')

const { optionToReferenceData } = require('../mappings/metadata')
const { getIDFromDisplayName, allPromises, promisePipeline } = require('../util')

// Copy general metadata from DHIS2 from Go.Data
const copyMetadata = (dhis2, godata, config) => async () => {
  const [ allSets, options ] = await loadResources(dhis2, godata, config)
  
  return await processMetadata(dhis2, godata, config, allSets, options)
}

// Transforms data from the resources and push it to Go.Data
function processMetadata (dhis2, godata, config, allSets, options) {
  return promisePipeline(
    R.toPairs,
    R.map(mapOptionSetIDFromDisplayName(allSets)),
    R.map(loadOptionSets(dhis2)), // TODO -> get from already loaded allSets
    allPromises,
    R.map(mapOptionsFromID(options)),
    R.map(transformOptions()),
    R.flatten,
    sendOptionSetsToGoData(godata)
  )(config.metadata.optionSets)
}

// Load resources from DHIS2
function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getOptionSets(),
    dhis2.getOptions()
  ])
}

// Change display names to ids in option sets
function mapOptionSetIDFromDisplayName (optionSets) {
  return R.adjust(1, getIDFromDisplayName(optionSets))
}

// Load option sets
function loadOptionSets (dhis2) {
  return async (map) => {
    const options = (await dhis2.getOptionSet(map[1])).options
    return R.update(1, options, map)
  }
}

// hydrate options from ids
function mapOptionsFromID (options) {
  return R.adjust(1, R.map(({ id }) => R.find(R.propEq('id', id), options)))
}

// Map options to fit Go.Data's schema
function transformOptions () {
  return ([ optionSet, options ]) => R.map(optionToReferenceData(optionSet), options)
}

// Push option sets to Go.Data
function sendOptionSetsToGoData (godata) {
  return R.pipe(
    R.map(godata.createReferenceData.bind(godata)),
    allPromises
  )
}

module.exports = {
  copyMetadata,
  processMetadata,
  loadResources,
  mapOptionSetIDFromDisplayName,
  loadOptionSets,
  mapOptionsFromID,
  transformOptions,
  sendOptionSetsToGoData
}
