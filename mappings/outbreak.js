
import R from 'ramda'

import { completeSchema } from '../util'
import { geographicalLevelId, disease, followupAssignmentAlgorithm, country } from '../config/constants'
import config from '../config'

// SELECTORS
export const outbreakNameSelector = R.path(['orgUnit', 'name'])
export const outbreakStartDateSelector = R.pipe(
  R.prop('trackedEntities'),
  R.sortBy(R.prop('created')),
  R.map(R.prop('created')),
  R.prop(0)
)
export const outbreakCountriesSelector = R.map(_ => ({ id: country(_) }))
export const outbreakLocationIDsSelector = _ =>
  R.prepend(R.path(['orgUnit', 'id'], _), R.prop('mergedLocationsIDs', _))
export const outbreakReportingGeographicalLevelIdSeletor = R.pipe(
  R.path([ 'orgUnit', 'level' ]),
  geographicalLevelId)

// MAPPINGS
export const createOutbreakMapping = (config, _ = { Date }) => completeSchema({
  ...config.outbreakConfig,
  name: outbreakNameSelector,
  disease: disease(config.disease),
  startDate: R.pipe(outbreakStartDateSelector, R.defaultTo(_.Date())),
  endDate: null,
  countries: R.map(_ => ({ id: country(_) }), config.countries),
  locationIds: outbreakLocationIDsSelector,
  reportingGeographicalLevelId: outbreakReportingGeographicalLevelIdSeletor,
  generateFollowUpsTeamAssignmentAlgorithm: followupAssignmentAlgorithm(0),
  caseInvestigationTemplate: () => [],
  contactFollowUpTemplate: () => [],
  labResultsTemplate: () => [],
  arcGisServers: () => []
})

