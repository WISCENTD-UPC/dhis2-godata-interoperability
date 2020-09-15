
const R = require('ramda')

const { allPromises } = require('../util')

// Loads tracked entity instances related to an organisation unit and a program
async function loadTrackedEntityInstances (dhis2, organisationUnits, programID) {
  return allPromises(
    R.map(async ou => {
      const trackedEntityInstances = await dhis2.getTrackedEntityInstances(ou.id, { program: programID })
      
      return allPromises(R.pipe(
        R.filter(_ => _ != null),
        R.map(async te =>
          R.assoc('events', await dhis2.getTrackedEntityEvents(te.trackedEntityInstance), te))
        )(trackedEntityInstances))
    }, organisationUnits)
  )
}

module.exports = { loadTrackedEntityInstances }

