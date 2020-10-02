
const R = require('ramda')

const { optionToReferenceData } = require('../mappings/metadata')
const { getIDFromDisplayName, allPromises } = require('../util')

const copyMetadata = (dhis2, godata, config) => async () => {
  const [ allSets, options ] = await loadResources(dhis2, godata, config)
  
  const optionsConfig = config.metadata.optionSets

  const optionSets = await R.pipe(
    R.toPairs,
    R.map(mapOptionSetIDFromDisplayName(allSets)),
    R.map(loadOptionSets(dhis2)),
    allPromises
  )(optionsConfig)
  
  return await R.pipe(
    R.map(mapOptionsFromID(options)),
    R.map(transformOptions()),
    R.flatten,
    sendOptionSetsToGoData(godata)
  )(optionSets)
}

function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getOptionSets(),
    dhis2.getOptions()
  ])
}

function mapOptionSetIDFromDisplayName (optionSets) {
  return R.adjust(1, getIDFromDisplayName(optionSets))
}

function loadOptionSets (dhis2) {
  return async (map) => {
    const options = (await dhis2.getOptionSet(map[1])).options
    return R.update(1, options, map)
  }
}

function mapOptionsFromID (options) {
  return R.adjust(1, R.map(({ id }) => R.find(R.propEq('id', id), options)))
}

function transformOptions () {
  return ([ optionSet, options ]) => R.map(optionToReferenceData(optionSet), options)
}

function sendOptionSetsToGoData (godata) {
  return R.pipe(
    R.map(godata.createReferenceData.bind(godata)),
    allPromises
  )
}

module.exports = {
  copyMetadata,
  loadResources,
  mapOptionSetIDFromDisplayName,
  loadOptionSets,
  mapOptionsFromID,
  transformOptions,
  sendOptionSetsToGoData
}

