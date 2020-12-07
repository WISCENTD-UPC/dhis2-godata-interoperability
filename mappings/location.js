
import * as R from 'ramda'

import { completeSchema } from '../util'
import { geographicalLevelId } from '../config/constants'

// SELECTORS
export const locationNameSelector = R.prop('name')
// const locationSynonymsSelector = R.pipe(R.prop('shortName'), _ => [ _ ]) // if name == shortName, don't add synonym
export const locationParentIDSelector = R.path(['parent', 'id'])
export const locationIDSelector = R.prop('id')
export const locationPointSelector = R.pipe(R.prop('coordinates'), R.zipObj(['lng', 'lat']))
export const locationMultiPolygonSelector = R.pipe(R.path(['coordinates', 0, 0]), R.transpose, R.map(R.mean), R.zipObj(['lng', 'lat']))
export const locationGeoLocationSelectors = {
  Point: locationPointSelector,
  MultiPolygon: locationMultiPolygonSelector
}
export const locationGeoLocationSelector = R.pipe(
  R.ifElse(
    R.has('geometry'),
    ({ geometry }) => locationGeoLocationSelectors[geometry.type](geometry),
    _ => null)
)
export const locationGeographicalLevelIDSelector = R.pipe(R.prop('level'), geographicalLevelId)
export const locationUpdatedAtSelector = R.prop('lastUpdated')
export const locationCreatedAtSelector = R.prop('created')

// MAPPINGS
export const organisationUnitToLocation = completeSchema({
  id: locationIDSelector,
  parentLocationId: locationParentIDSelector,
  name: locationNameSelector,
  //syonyms: locationSynonymsSelector,
  geoLocation: locationGeoLocationSelector,
  //populationDensity: 0,
  geographicalLevelId: locationGeographicalLevelIDSelector,
  updatedAt: locationUpdatedAtSelector,
  createdAt: locationCreatedAtSelector,
  active: true,
  deleted: false,
  identifiers: _ => [],
  synonyms: _ => [],
  children: _ => []
})

