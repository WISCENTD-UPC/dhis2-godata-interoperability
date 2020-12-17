
import * as R from 'ramda'

// Given a displayName and a list of objects with ID and displayName,
// finds an element with the given displayName and returns the ID
export const getIDFromDisplayName = R.curry((arr, displayName) => {
  return R.pipe(
    R.find(R.propEq('displayName', displayName)),
    R.prop('id')
  )(arr)
})

// Maps the displayNames of config.dhis2KeyAttributes to its IDs
// given the attributes list fetched from dhis2
export function mapAttributeNamesToIDs (attributes) {
  return R.over(
    R.lensProp('dhis2KeyAttributes'),
    R.mapObjIndexed((value) => {
      return R.find(R.propEq('displayName', value), attributes).id
    }))
}

// Creates and object with data from "model" as defined by the selectors in "schema"
export const completeSchema = R.curry((schema, model) => {
  const completedSchema = {}

  if (R.is(Array, schema)) {
    return R.map(completeSchema(R.__, model), schema)
  } else if (typeof schema === 'object') {
    for (let prop in schema) {
      if (typeof schema[prop] === 'function') {
        completedSchema[prop] = schema[prop](model)
      } else if (schema[prop] == null) {
        completedSchema[prop] = schema[prop]
      } else if (R.is(Array, schema[prop])) {
        completedSchema[prop] = R.map(completeSchema(R.__, model), schema[prop])
      } else if (R.is(Date, schema[prop])) {
        completedSchema[prop] = schema[prop]
      } else if (typeof schema[prop] === 'object') {
        completedSchema[prop] = completeSchema(schema[prop], model)
      } else {
        completedSchema[prop] = schema[prop]
      }
    }
    return completedSchema
  } else {
    return completeSchema({ schema }, model).schema
  }
})

export const promisePipeline = (...fns) => {
  return (args) => {
    return fns.reduce(async (args, fn) => {
      return fn(await args)
    }, args)
  }
}

export const allPromises = Promise.all.bind(Promise)

export const log = (str) => {
  if (process != null && process.env != null && process.env.NODE_ENV !== 'development') {
    if (process.stdout != null) {
      process.stdout.write(str)
    }
  }
}
export const logAction = (str, padding = 80, separator = ' ') => log(str.concat('...').padEnd(padding, separator))
export const logDone = () => log('DONE.\n')

