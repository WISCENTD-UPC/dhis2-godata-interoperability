
const R = require('ramda')

const { completeSchema } = require('../util')
const constants = require('../config/constants')

// SELECTORS
const caseOutbreakSelector = R.prop('outbreak')
const caseIDSelector = R.prop('trackedEntityInstance')
const caseLocationIDSelector = R.prop('orgUnit')
const caseDateOfReportingSelector = R.prop('created')
const caseClassificationSelector = R.pipe(
  R.prop('caseClassification'),
  constants.caseClassification
)
const caseAttributeSelector = (attributeID) => R.pipe(
  R.prop('attributes'),
  R.find(R.propEq('attribute', attributeID)),
  R.prop('value'))

const dataElementSelector = R.curry((programStage, dataElementName) => R.pipe(
  R.prop(programStage),
  R.defaultTo([]),
  R.find(R.propEq('displayName', dataElementName)),
  R.prop('value'),
  R.defaultTo(null)
))
const documentSelector = R.curry((documentName, attributeID) => R.pipe(
  caseAttributeSelector(attributeID),
  doc => doc != null ? ({
    type: constants.documentTypes[documentName](),
    value: doc
  }) : null
))
const passportSelector = documentSelector('passport')
const documentsSelector = (config) => R.pipe(
  completeSchema([
    passportSelector(config.dhis2KeyAttributes.passportID)
  ]),
  R.filter(_ => _ != null)
)
const vaccinesSelector = (dataElementID) => R.pipe(
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
const trackedEntityToCase = (config) => completeSchema({
  outbreak: caseOutbreakSelector,
  id: caseIDSelector,
  //visualId: caseAttributeSelector(config.dhis2KeyAttributes.caseID),
  firstName: caseAttributeSelector(config.dhis2KeyAttributes.firstName),
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
  dateOfOnset: dataElementSelector(
    'clinicalExamination',
    config.dhis2KeyDataElements.dateOfOnset),
  outcomeId: dataElementSelector(
    'healthOutcome',
    config.dhis2KeyDataElements.healthOutcome)
})

const trackedEntityToContact = (config) => completeSchema({
  id: caseIDSelector,
  //visualId: caseAttributeSelector(config.dhis2KeyAttributes.caseID),
  firstName: caseAttributeSelector(config.dhis2KeyAttributes.firstName),
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

module.exports = { trackedEntityToCase, trackedEntityToContact }

