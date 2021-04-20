
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants/godata'

// SELECTORS
export const caseOrgUnitIDSelector = R.prop('usualPlaceOfResidenceLocationId')
export const caseIDSelector = R.prop('id')
export const caseDateOfReportingSelector = R.prop('dateOfReporting')
export const outcomeIdSelector = R.pipe(
  R.prop('outcomeId'),
  _ => constants.healthOutcome(_)
)
export const dateOfOutcomeSelector = R.prop('dateOfOutcome')
export const outcomeIdValue = R.prop('outcomeId')
export const classificationSelector = R.pipe(
  R.path(['classificationHistory', 0, 'classification']),
  _ => constants.labTestResult(_)
)
export const classificationDateSelector = R.path(['classificationHistory', 0, 'startDate'])

export const firstNameSelector = (config) => R.pipe(
  R.prop('firstName'),
  _ => _ != null ? 
    {
      attribute: config.dhis2KeyAttributes.firstName,
      value: _
    }
  : null
)

export const surnameSelector = (config) => R.pipe(
  R.prop('lastName'),
  _ => _ != null ?
    {
      attribute: config.dhis2KeyAttributes.surname,
      value: _
    }
  : null
) 

export const sexSelector = (config) => R.pipe(
  R.prop('gender'),
  constants.gender,
  _ => _ != null ? 
    {
      attribute: config.dhis2KeyAttributes.sex,
      value: _
    }
  : null
)

export const ageSelector = (config) => R.pipe(
  R.path(['age', 'years']),
  _ => _ != 0 ?
    {
      attribute: config.dhis2KeyAttributes.age,
      value: _
    }
  : null
) 

export const dateOfBirthSelector = (config) => R.pipe(
  R.prop('dob'),
  _ => _ != null ?
    {
      attribute: config.dhis2KeyAttributes.dateOfBirth,
      value: _
    }
  : null
) 

export const addressSelector = (config) => R.pipe(
  R.path(['addresses', 0, 'addressLine1']),
  _ => _ != null ?
    {
      attribute: config.dhis2KeyAttributes.address,
      value: _
    }
  : null
)  

export const passportSelector = (config) => R.pipe(
  R.path(['documents', 0, 'number']),
  _ => _ != null ?
    {
      attribute: config.dhis2KeyAttributes.passport,
      value: _
    }
  : null
)

export const healthOutcomeSelector = (config) => R.pipe(
  completeSchema({
    program: config.dhis2CasesProgram,
    orgUnit: R.prop('orgUnit'),
    programStage: config.dhis2KeyProgramStages.healthOutcome,
    eventDate: R.prop('dateOfOutcome'),
    dataValues: [
      {
          dataElement: config.dhis2KeyDataElements.healthOutcome,
          value: outcomeIdSelector,
          created: R.prop('dateOfOutcome')
      }
    ]
  })
)

export const labResultSelector = (config) => R.pipe(
  completeSchema({
    program: config.dhis2CasesProgram,
    orgUnit: caseOrgUnitIDSelector,
    programStage: config.dhis2KeyProgramStages.labResults,
    eventDate: classificationDateSelector,
    dataValues: [
      {
          dataElement: config.dhis2KeyDataElements.labTestResult,
          value: classificationSelector,
          created: classificationDateSelector
      }
    ]
  })
)

export const enrollmentsSelector = (config) => R.pipe(
  completeSchema([{
    program: config.dhis2CasesProgram,
    orgUnit: caseOrgUnitIDSelector,
    events: [
      labResultSelector(config),
    ]
  }])
)

export const attributesSelector = (config) => R.pipe(
  completeSchema([
    firstNameSelector(config),
    surnameSelector(config),
    sexSelector(config),
    dateOfBirthSelector(config),
    ageSelector(config),
    addressSelector(config),
    //passportSelector(config)
  ]),
  R.filter(_ => _ != null)
)


// MAPPINGS
export const caseToTrackedEntity = (config) => completeSchema({
  orgUnit: caseOrgUnitIDSelector,
  trackedEntityInstance: caseIDSelector,
  trackedEntityType: config.dhis2KeyTrackedEntityTypes.person,
  created: caseDateOfReportingSelector,
  attributes: attributesSelector(config),
  outcomeId: outcomeIdValue,
  dateOfOutcome: dateOfOutcomeSelector,
  enrollments: enrollmentsSelector(config)
})
