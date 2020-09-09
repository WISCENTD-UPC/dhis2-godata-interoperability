
const R = require('ramda')

const constants = require('../config/constants')
const { loadTrackedEntityInstances } = require('./common')
const { getIDFromDisplayName, allPromises } = require('../util')
const { createOutbreakMapping } = require('../mappings/outbreak')

const createOutbreaks = (dhis2, godata, config, _ = {
  postOutbreaks,
  loadTrackedEntityInstances,
  Date
}) => async () => {
  const [ programs, organisationUnits ] = await loadResources(dhis2, config)
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  const groupingLevel = selectGroupingLevel(organisationUnits, config)
  const outbreaks = initializeOutbreaks(organisationUnits)
  const trackedEntities = await _.loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID)

  return R.pipe(
    R.flatten,
    addTrackedEntitiesToOutbreaks(outbreaks),
    groupOutbreaks(outbreaks, groupingLevel),
    R.values,
    R.map(createOutbreakMapping(config, _)),
    _.postOutbreaks(godata)
  )(trackedEntities)
}

function loadResources (dhis2, config) {
  return allPromises([
    dhis2.getPrograms(),
    dhis2.getOrganisationUnitsFromParent(config.rootID)
  ])
}

function selectGroupingLevel (organisationUnits, config) {
  const maxLevel = R.pipe(R.pluck('level'), R.reduce(R.max, 0))(organisationUnits)
  return config.outbreakCreationMode === constants.OUTBREAK_CREATION_MODE.EXPAND
    ? maxLevel
    : config.outbreakCreationGroupingLevel != null
      ? R.min(config.outbreakCreationGroupingLevel, maxLevel)
      : maxLevel
}

function initializeOutbreaks (organisationUnits) {
  return R.reduce(
    (acc, el) => R.assoc(el.id, { orgUnit: el, trackedEntities: [] }, acc),
    {}, organisationUnits)
}

function addTrackedEntitiesToOutbreaks (outbreaks) {
  return R.reduce((outbreaks, te) => R.over(
      R.lensPath([te.orgUnit, 'trackedEntities']),
      R.append(te),
      outbreaks
    ), outbreaks)
}

function findGroupingOutbreak (outbreaks, groupingLevel, outbreak) {
  if (outbreak.orgUnit.level <= (groupingLevel + 1)) {
    return outbreak
  } else {
    return findGroupingOutbreak(
      outbreaks, groupingLevel, R.prop(outbreak.orgUnit.parent.id, outbreaks))
  }
}

function groupOutbreaks (outbreaks, groupingLevel) {
  return (outbreaks) => R.reduce((acc, ob) => {
    const groupingOutbreak = findGroupingOutbreak(outbreaks, groupingLevel, ob)
    
    if (R.prop(groupingOutbreak.orgUnit.id, acc) == null) {
      return R.assoc(groupingOutbreak.orgUnit.id, groupingOutbreak, acc)
    } else {
      return R.pipe(
        R.over(
          R.lensPath([groupingOutbreak.orgUnit.id, 'trackedEntities']),
          R.concat(ob.trackedEntities)),
        R.over(
          R.lensPath([groupingOutbreak.orgUnit.id, 'mergedLocationsIDs']),
          R.append(ob.orgUnit.id))
      )(acc)
    }
  }, {}, R.values(outbreaks))
}

function postOutbreaks (godata) {
  return (outbreaks) => Promise.all(R.map(
    outbreak => godata.createOutbreak(outbreak),
    outbreaks
  ))
}

module.exports = { createOutbreaks }

