
import actions from '../../actions'

test('actions should export all actions', () => {
  expect(actions.copyOrganisationUnits).toBeDefined()
  expect(actions.createOutbreaks).toBeDefined()
  expect(actions.copyCases).toBeDefined()
})

