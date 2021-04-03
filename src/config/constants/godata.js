
import { _ } from 'core-js'
import config from '..'

export default {
  referenceDataCategoryID: (_) =>  _.replace('LNG_REFERENCE_DATA_CATEGORY_', ''),
  geographicalLevelId: (_) => Number(_.split('_').slice(-1)) + 1,
  followupAssignmentAlgorithm: (index) => `LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_${
    config.followupAssignmentAlgorithms[index]}`,
  disease: (_ = 'LNG_REFERENCE_DATA_CATEGORY_DISEASE_') => _.replace('LNG_REFERENCE_DATA_CATEGORY_DISEASE_', ''),
  country: (_) => _.replace('LNG_REFERENCE_DATA_CATEGORY_COUNTRY_', ''),
  gender: (_ = null) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_GENDER_'
    const options = {
      'MALE': 'Male',
      'FEMALE': 'Female'
    }
    return _ !== null ? options[ _.replace(base, '') ] : null
  },
  //ocupation: (_ = 'LNG_REFERENCE_DATA_CATEGORY_OCCUPATION_UNKNOWN') => _.replace('LNG_REFERENCE_DATA_CATEGORY_OCCUPATION_', ''),
  riskLevel: (_ = 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_NONE') => _.replace('LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_', ''),
  addressTypeID: (_ = 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_USUAL_PLACE_OF_RESIDENCE') => _.replace('LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_', ''),
  caseClassification: (_ = 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_SUSPECT') => _.replace('LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_', ''),
  certaintyLevel: (_ = 'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_3_HIGH') => _.replace('LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_', ''),
  vaccineStatus: (_) => _.replace('LNG_REFERENCE_DATA_CATEGORY_VACCINE_STATUS_', ''),
  vaccineType: (_) => _.replace('LNG_REFERENCE_DATA_CATEGORY_VACCINE_', ''),
  documentTypes: {
    passport: () => 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_PASSPORT'
  },
  pregnancyStatus: (_) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_PREGNANCY_STATUS_'
    const options = {
      'YES_TRIMESTER_UNKNOWN': 'YES',
      'NO': 'NO'
    }
    return value != null ? options[ _.replace(base, '') ] : null
  },
  healthOutcome: (_ = null) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_'
    const options = {
      'ALIVE': 'Healthy',
      'DECEASED': 'Death',
      'RECOVERED': 'Recovered',
      'NONE': 'Unknown'
    }
    return _ !== null ? options[ _.replace(base, '') ] : null
  },
  labTestResult: (_ = 'NONE') => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_'
    const options = {
      'CONFIRMED': 'Positive',
      'NOT_A_CASE_DISCARDED': 'Negative',
      'SUSPECT': 'Inconclusive',
      'PROBABLE': 'Inconclusive',
      'NONE': 'Unknown'
    }
    return options[ _.replace(base, '') ]
  },
  OUTBREAK_CREATION_MODE: {
    GROUP: 0,
    EXPAND: 1
  }
}

