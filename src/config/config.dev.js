
// NOTE: This credentials are just the ones use with local instances
// of the seriveces and just for development purposes. If you are using
// this scripts as an end user, please use the config.js configuration file instead.
export default {
  GoDataAPIConfig: {
    baseURL: 'BASE_URL',
    credentials: {
      email: 'EMAIL',
      password: 'PASSWORD'
    },
    debug: true
  },
  DHIS2APIConfig: {
    baseURL: 'BASE_URL',
    credentials: {
      user: 'USER',
      password: 'PASSWORD'
    },
    debug: true
  },
  countries: [ 'Trainingland' ],
  rootID: 'ROOT_ORGANISATION_UNIT_ID'
}

