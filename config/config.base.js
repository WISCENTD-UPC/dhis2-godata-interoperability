
module.exports = {
  GoDataAPIConfig: {
    baseURL: 'http://localhost:8000/api',
    credentials: {
      email: 'test@who.int',
      password: '123412341234'
    }
  },
  DHIS2APIConfig: {
    baseURL: 'https://covid19.dhis2.org/demo/api',
    credentials: {
      user: 'COVID',
      password: 'StopCovid19!'
    },
    debug: true
  },
  countries: [ 'Trainingland' ],
  rootID: 'GD7TowwI46c',
  disease: '2019_N_CO_V',
  dhis2CasesProgram: 'COVID-19 Case-based Surveillance',
  dhis2KeyProgramStages: {
    labRequest: 'Stage 2 - Lab Request',
    labResults: 'Stage 3 - Lab Results',
    symptoms: 'Symptoms'
  },
  dhis2KeyAttributes: {
    firstName: 'First Name',
    surname: 'Surname',
    sex: 'Sex',
    dateOfBirth: 'Date of birth',
    address: 'Home Address'
  },
  dhis2DataElementsChecks: {
    confirmedTest: [
      [ 'Lab Test Result', 'Positive' ]
    ]
  },
  // 0 -> GROUP, 1 -> EXPAND
  outbreakCreationMode: 0,
  outbreakCreationGroupingLevel: 1,
  outbreakConfig: {
    periodOfFollowup: 1,
    frequencyOfFollowUpPerDay: 1,
    noDaysAmongContacts: 1,
    noDaysInChains: 1,
    noDaysNotSeen: 1,
    noLessContacts: 1,
    noDaysNewContacts: 1,
    reportingGeographicalLevelId: 0,
    caseIdMask: "CASE-YYYY-9999",
    contactIdMask: "CONTACT-YYYY-9999",
    longPeriodsBetweenCaseOnset: 1,
    isContactLabResultsActive: false,
    isDateOfOnsetRequired: true,
    generateFollowUpsOverwriteExisting: false,
    generateFollowUpsKeepTeamAssignment: true
  }
}

