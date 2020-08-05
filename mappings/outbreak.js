
const R = require('ramda')

const { completeSchema } = require('./util')
const { geographicalLevelId, disease, followupAssignmentAlgorithm, country } = require('../config/constants')
const config = require('../config')

const { outbreakConfig } = config
const outbreakNameSelector = R.path(['orgUnit', 'name'])
const outbreakStartDateSelector = R.pipe(
  R.prop('trackedEntities'),
  R.map(R.prop('created')),
  R.sort(R.subtract),
  R.prop(0),
  R.defaultTo(new Date())
)
const outbreakCountriesSelector = R.map(_ => ({ id: country(_) }))
const outbreakLocationIDsSelector = _ => [R.path(['orgUnit', 'id'], _)]
const outbreakReportingGeographicalLevelIdSeletor = R.pipe(
  R.path(['orgUnit', 'level']),
  geographicalLevelId)

const createOutbreakMapping = (config) => R.partial(completeSchema, [{
  ...outbreakConfig,
  name: outbreakNameSelector,
  disease: disease(config.disease),
  startDate: outbreakStartDateSelector,
  endDate: null,
  countries: R.map(_ => ({ id: country(_) }), config.countries),
  locationIds: outbreakLocationIDsSelector,
  reportingGeographicalLevelId: outbreakReportingGeographicalLevelIdSeletor,
  generateFollowUpsTeamAssignmentAlgorithm: followupAssignmentAlgorithm(0),
  caseInvestigationTemplate: () => [],
  contactFollowUpTemplate: () => [],
  labResultsTemplate: () => [],
  arcGisServers: () => []
}])

module.exports = { createOutbreakMapping }

