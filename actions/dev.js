
const util = require('util')

const queryDHIS2 = (dhis2, godata, config) => async (action, command, args = []) => {
  console.log(util.inspect(await dhis2[action](...args), false, null, true))
}

const queryGoData = (dhis2, godata, config) => async (action, command, args = []) => {
  console.log(util.inspect(await godata[action](...args), false, null, true))
}

module.exports = { queryDHIS2, queryGoData }

