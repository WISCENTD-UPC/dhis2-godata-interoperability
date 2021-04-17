
import * as R from 'ramda'

import * as util from '../../src/util'
import config from '../../src/config'
import { attributes } from '../test-util/mocks'

test('util.getIDFromDisplayName', () => {
  const arr = [
    { id: '1', displayName: 'foo' },
    { id: '2', displayName: 'bar' }
  ]

  expect(util.getIDFromDisplayName(arr, 'foo')).toBe('1')
  expect(util.getIDFromDisplayName(arr, 'bar')).toBe('2')
  expect(util.getIDFromDisplayName(arr, 'other')).toStrictEqual(undefined)
})

test('util.mapAttributeNamesToIDs', () => {
  expect(util.mapAttributeNamesToIDs(attributes)(config).dhis2KeyAttributes)
    .toStrictEqual({
      firstName: attributes[9].id,
      surname: attributes[16].id,
      caseID: attributes[18].id,
      sex: attributes[15].id,
      dateOfBirth: attributes[2].id,
      address: attributes[11].id,
      passport: attributes[14].id,
      age: attributes[0].id
    })
})

test('util.completeSchema with simple schema', () => {
  const schema = {
    string: '3',
    number: 42,
    obj: {
      str: 'asd',
      arr: [ 1, 2, 3 ],
      emptyArr: []
    },
    date: new Date()
  }

  expect(util.completeSchema(schema)({})).toStrictEqual(schema)
})

test('util.completeSchema with complex schema', () => {
  const schema = {
    bar: '3',
    fn: R.pipe(R.prop('foo'), R.toUpper),
    arr: [ 1, R.pipe(R.prop('other'), Number, R.add(1)), 3],
    obj: {
      subbar: 42,
      subfn: R.pipe(R.path(['obj', 'subfoo']), String),
      emptyArr: []
    }
  }

  const obj = {
    foo: 'asd',
    other: '13',
    obj: {
      subfoo: 11
    }
  }

  expect(util.completeSchema(schema)(obj)).toStrictEqual({
    bar: '3',
    fn: 'ASD',
    arr: [ 1, 14, 3 ],
    obj: {
      subbar: 42,
      subfn: '11',
      emptyArr: []
    }
  })
})

test('util.promisePipeline', async () => {
  const fn = util.promisePipeline(
    R.flatten,
    R.map(R.prop('a')),
    Promise.resolve.bind(Promise),
    R.map(R.toUpper())
  )

  const result = await fn([ [ { a: 'foo' } ], [ { a: 'bar' } ] ])
  expect(result).toStrictEqual([ 'FOO', 'BAR' ])
})

test('util.allPromises', async () => {
  expect(await util.allPromises([Promise.resolve(1), Promise.resolve(2)])).toStrictEqual([1, 2])
})

