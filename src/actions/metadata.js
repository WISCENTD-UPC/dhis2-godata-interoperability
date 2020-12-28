
import * as R from 'ramda'

import { optionToReferenceData } from '../mappings/metadata'
import {
  getIDFromDisplayName,
  allPromises,
  promisePipeline,
  logAction,
  logDone
} from '../util'

// Copy general metadata from DHIS2 from Go.Data
export const copyMetadata = (dhis2, godata, config, _ = { logAction }) => async () => {
  const [ allSets, options ] = await loadResources(dhis2, godata, config)
  
  _.logAction('Transfering metadata')
  return await processMetadata(dhis2, godata, config, allSets, options)
}

// Transforms data from the resources and push it to Go.Data
export function processMetadata (dhis2, godata, config, allSets, options) {
  return promisePipeline(
    R.toPairs,
    R.map(mapOptionSetIDFromDisplayName(allSets)),
    R.map(loadOptionSets(dhis2)), // TODO -> get from already loaded allSets
    allPromises,
    R.map(mapOptionsFromID(options)),
    R.map(transformOptions()),
    R.flatten,
    sendOptionSetsToGoData(godata),
    R.tap(() => logDone())
  )(config.metadata.optionSets)
}

// Load resources from DHIS2
export function loadResources (dhis2, godata, config) {
  return allPromises([
    dhis2.getOptionSets(),
    dhis2.getOptions()
  ])
}

// Change display names to ids in option sets
export function mapOptionSetIDFromDisplayName (optionSets) {
  return R.adjust(1, getIDFromDisplayName(optionSets))
}

// Load option sets
export function loadOptionSets (dhis2) {
  return async (map) => {
    const options = (await dhis2.getOptionSet(map[1])).options
    return R.update(1, options, map)
  }
}

// hydrate options from ids
export function mapOptionsFromID (options) {
  return R.adjust(1, R.map(({ id }) => R.find(R.propEq('id', id), options)))
}

// Map options to fit Go.Data's schema
export function transformOptions () {
  return ([ optionSet, options ]) => R.map(optionToReferenceData(optionSet), options)
}

// Push option sets to Go.Data
export function sendOptionSetsToGoData (godata) {
  return R.pipe(
    R.map(godata.createReferenceData.bind(godata)),
    allPromises
  )
}

