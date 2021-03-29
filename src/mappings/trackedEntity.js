
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
export const classificationSelector = R.pipe(
  R.path(['classificationHistory', 0, 'classification']),
  _ => constants.labTestResult(_)
)
export const classificationDateSelector = R.path(['classificationHistory', 0, 'startDate'])

export const firstNameSelector = (config) => R.pipe(
  R.prop('firstName'),
  _ => _ != null ?
    R.assoc(config.dhis2KeyAttributes.firstName, _, {})
  : null
)

export const surnameSelector = (config) => R.pipe(
  R.prop('lastName'),
  _ => _ != null ?
    R.assoc(config.dhis2KeyAttributes.surname, _, {})
  : null
) 

export const sexSelector = (config) => R.pipe(
  R.prop('gender'),
  constants.gender,
  _ => _ != null ? R.assoc(
    config.dhis2KeyAttributes.sex, _, {}
  ) : null
)

export const dateOfBirthSelector = (config) => R.pipe(
  R.prop('dateOfBirth'),
  _ => _ != null ?
    R.assoc(config.dhis2KeyAttributes.dateOfBirth, _, {})
  : null
) 

export const addressSelector = (config) => R.pipe(
  R.path(['addresses', 'address']),
  _ => _ != null ?
    R.assoc(config.dhis2KeyAttributes.address, _, {})
  : null
)  

export const passportSelector = (config) => R.pipe(
  R.path(['documents', 'value']),
  _ => _ != null ?
    R.assoc(config.dhis2KeyAttributes.passport, _, {})
  : null
)

export const healthOutcomeSelector = (config) => R.pipe(
  completeSchema({
    program: config.dhis2CasesProgram,
    orgUnit: R.prop('orgUnit'),
    programStage: config.dhis2KeyProgramStages.healthOutcome,
    dataValues: [
      {
          dataElement: config.dhis2KeyDataElements.healthOutcome,
          value: R.prop('outcomeId'),
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
      labResultSelector(config), //TODO poner positive o negative solo i guess
      //healthOutcomeSelector(config)
    ]
  }])
)

export const attributesSelector = (config) => R.pipe(
  completeSchema([
    firstNameSelector(config),
    surnameSelector(config),
    sexSelector(config),
    dateOfBirthSelector(config),
    addressSelector(config),
    passportSelector(config)
  ]),
  R.filter(_ => _ != null)
)


// MAPPINGS
export const caseToTrackedEntity = (config) => completeSchema({
  orgUnit: caseOrgUnitIDSelector,
  trackedEntityInstance: caseIDSelector,
  trackedEntityType: config.dhis2KeyTrackedEntityTypes.person,
  //code: caseIDSelector, NO VALE
  created: caseDateOfReportingSelector,
  attributes: attributesSelector(config),
  outcomeId: outcomeIdSelector,
  dateOfOutcome: dateOfOutcomeSelector,
  //classification: classificationSelector,
  //classificationDate: classificationDateSelector,
  enrollments: enrollmentsSelector(config)
})
