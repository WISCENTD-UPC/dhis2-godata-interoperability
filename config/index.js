
const R = require('ramda')

const base = require('./config.base')
const prod = require('./config.prod')
const dev = require('./config.dev')

const env = process.env.NODE_ENV

module.exports = R.mergeRight(base, env === 'production' ? prod : dev)

