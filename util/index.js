
const R = require('ramda')

const getIDFromDisplayName = R.curry((arr, displayName) => {
  return R.pipe(
    R.find(R.propEq('displayName', displayName)),
    R.prop('id')
  )(arr)
})

module.exports = { getIDFromDisplayName }

