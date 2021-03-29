
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants/dhis'
import config from '../config'

// SELECTORS
export const outbreakNameSelector = R.path(['orgUnit', 'name'])
export const outbreakStartDateSelector = R.pipe(
  R.prop('trackedEntities'),
  R.sortBy(R.prop('created')),
  R.map(R.prop('created')),
  R.prop(0)
)
export const outbreakCountriesSelector = R.map(_ => ({ id: constants.country(_) }))
export const outbreakLocationIDsSelector = _ =>
  R.prepend(R.path(['orgUnit', 'id'], _), R.prop('mergedLocationsIDs', _))
export const outbreakReportingGeographicalLevelIdSeletor = R.pipe(
  R.path([ 'orgUnit', 'level' ]),
  constants.geographicalLevelId)

// MAPPINGS
export const createOutbreakMapping = (config, _ = { Date }) => completeSchema({
  ...config.outbreakConfig,
  name: outbreakNameSelector,
  disease: constants.disease(config.disease),
  startDate: R.pipe(outbreakStartDateSelector, R.defaultTo(_.Date())),
  endDate: null,
  countries: R.map(_ => ({ id: constants.country(_) }), config.countries),
  locationIds: outbreakLocationIDsSelector,
  reportingGeographicalLevelId: outbreakReportingGeographicalLevelIdSeletor,
  generateFollowUpsTeamAssignmentAlgorithm: constants.followupAssignmentAlgorithm(0),
  caseInvestigationTemplate: () => [],
  contactFollowUpTemplate: () => [],
  labResultsTemplate: () => [],
  arcGisServers: () => []
})

