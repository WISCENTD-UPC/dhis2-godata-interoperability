
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
  R.find(R.propEq('displayName', dataElementName)),
  R.prop('value')))

// MAPPINGS
const trackedEntityToCase = (config) => completeSchema({
  outbreak: caseOutbreakSelector,
  id: caseIDSelector,
  firstName: caseAttributeSelector(config.dhis2KeyAttributes.firstName),
  lastName: caseAttributeSelector(config.dhis2KeyAttributes.surname),
  gender: R.pipe(caseAttributeSelector(config.dhis2KeyAttributes.sex), constants.gender),
  ocupation: constants.ocupation(),
  dateOfReporting: caseDateOfReportingSelector,
  riskLevel: constants.riskLevel(),
  vaccinesReceived: () => [],
  documents: () => [],
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
  )
})

const trackedEntityToContact = (config) => completeSchema({
  id: caseIDSelector,
  firstName: caseAttributeSelector(config.dhis2KeyAttributes.firstName),
  lastName: caseAttributeSelector(config.dhis2KeyAttributes.surname),
  gender: R.pipe(caseAttributeSelector(config.dhis2KeyAttributes.sex), constants.gender),
  ocupation: constants.ocupation(),
  dateOfReporting: caseDateOfReportingSelector, // TODO: check that this is correct for contacts
  riskLevel: constants.riskLevel(),
  vaccinesReceived: [],
  documents: [],
  addresses: [{
    typeID: constants.addressTypeID(),
    locationId: caseLocationIDSelector,
    address: caseAttributeSelector(config.dhis2KeyAttributes.address)
  }],
  dateOfBirth: caseAttributeSelector(config.dhis2KeyAttributes.dateOfBirth)
})

module.exports = { trackedEntityToCase, trackedEntityToContact }

