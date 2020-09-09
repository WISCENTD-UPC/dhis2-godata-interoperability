
const R = require('ramda')

const { allPromises } = require('../util')

async function loadTrackedEntityInstances (dhis2, organisationUnits, casesProgramID) {
  return allPromises(
    R.map(async ou => {
      const trackedEntityInstances = await dhis2.getTrackedEntityInstances(ou.id, { program: casesProgramID })
      
      return allPromises(R.pipe(
        R.filter(_ => _ != null),
        R.map(async te =>
          R.assoc('events', await dhis2.getTrackedEntityEvents(te.trackedEntityInstance), te))
        )(trackedEntityInstances))
    }, organisationUnits)
  )
}

module.exports = { loadTrackedEntityInstances }

