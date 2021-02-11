
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

export function createUUIDs () {
  const uuids = {}
  return (key) => {
    if (uuids[key] != null) {
      return uuids[key]
    } else {
      uuids[key] = uuid()
      return uuids[key]
    }
  }
}

export function mock (ret) {
  return jest.fn().mockReturnValue(ret)
}

