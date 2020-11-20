
const DHIS2API = require('dhis2-api-wrapper')
const GoDataAPI = require('godata-api-wrapper')
const R = require('ramda')
const { Command } = require('commander')

const package = require('./package.json')
const config = require('./config')
const {
  copyMetadata,
  copyOrganisationUnits,
  createOutbreaks,
  copyCases,
  copyContacts,
  fullTransfer,
  queryDHIS2,
  queryGoData
} = require('./actions')

const dhis2 = new DHIS2API(config.DHIS2APIConfig)
const godata = new GoDataAPI(config.GoDataAPIConfig)
const program = new Command()

program.version(package.version)

program
  .command('copy-metadata')
  .description('Copy DHIS2 metadata into Go.Data')
  .action(copyMetadata(dhis2, godata, config))
program
  .command('copy-organisation-units <destination>')
  .description('Copy DHIS2 organisation units into Go.Data locations.')
  .action(copyOrganisationUnits(dhis2, godata, config))
program
  .command('create-outbreaks')
  .description('Create Go.Data outbreaks from DHIS2 tracked entities and organisation units.')
  .action(createOutbreaks(dhis2, godata, config))
program
  .command('copy-cases')
  .description('Copy cases from DHIS2 to Go.Data')
  .action(copyCases(dhis2, godata, config))
program
  .command('copy-contacts')
  .description('Copy contacts from DHIS2 to Go.Data')
  .action(copyContacts(dhis2, godata, config))
program
  .command('full-transfer')
  .description('Performs a full transfer from DHIS2 to Go.Data (all but organisation units)')
  .action(fullTransfer(dhis2, godata, config))
program
  .command('query-dhis2 <action>')
  .description('Direct use of dhis2-api-wrapper for development purposes')
  .action(queryDHIS2(dhis2, godata, config))
program
  .command('query-godata <action>')
  .description('Direct use of godata-api-wrapper for development purposes')
  .action(queryGoData(dhis2, godata, config))

async function main () {
  await godata.login()
  
  program.parse(process.argv)
}

main()

