
const R = require('ramda')

function completeSchema (schema, model) {
  const completedSchema = {}

  if (R.is(Object, schema)) {
    for (let prop in schema) {
      if (typeof schema[prop] === 'function') {
        completedSchema[prop] = schema[prop](model)
      } else if (schema[prop] == null) {
        completedSchema[prop] = schema[prop]
      } else if (R.is(Array, schema[prop])) {
        completedSchema[prop] = R.map(R.curry(completeSchema)(R.__, model), schema[prop])
      } else if (typeof schema[prop] === 'object') {
        completedSchema[prop] = completeSchema(schema[prop], model)
      } else {
        completedSchema[prop] = schema[prop]
      }
    }
    return completedSchema
  } else {
    return schema
  }
}

module.exports = { completeSchema }

