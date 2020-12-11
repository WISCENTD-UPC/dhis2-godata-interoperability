
import * as R from 'ramda'

import base from './config.base'
import prod from './config'
import dev from './config.dev'

const env = process.env.NODE_ENV

export default R.pipe(
  R.mergeDeepLeft(env === 'dev' ? dev : {}),
  R.mergeDeepLeft(env !== 'dev' ? prod : {})
)(base)

