
const R = require('ramda')

const constants = require('../config/constants')
const { loadTrackedEntityInstances } = require('./common')
const { getIDFromDisplayName, allPromises, promisePipeline, logAction, logDone } = require('../util')
const { createOutbreakMapping } = require('../mappings/outbreak')

// Creates an outbreak or a series of outbreaks (depending on the configuration)
// based on the tracked entity instances (cases) fetched from dhis2
// and uploads it/them to godata
const createOutbreaks = (dhis2, godata, config, _ = {
  postOutbreaks,
  loadTrackedEntityInstances,
  Date
}) => async () => {
  logAction('Fetching resources')
  const [ programs, organisationUnits ] = await loadResources(dhis2, config)
  logDone()
  const casesProgramID = getIDFromDisplayName(programs, config.dhis2CasesProgram)
  const groupingLevel = selectGroupingLevel(organisationUnits, config)
  logAction('Fetching tracked entity instances')
  const trackedEntities = await _.loadTrackedEntityInstances(dhis2, organisationUnits, casesProgramID)
  logDone()
  
  return processOutbreaks(godata, config, organisationUnits, groupingLevel, _)(trackedEntities)
}

// Load resources from dhis2 and godata
function loadResources (dhis2, config) {
  return allPromises([
    dhis2.getPrograms(),
    dhis2.getOrganisationUnitsFromParent(config.rootID)
  ])
}

function processOutbreaks (godata, config, organisationUnits, groupingLevel, _ = {
  postOutbreaks, Date
}) {
  logAction('Initializing outbreaks')
  const outbreaks = initializeOutbreaks(organisationUnits)
  logDone()
  
  return promisePipeline(
    R.tap(() => logAction('Processing outbreaks')),
    addTrackedEntitiesToOutbreaks(outbreaks),
    groupOutbreaks(outbreaks, groupingLevel),
    R.values,
    R.map(createOutbreakMapping(config, _)),
    R.tap(() => logDone()),
    R.tap(() => logAction('Creating outbreaks in Go.Data')),
    _.postOutbreaks(godata),
    R.tap(() => logDone())
  )
}

// Selects the administrative level that is going to be used for
// grouping based on the config and the maxLevel defined in the
// fetched organisation units
function selectGroupingLevel (organisationUnits, config) {
  const maxLevel = R.pipe(
    R.pluck('level'),
    R.reduce(R.max, 0)
  )(organisationUnits)

  return config.outbreakCreationMode === constants.OUTBREAK_CREATION_MODE.EXPAND
    ? maxLevel - 1
    : config.outbreakCreationGroupingLevel != null
      ? R.min(config.outbreakCreationGroupingLevel, maxLevel - 1)
      : maxLevel - 1
}

// From a list of organization units creates and object where they are
// indexed by id and divided in orgUnit and trackedEntities
function initializeOutbreaks (organisationUnits) {
  return R.reduce(
    (acc, el) => R.assoc(el.id, { orgUnit: el, trackedEntities: [] }, acc),
    {}, organisationUnits)
}

// Append tracked entities to its corresponding outbreak in
// an object where outbreaks are indexed by ID
function addTrackedEntitiesToOutbreaks (outbreaks) {
  return R.reduce((outbreaks, te) => R.over(
      R.lensPath([te.orgUnit, 'trackedEntities']),
      R.append(te),
      outbreaks
    ), outbreaks)
}

// Finds the outbreak up in the hierarchy the current outbreak should be group by
// (if it is not itself)
function findGroupingOutbreak (outbreaks, groupingLevel, outbreak) {
  if (outbreak.orgUnit.level <= (groupingLevel + 1)) {
    return outbreak
  } else {
    return findGroupingOutbreak(
      outbreaks, groupingLevel, R.prop(outbreak.orgUnit.parent.id, outbreaks))
  }
}

// Group outbreaks by grouping level
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

// Post outbreaks (one by one)
function postOutbreaks (godata) {
  return (outbreaks) => allPromises(
    R.map(outbreak => godata.createOutbreak(outbreak), outbreaks)
  )
}

module.exports = { createOutbreaks, loadResources, processOutbreaks, selectGroupingLevel }

