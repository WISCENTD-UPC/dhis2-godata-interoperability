
const util = require('util')

// Execute direct queries to the api wrapper
// Example: node dhis2-godata-interoperability query-dhis2 resourcesSummary
const queryDHIS2 = (dhis2, godata, config) => async (action, command, args = []) => {
  console.log(util.inspect(await dhis2[action](...args), false, null, true))
}

// Execute direct queries to the api wrapper
// Example: node dhis2-godata-interoperability query-godata getOutbreaksCases <outbreak-id>
const queryGoData = (dhis2, godata, config) => async (action, command, args = []) => {
  console.log(util.inspect(await godata[action](...args), false, null, true))
}

module.exports = { queryDHIS2, queryGoData }

