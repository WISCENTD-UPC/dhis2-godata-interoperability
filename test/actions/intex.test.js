
import * as actions from '../../src/actions'

test('actions should export all actions', () => {
  expect(actions.copyMetadata).toBeDefined()
  expect(actions.copyOrganisationUnits).toBeDefined()
  expect(actions.createOutbreaks).toBeDefined()
  expect(actions.copyCases).toBeDefined()
  expect(actions.copyContacts).toBeDefined()
  expect(actions.fullTransferGoData).toBeDefined()
  expect(actions.queryDHIS2).toBeDefined()
  expect(actions.queryGoData).toBeDefined()
  expect(actions.copyLocations).toBeDefined()
  expect(actions.copyTrackedEntities).toBeDefined()
})

