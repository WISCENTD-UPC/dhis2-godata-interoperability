
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants/godata'

// SELECTORS
export const locationNameSelector = R.prop('name')
export const locationParentIDSelector = R.prop('parentLocationId')

export const locationIDSelector = R.prop('id')
export const locationGeoLocationSelector = R.pipe(
  R.prop('geoLocation'), 
  coords => coords != null ? ({
    type: 'Point',
    coordinates: [coords.lng, coords.lat]
  }) : null
)
export const locationGeographicalLevelIDSelector = R.pipe(R.prop('geographicalLevelId'), constants.geographicalLevelId)
export const locationUpdatedAtSelector = R.prop('updatedAt')
export const locationCreatedAtSelector = R.prop('createdAt')

// MAPPINGS
export const locationToOrganizationUnit = completeSchema({
  id: locationIDSelector,
  code: locationIDSelector,
  parent: { id: locationParentIDSelector },
  name: locationNameSelector,
  shortName: locationNameSelector,
  geometry: locationGeoLocationSelector,
  level: locationGeographicalLevelIDSelector,
  lastUpdated: locationUpdatedAtSelector,
  openingDate: locationCreatedAtSelector,
  children: _ => []
})

