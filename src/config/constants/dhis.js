
import config from '..'

export default {
  referenceDataCategoryID: (_) => `LNG_REFERENCE_DATA_CATEGORY_${_.toUpperCase()}`,
  geographicalLevelId: (_) => `LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_${Number(_) - 1}`,
  followupAssignmentAlgorithm: (index) => `LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_${
    config.followupAssignmentAlgorithms[index]}`,
  disease: (_ = '') => `LNG_REFERENCE_DATA_CATEGORY_DISEASE_${_.toUpperCase()}`,
  country: (country) => `LNG_REFERENCE_DATA_CATEGORY_COUNTRY_${country.toUpperCase()}`,
  gender: (gender) => gender != null ? `LNG_REFERENCE_DATA_CATEGORY_GENDER_${gender.toUpperCase()}` : null,
  ocupation: (ocupation = 'UNKNOWN') => `LNG_REFERENCE_DATA_CATEGORY_OCCUPATION_${ocupation.toUpperCase()}`,
  riskLevel: (level = 'NONE') => `LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_${level.toUpperCase()}`,
  addressTypeID: (type = 'USUAL_PLACE_OF_RESIDENCE') => `LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_${type}`,
  caseClassification: (value) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_'
    const options = {
      'FIN_CASE_CLASS_ASYMPTOMATIC': 'CONFIRMED',
      'FIN_CASE_CLASS_CONFIRM_CLIN': 'CONFIRMED',
      'FIN_CASE_CLASS_CONFIRM_LAB': 'CONFIRMED',
      'FIN_CASE_CLASS_PROBABLE': 'PROBABLE',
      'FIN_CASE_CLASS_SUSPECT': 'SUSPECT',
      'FIN_CASE_CLASS_NOT_CASE': 'NOT_A_CASE_DISCARDED',
      'FIN_CASE_CLASS_OTHER': 'NOT_A_CASE_DISCARDED' 
    }
    return value != null ? `${base}${options[value.toUpperCase()]}` : null;
  },
  certaintyLevel: (level = '3_HIGH') => `LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_${level.toUpperCase()}`,
  vaccineStatus: (status) => `LNG_REFERENCE_DATA_CATEGORY_VACCINE_STATUS_${status}`,
  vaccineType: (type) => `LNG_REFERENCE_DATA_CATEGORY_VACCINE_${type}`,
  documentTypes: {
    passport: () => 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_PASSPORT'
  },
  pregnancyStatus: (value) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_PREGNANCY_STATUS_'
    const options = {
      'YNUNKNA_YES': 'YES_TRIMESTER_UNKNOWN',
      'YNUNKNA_NO': 'NO'
    }
    return value != null ? `${base}${options[value.toUpperCase()]}` : null
  },
  healthOutcome: (outcome) => {
    const base = 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_'
    const options = {
      'VITAL_STATUS_ALIVE': 'ALIVE',
      'VITAL_STATUS_DEAD': 'DECEASED',
      'VITAL_STATUS_UNK': 'UNKNOWN'
    }
    return outcome != null ? `${base}${options[ outcome.toUpperCase() ]}` : null
  },
  OUTBREAK_CREATION_MODE: {
    GROUP: 0,
    EXPAND: 1
  }
}

