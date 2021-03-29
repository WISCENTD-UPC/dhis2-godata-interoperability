
export default {
  disease: '2019_N_CO_V',
  dhis2CasesProgram: 'COVID-19 Case-based Surveillance',
  dhis2ContactsProgram: 'COVID-19 Contact Registration & Follow-up',
  dhis2ContactsRelationship: 'Has Been in Contact with',
  dhis2KeyProgramStages: {
    clinicalExamination: 'Stage 1 - Clinical examination and diagnosis',
    labRequest: 'Stage 2 - Lab Request',
    labResults: 'Stage 3 - Lab Results',
    healthOutcome: 'Stage 4 - Health Outcome',
    symptoms: 'Symptoms'
  },
  dhis2KeyTrackedEntityTypes: {
    person: 'Person',
    commodities: 'Commodities '
  },
  dhis2KeyAttributes: {
    caseID: 'System Generated Case ID',
    firstName: 'First Name',
    surname: 'Surname',
    sex: 'Sex',
    dateOfBirth: 'Date of birth',
    address: 'Home Address',
    passport: 'Passport Number'
  },
  attributesDefaults: {
    firstName: 'NOT_PROVIDED'
  },
  dhis2KeyDataElements: {
    pregnancy: 'Pregnancy',
    dateOfOnset: 'Date of symptoms onset',
    healthOutcome: 'Health outcome',
    typeOfVaccine: 'Type of vaccine',
    labTestResult: 'Lab Test Result'
  },
  dhis2DataElementsChecks: {
    confirmedTest: [
      [ 'Lab Test Result', 'Positive' ]
    ]
  },
  // 0 -> GROUP, 1 -> EXPAND
  outbreakCreationMode: 0,
  outbreakCreationGroupingLevel: 0,
  followupAssignmentAlgorithms: [ 'ROUND_ROBIN_ALL_TEAMS', 'ROUND_ROBIN_NEAREST_FIT_TEAM' ],
  outbreakConfig: {
    periodOfFollowup: 1,
    frequencyOfFollowUpPerDay: 1,
    noDaysAmongContacts: 1,
    noDaysInChains: 1,
    noDaysNotSeen: 1,
    noLessContacts: 1,
    noDaysNewContacts: 1,
    caseIdMask: "CASE-YYYY-9999",
    contactIdMask: "CONTACT-YYYY-9999",
    longPeriodsBetweenCaseOnset: 1,
    isContactLabResultsActive: false,
    isDateOfOnsetRequired: true,
    generateFollowUpsOverwriteExisting: false,
    generateFollowUpsKeepTeamAssignment: true
  },
  metadata: {
    optionSets: {
      Vaccine: 'Vaccine types'
    }
  }
}

