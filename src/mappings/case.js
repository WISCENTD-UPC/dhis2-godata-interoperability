
import * as R from 'ramda'

import { completeSchema } from '../util'
import constants from '../config/constants/dhis'

// SELECTORS
export const caseOutbreakSelector = R.prop('outbreak')
export const caseIDSelector = R.prop('trackedEntityInstance')
export const caseLocationIDSelector = R.prop('orgUnit')
export const caseDateOfReportingSelector = R.prop('created')
export const caseClassificationSelector = R.pipe(
  R.prop('caseClassification'),
  constants.caseClassification
)
export const caseAttributeSelector = (attributeID) => R.pipe(
  R.prop('attributes'),
  R.find(R.propEq('attribute', attributeID)),
  R.prop('value'))

export const firstNameSelector = (config) => R.pipe(
  caseAttributeSelector(config.dhis2KeyAttributes.firstName),
  R.defaultTo(config.attributesDefaults.firstName))

export const dataElementSelector = R.curry((programStage, dataElementName) => R.pipe(
  R.prop(programStage),
  R.defaultTo([]),
  R.find(R.propEq('displayName', dataElementName)),
  R.prop('value'),
  R.defaultTo(null)
))

export const documentSelector = R.curry((documentName, attributeID) => R.pipe(
  caseAttributeSelector(attributeID),
  doc => doc != null ? ({
    type: constants.documentTypes[documentName](),
    value: doc
  }) : null
))

export const passportSelector = documentSelector('passport')

export const documentsSelector = (config) => R.pipe(
  completeSchema([
    passportSelector(config.dhis2KeyAttributes.passportID)
  ]),
  R.filter(_ => _ != null)
)

export const vaccinesSelector = (dataElementID) => R.pipe(
  dataElementSelector('clinicalExamination', dataElementID),
  R.ifElse(
    vaccineType => vaccineType != null,
    R.pipe(
      vaccineType => vaccineType.split('_').slice(2).join('_'),
      completeSchema([{
        date: null,
        status: constants.vaccineStatus('VACCINATED'),
        vaccine: vaccineType => constants.vaccineType(vaccineType)
      }])
    ),
    () => null)
)

// MAPPINGS
export const trackedEntityToCase = (config) => completeSchema({
  outbreak: caseOutbreakSelector,
  id: caseIDSelector,
  //visualId: caseAttributeSelector(config.dhis2KeyAttributes.caseID),
  firstName: firstNameSelector(config),
  lastName: caseAttributeSelector(config.dhis2KeyAttributes.surname),
  gender: R.pipe(caseAttributeSelector(config.dhis2KeyAttributes.sex), constants.gender),
  ocupation: constants.ocupation(),
  dateOfReporting: caseDateOfReportingSelector,
  riskLevel: constants.riskLevel(),
  vaccinesReceived: vaccinesSelector(config.dhis2KeyDataElements.typeOfVaccine),
  documents: documentsSelector(config),
  addresses: [{
    typeID: constants.addressTypeID(),
    locationId: caseLocationIDSelector,
    address: caseAttributeSelector(config.dhis2KeyAttributes.address)
  }],
  classification: caseClassificationSelector,
  dateRanges: [],
  questionnaireAnswers: {},
  dateOfBirth: caseAttributeSelector(config.dhis2KeyAttributes.dateOfBirth),
  pregnancyStatus: R.pipe(
    dataElementSelector('clinicalExamination', config.dhis2KeyDataElements.pregnancy),
    constants.pregnancyStatus
  ),
  // dateOfOnset: dataElementSelector(
  //   'clinicalExamination',
  //   config.dhis2KeyDataElements.dateOfOnset),
  dateOfOnset: caseAttributeSelector(config.dhis2KeyAttributes.dateOfOnset),
  outcomeId: dataElementSelector(
    'healthOutcome',
    config.dhis2KeyDataElements.healthOutcome)
})

export const trackedEntityToContact = (config) => completeSchema({
  id: caseIDSelector,
  //visualId: caseAttributeSelector(config.dhis2KeyAttributes.caseID),
  firstName: firstNameSelector(config),
  lastName: caseAttributeSelector(config.dhis2KeyAttributes.surname),
  gender: R.pipe(caseAttributeSelector(config.dhis2KeyAttributes.sex), constants.gender),
  ocupation: constants.ocupation(),
  dateOfReporting: caseDateOfReportingSelector, // TODO: check that this is correct for contacts
  riskLevel: constants.riskLevel(),
  vaccinesReceived: vaccinesSelector(config.dhis2KeyDataElements.typeOfVaccine),
  documents: documentsSelector(config),
  addresses: [{
    typeID: constants.addressTypeID(),
    locationId: caseLocationIDSelector,
    address: caseAttributeSelector(config.dhis2KeyAttributes.address)
  }],
  dateOfBirth: caseAttributeSelector(config.dhis2KeyAttributes.dateOfBirth),
  pregnancyStatus: R.pipe(
    dataElementSelector('clinicalExamination', config.dhis2KeyDataElements.pregnancy),
    constants.pregnancyStatus
  )
})

