
import 'core-js'
import 'regenerator-runtime'
import DHIS2API from 'dhis2-api-wrapper'
import GoDataAPI from 'godata-api-wrapper'
import * as R from 'ramda'
import { Command } from 'commander'

import _package from '../package.json'
import config from './config'
import {
  copyMetadata,
  copyOrganisationUnits,
  createOutbreaks,
  copyCases,
  copyContacts,
  fullTransferGoData,
  queryDHIS2,
  queryGoData,
  copyLocations,
  copyTrackedEntities,
  fullTransferDHIS2
} from './actions'

const dhis2 = new DHIS2API(config.DHIS2APIConfig)
const godata = new GoDataAPI(config.GoDataAPIConfig)
const program = new Command()

program.version(_package.version)

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
  .command('full-transfer-to-godata')
  .description('Performs a full transfer from DHIS2 to Go.Data (all but organisation units)')
  .action(fullTransferGoData(dhis2, godata, config))
program
  .command('query-dhis2 <action>')
  .description('Direct use of dhis2-api-wrapper for development purposes')
  .action(queryDHIS2(dhis2, godata, config))
program
  .command('query-godata <action>')
  .description('Direct use of godata-api-wrapper for development purposes')
  .action(queryGoData(dhis2, godata, config))
program
  .command('copy-locations')
  .description('Copy locations from Go.Data to DHIS2')
  .action(copyLocations(dhis2, godata, config))
program
  .command('copy-tracked-entities')
  .description('Copy tracked entities from Go.Data to DHIS2')
  .action(copyTrackedEntities(dhis2, godata, config))
program
  .command('full-transfer-to-dhis2')
  .description('Performs a full transfer from Go.Data to DHIS2')
  .action(fullTransferDHIS2(dhis2, godata, config))

async function main () {
  await godata.login()
  
  program.parse(process.argv)
}

main()

