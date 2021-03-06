
import * as R from 'ramda'

import { createUUIDs } from './util'

const uuids = createUUIDs()
const date = () => new Date().toString()

export const optionSets = [
  { 
    id: uuids('ops-0'),
    displayName: 'Vaccine types',
    options: [
      { id: uuids('op-0') },
      { id: uuids('op-1') }
    ]
  }
]

export const options = [
  { id: uuids('op-0'), displayName: 'Malaria' },
  { id: uuids('op-1'), displayName: 'Colera' }
]

export const orgUnits = R.map(
  R.pipe(R.assoc('lastUpdated', date()), R.assoc('created', date())),
  [{
    id: uuids('ou-0'),
    code: uuids('loc-0'),
    parent: undefined,
    name: 'Trainingland',
    level: 1,
    geometry: {
      type: 'Point',
      coordinates: [ 164.7706, -67.6056 ]
    },
    children: [
      { id: uuids('ou-1') },
      { id: uuids('ou-2') }
    ]
  },
  {
    id: uuids('ou-1'),
    code: uuids('loc-1'),
    parent: { id: uuids('ou-0') },
    name: 'Animal Region',
    level: 2,
    geometry: {
      type: 'Point',
      coordinates: [ 164.7706, -67.6056 ]
    },
    children: [
      { id: uuids('ou-3') }
    ]
  },
  {
    id: uuids('ou-2'),
    code: uuids('loc-2'),
    parent: { id: uuids('ou-0') },
    name: 'Food Region',
    level: 2,
    geometry: {
      type: 'Point',
      coordinates: [ 164.7706, -67.6056 ]
    },
    children: []
  },
  {
    id: uuids('ou-3'),
    code: uuids('loc-3'),
    parent: { id: uuids('ou-1') },
    name: 'Bird Region',
    level: 3,
    geometry: {
      type: 'Point',
      coordinates: [ 164.7706, -67.6056 ]
    },
    children: []
  }
])

export const programs = [
  { id: uuids('p-0'), displayName: 'COVID-19 Case-based Surveillance' },
  { id: uuids('p-1'), displayName: 'COVID-19 Cases (events)' },
  { id: uuids('p-2'), displayName: 'COVID-19 Commodities ' },
  { id: uuids('p-3'), displayName: 'COVID-19 Contact Registration & Follow-up' },
  { id: uuids('p-4'), displayName: 'COVID-19 Port of Entry Screening' }
]

export const programStages = [
  { id: uuids('ps-0'), displayName: 'COVID-19 Cases (events)' },
  { id: uuids('ps-1'), displayName: 'Daily Supply Report' },
  { id: uuids('ps-2'), displayName: 'DELETE_Stage 5 - Contacts Followed' },
  { id: uuids('ps-3'), displayName: 'Follow-up' },
  { id: uuids('ps-4'), displayName: 'Follow-up (at the end of 14 days)' },
  { id: uuids('ps-5'), displayName: 'Follow-up (within 14 days)' },
  { id: uuids('ps-6'), displayName: 'Registration at Port of Entry' },
  { id: uuids('ps-7'), displayName: 'Stage 1 - Clinical examination and diagnosis' },
  { id: uuids('ps-8'), displayName: 'Stage 2 - Lab Request' },
  { id: uuids('ps-9'), displayName: 'Stage 3 - Lab Results' },
  { id: uuids('ps-10'), displayName: 'Stage 4 - Health Outcome' },
  { id: uuids('ps-11'), displayName: 'Symptoms' }
]

export const dataElements = [
  { id: uuids('d-0'), displayName: 'Lab Test Result' },
  { id: uuids('d-1'), displayName: 'Health outcome' }, 
  { id: uuids('d-2'), displayName: 'Pregnancy' },
  { id: uuids('d-3'), displayName: 'Date of symptoms onset' }, 
  { id: uuids('d-4'), displayName: 'Type of vaccine' }
]

export const attributes = [
  { id: uuids('a-0'), displayName: 'Age' },
  { id: uuids('a-1'), displayName: 'Country of Residence' },
  { id: uuids('a-2'), displayName: 'Date of birth' },
  { id: uuids('a-3'), displayName: 'Email' },
  { id: uuids('a-4'), displayName: 'Emergency contact - email' },
  { id: uuids('a-5'), displayName: 'Emergency contact - first name' },
  { id: uuids('a-6'), displayName: 'Emergency contact - surname' },
  { id: uuids('a-7'), displayName: 'Emergency contact - telephone' },
  { id: uuids('a-8'), displayName: 'Facility contact number' },
  { id: uuids('a-9'), displayName: 'First Name' },
  { id: uuids('a-10'), displayName: 'First Name (parent or carer)' },
  { id: uuids('a-11'), displayName: 'Home Address' },
  { id: uuids('a-12'), displayName: 'Local Address' },
  { id: uuids('a-13'), displayName: 'Local Case ID' },
  { id: uuids('a-14'), displayName: 'Passport Number' },
  { id: uuids('a-15'), displayName: 'Sex' },
  { id: uuids('a-16'), displayName: 'Surname' },
  { id: uuids('a-17'), displayName: 'Surname (parent or carer)' },
  { id: uuids('a-18'), displayName: 'System Generated Case ID' },
  { id: uuids('a-19'), displayName: 'System Generated Contact ID' },
  { id: uuids('a-20'), displayName: 'Telephone (foreign)' },
  { id: uuids('a-21'), displayName: 'Telephone (local)' },
  { id: uuids('a-22'), displayName: 'Workplace/school physical address' }
]

export const relationshipTypes = [
  { id: uuids('rt-0'), displayName: 'Has Been in Contact with' }
]

export const trackedEntityTypes = [
  { id: uuids('tt-0'), displayName: 'Person' },
  { id: uuids('tt-1'), displayName: 'Commodities '}
]

export const trackedEntities = [
  [
    {
      trackedEntityInstance: uuids('te-0'),
      orgUnit: uuids('ou-0'),
      created: '2020-08-01',
      events: [
        { programStage: uuids('ps-7'), dataValues: [] },
        { programStage: uuids('ps-8'), dataValues: [] },
        {
          programStage: uuids('ps-9'),
          dataValues: [
            { dataElement: uuids('d-0') , value: 'Positive' }
          ]
        }
      ],
      attributes: [
        { attribute: uuids('a-9'), value: 'Tom' },
        { attribute: uuids('a-16'), value: 'Jerry' },
        { attribute: uuids('a-15'), value: 'Male' },
        { attribute: uuids('a-11'), value: 'Tom address' },
        { attribute: uuids('a-2'), value: '1990-01-01' }
      ]
    }
  ],
  [
    {
      trackedEntityInstance: uuids('te-1'),
      orgUnit: uuids('ou-1'),
      created: '2020-08-02',
      events: [],
      attributes: [
        { attribute: uuids('a-9'), value: 'Zanele' },
        { attribute: uuids('a-16'), value: 'Thabede' },
        { attribute: uuids('a-15'), value: 'Female' },
        { attribute: uuids('a-11'), value: 'Zanele address' },
        { attribute: uuids('a-2'), value: '1980-04-23' }
      ]
    }
  ],
  [],
  [
    {
      trackedEntityInstance: uuids('te-2'),
      orgUnit: uuids('ou-3'),
      created: '2020-08-03',
      events: [
        {
          programStage: uuids('ps-8'),
          dataValues: []
        },
        {
          programStage: uuids('ps-9'),
          dataValues: [
            { dataElement: uuids('d-0'), value: 'Negative' }
          ]
        }
      ],
      attributes: [
        { attribute: uuids('a-9'), value: 'Matumbo' },
        { attribute: uuids('a-16'), value: 'Juu' },
        { attribute: uuids('a-15'), value: 'Male' },
        { attribute: uuids('a-11'), value: 'Matumbo address' },
        { attribute: uuids('a-2'), value: '1942-05-12' }
      ]
    }
  ]
]

export const outbreaks = [
  {
    id: uuids('o-0'),
    name: orgUnits[0].name,
    locationIds: [ uuids('ou-0'), uuids('ou-1'), uuids('ou-2'), uuids('ou-3') ]
  }
]

export const outbreakCases = [
  { id: uuids('te-0') },
  { id: uuids('te-1') },
  { id: uuids('te-2') }
]

export const relationships = [
  [{
    relationshipType: uuids('rt-0'),
    created: '2020-09-01',
    from: {
      trackedEntityInstance: {
        trackedEntityInstance: uuids('te-0')
      }
    },
    to: {
      trackedEntityInstance: {
        trackedEntityInstance: uuids('te-1')
      }
    }
  }],
  [{
    relationshipType: uuids('rt-0'),
    created: '2020-09-02',
    from: {
      trackedEntityInstance: {
        trackedEntityInstance: uuids('te-3'),
        orgUnit: uuids('ou-0'),
        created: '2020-09-01',
        attributes: [
          { attribute: uuids('a-9'), value: 'John' },
          { attribute: uuids('a-16'), value: 'Smith' },
          { attribute: uuids('a-15'), value: 'Male' },
          { attribute: uuids('a-11'), value: 'street 20B' },
          { attribute: uuids('a-2'), value: '1970-02-22' }
        ]
      }
    },
    to: {
      trackedEntityInstance: {
        trackedEntityInstance: uuids('te-1')
      }
    }
  }],
  []
]

export const user = {
  userId: uuids('u-0')
}

export const locations = [
  {
    name: 'Trainingland',
    parentLocationId: null,
    geoLocation: { lat: 46, lng: -163 },
    geographicalLevelId: 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_0',
    id: uuids('loc-0'),
    createdAt: date(),
    updatedAt: date(),
  },
  {
    name: 'Animal Region',
    parentLocationId: uuids('loc-0'),
    geoLocation: { lat: 46, lng: -163 },
    geographicalLevelId: 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_1',
    id: uuids('loc-1'),
    createdAt: date(),
    updatedAt: date(),
  },
  {
    name: 'Food Region',
    parentLocationId: uuids('loc-0'),
    geoLocation: { lat: 46, lng: -163 },
    geographicalLevelId: 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_1',
    id: uuids('loc-2'),
    createdAt: date(),
    updatedAt: date(),
  },
  {
    name: 'Bird Region',
    parentLocationId: uuids('loc-1'),
    geoLocation: { lat: 46, lng: -163 },
    geographicalLevelId: 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL_ADMIN_LEVEL_2',
    id: uuids('loc-3'),
    createdAt: date(),
    updatedAt: date(),
  }
]

export const orgUnitsIDs = [
  uuids('ou-0'),
  uuids('ou-1'),
  uuids('ou-2'),
  uuids('ou-3')
]

export const trackedEntityIDs = [
  uuids('tr-ca-0'),
  uuids('tr-ca-1'),
  uuids('tr-ca-2'),
  uuids('tr-ca-3'),
]

export const dhis2User = {
  firstName: '__firstName__',
  surname: '__surname__',
  userCredentials: {
    userInfo: { id: uuids('user-0') }
  },
  teiSearchOrganisationUnits: [{ id: uuids() }],
  organisationUnits: [],
  dataViewOrganisationUnits: []
}

export const cases = [
  [
    {
      firstName: 'Tom',
      lastName: 'Stark',
      dob: date(),
      age: { years: 0, months: 0 },
      gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_MALE',
      outcomeId: 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_ALIVE',
      classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_SUSPECT',
      id: uuids('ca-0'),
      documents: [],
      addresses: [{
        typeId: 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_USUAL_PLACE_OF_RESIDENCE',
        addressLine1: 'La Habana',
        locationId: uuids('loc-0'),
      }],
      dateOfReporting: date(),
      classificationHistory: [{
        classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_SUSPECT',
        startDate: date()
      }],
      dateOfOutcome: date(),
      usualPlaceOfResidenceLocationId: uuids('loc-0'),
      createdAt: date(),
      updatedAt: date()
    }
  ],
  [
    {
      firstName: 'Minnie',
      lastName: 'Mouse',
      age: { years: 10, months: 0 },
      gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_FEMALE',
      outcomeId: 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_RECOVERED',
      classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
      id: uuids('ca-1'),
      documents: [{
        type: 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_PASSPORT',
        number: '123456789'
      }],
      addresses: [],
      dateOfReporting: date(),
      classificationHistory: [{
        classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
        startDate: date()
      }],
      dateOfOutcome: date(),
      usualPlaceOfResidenceLocationId: uuids('loc-1'),
      createdAt: date(),
      updatedAt: date()
    }
  ],
  [
    {
      firstName: 'Strawberry',
      lastName: 'Red',
      age: { years: 0, months: 0 },
      gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_FEMALE',
      classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_PROBABLE',
      id: uuids('ca-2'),
      documents: [],
      addresses: [],
      dateOfReporting: date(),
      classificationHistory: [{
        classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_PROBABLE',
        startDate: date()
      }],
      usualPlaceOfResidenceLocationId: uuids('loc-2'),
      createdAt: date(),
      updatedAt: date()
    }
  ],
  [
    {
      firstName: 'Canary',
      lastName: 'Golden',
      age: { years: 0, months: 0 },
      gender: 'LNG_REFERENCE_DATA_CATEGORY_GENDER_MALE',
      classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_NOT_A_CASE_DISCARDED',
      id: uuids('ca-3'),
      documents: [],
      addresses: [],
      dateOfReporting: date(),
      classificationHistory: [{
        classification: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_NOT_A_CASE_DISCARDED',
        startDate: date()
      }],
      usualPlaceOfResidenceLocationId: uuids('loc-3'),
      createdAt: date(),
      updatedAt: date()
    }
  ]
]