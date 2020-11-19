
const { copyMetadata } = require('./metadata')
const { copyOrganisationUnits } = require('./location')
const { createOutbreaks } = require('./outbreak')
const { copyCases } = require('./case')
const { copyContacts } = require('./contact')
const { fullTransfer } = require('./full')
const { queryDHIS2, queryGoData } = require('./dev')

module.exports = {
  copyMetadata,
  copyOrganisationUnits,
  createOutbreaks,
  copyCases,
  copyContacts,
  fullTransfer,
  queryDHIS2,
  queryGoData
}

