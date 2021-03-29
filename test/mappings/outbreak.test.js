
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

import * as outbreakMappings from '../../src/mappings/outbreak'
import config from '../../src/config'
import constants from '../../src/config/constants/dhis'

test('outbreakMappings.createOutbreakMapping', () => {
  const model = {
    orgUnit: {
      id: uuid(),
      name: 'Trainingland',
      level: 1,
      noise: uuid() 
    },
    mergedLocationsIDs: [ uuid(), uuid() ],
    trackedEntities: [
      { id: uuid(), created: '02-05-2020' },
      { id: uuid(), created: '03-05-2020' }
    ]
  }

  const testConfig = R.mergeDeepRight(config, {
    countries: [ 'Trainingland' ]
  })

  expect(outbreakMappings.createOutbreakMapping(config)(model)).toStrictEqual({
    ...config.outbreakConfig,
    name: model.orgUnit.name,
    disease: constants.disease(config.disease),
    startDate: '02-05-2020',
    endDate: null,
    countries: [ { id: constants.country(config.countries[0]) } ],
    locationIds: [ model.orgUnit.id, ...model.mergedLocationsIDs ],
    reportingGeographicalLevelId: constants.geographicalLevelId(model.orgUnit.level),
    generateFollowUpsTeamAssignmentAlgorithm: constants.followupAssignmentAlgorithm(0),
    caseInvestigationTemplate: [],
    contactFollowUpTemplate: [],
    labResultsTemplate: [],
    arcGisServers: []
  })
})

