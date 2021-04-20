import { v4 as uuid } from 'uuid'

import * as trackedEntityMappings from '../../src/mappings/trackedEntity'
import config from '../../src/config'
import constants from '../../src/config/constants/godata'

test('trackedEntityMappings.caseToTrackedEntity', () => {
    const model = {
        firstName: '__name__',
        lastName: '__lastName__',
        gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_FEMALE',
        dob: '__dateOfBirth__',
        age: { years: 20, months: 0 },
        classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
        id: uuid(),
        documents: [{
            type: 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_PASSPORT',
            number: uuid()
        }],
        addresses: [{
            typeId: 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_USUAL_PLACE_OF_RESIDENCE',
            addressLine1: '__address__',
            locationId: uuid(),
        }],
        dateOfReporting: '__dateOfReporting__',
        classificationHistory: [{
            classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
            startDate: '__startDate__'
        }],
        usualPlaceOfResidenceLocationId: uuid(),
        dateOfOutcome: '__dateOfOutcome__',
        outcomeId: 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_ALIVE'
    }

    expect(trackedEntityMappings.caseToTrackedEntity(config)(model)).toStrictEqual({
        orgUnit: model.usualPlaceOfResidenceLocationId,
        trackedEntityInstance: model.id,
        trackedEntityType: config.dhis2KeyTrackedEntityTypes.person,
        created: model.dateOfReporting,
        attributes: [
            {
                attribute: config.dhis2KeyAttributes.firstName,
                value: model.firstName
            }, 
            {
                attribute: config.dhis2KeyAttributes.surname,
                value: model.lastName
            },
            {
                attribute: config.dhis2KeyAttributes.sex,
                value: constants.gender(model.gender)
            },
            {
                attribute: config.dhis2KeyAttributes.dateOfBirth,
                value: model.dob
            },
            {
                attribute: config.dhis2KeyAttributes.age,
                value: model.age.years
            },
            {
                attribute: config.dhis2KeyAttributes.address,
                value: model.addresses[0].addressLine1
            }
        ],
        outcomeId: model.outcomeId,
        dateOfOutcome: model.dateOfOutcome,
        enrollments: [{
            program: config.dhis2CasesProgram,
            orgUnit: model.usualPlaceOfResidenceLocationId,
            events: [{
                program: config.dhis2CasesProgram,
                orgUnit: model.usualPlaceOfResidenceLocationId,
                programStage: config.dhis2KeyProgramStages.labResults,
                eventDate: model.classificationHistory[0].startDate,
                dataValues: [
                  {
                      dataElement: config.dhis2KeyDataElements.labTestResult,
                      value: constants.labTestResult(model.classificationHistory[0].classification),
                      created: model.classificationHistory[0].startDate
                  }
                ]
            }]
        }]
    })
})