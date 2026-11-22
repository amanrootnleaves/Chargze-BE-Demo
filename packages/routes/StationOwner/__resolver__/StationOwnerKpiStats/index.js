const getMonthToDateRanges = () => {
  const now = new Date()
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  const previousEnd = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(now.getDate(), previousMonthDays) + 1
  )

  return {
    'current': { 'gte': currentStart, 'lt': currentEnd },
    'previous': { 'gte': previousStart, 'lt': previousEnd }
  }
}

const getDayToDateRanges = () => {
  const now = new Date()
  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - 1)
  const previousEnd = new Date(now)
  previousEnd.setDate(previousEnd.getDate() - 1)

  return {
    'current': { 'gte': currentStart, 'lt': now },
    'previous': { 'gte': previousStart, 'lt': previousEnd }
  }
}

const getWeekToDateRanges = () => {
  const now = new Date()
  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysSinceMonday = (now.getDay() + 6) % 7
  currentStart.setDate(currentStart.getDate() - daysSinceMonday)

  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - 7)
  const previousEnd = new Date(now)
  previousEnd.setDate(previousEnd.getDate() - 7)

  return {
    'current': { 'gte': currentStart, 'lt': now },
    'previous': { 'gte': previousStart, 'lt': previousEnd }
  }
}

const calculateMetric = (value, currentValue, previousValue, comparisonPeriod) => {
  const difference = currentValue - previousValue
  const percentageChange = 0 === previousValue ? 0 < currentValue ? 100 : 0 : Number(
    ((Math.abs(difference) / Math.abs(previousValue)) * 100).toFixed(1)
  )

  return {
    value,
    percentageChange,
    'isIncrease': 0 <= difference,
    comparisonPeriod
  }
}

const activeRecordWhere = {
  'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
}

const getStationOwnerSessionWhere = endTime => ({
  ...activeRecordWhere,
  'status': 'COMPLETED',
  ...(endTime ? { 'endTime': endTime } : {}),
  'Charger': {
    ...activeRecordWhere,
    'ChargingStation': {
      ...activeRecordWhere,
      'StationOwner': {
        'isDeleted': false
      }
    }
  }
})

export default async (_, __, Context) => {
  const functionName = 'Routes -> StationOwner -> Query -> GetStationOwnerKpiStats'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Fetching station owner KPI stats.' },
      functionName
    )

    const db = Context.DataBase
    const { current, previous } = getMonthToDateRanges()
    const {
      'current': currentDay,
      'previous': previousDay
    } = getDayToDateRanges()
    const {
      'current': currentWeek,
      'previous': previousWeek
    } = getWeekToDateRanges()
    const activeOwnersWhere = {
      'isDeleted': false,
      'status': 'ACTIVE'
    }
    const activeStationsWhere = {
      ...activeRecordWhere,
      'StationOwner': {
        'isDeleted': false
      }
    }
    const currentEnergyWhere = getStationOwnerSessionWhere(currentWeek)
    const previousEnergyWhere = getStationOwnerSessionWhere(previousWeek)

    const [
      totalOwners,
      currentOwners,
      previousOwners,
      totalChargingStations,
      maintenanceStations,
      currentChargingStations,
      previousChargingStations,
      totalActiveOwners,
      activeOwnersCreatedToday,
      activeOwnersCreatedYesterday,
      currentEnergy,
      previousEnergy
    ] = await Promise.all([
      db.stationOwner.count({ 'where': { 'isDeleted': false } }),
      db.stationOwner.count({
        'where': { 'isDeleted': false, 'createdAt': current }
      }),
      db.stationOwner.count({
        'where': { 'isDeleted': false, 'createdAt': previous }
      }),
      db.chargingStation.count({ 'where': activeStationsWhere }),
      db.chargingStation.count({
        'where': {
          ...activeStationsWhere,
          'Chargers': {
            'some': {
              ...activeRecordWhere,
              'status': 'MAINTENANCE'
            }
          }
        }
      }),
      db.chargingStation.count({
        'where': { ...activeStationsWhere, 'createdAt': current }
      }),
      db.chargingStation.count({
        'where': { ...activeStationsWhere, 'createdAt': previous }
      }),
      db.stationOwner.count({ 'where': activeOwnersWhere }),
      db.stationOwner.count({
        'where': { ...activeOwnersWhere, 'createdAt': currentDay }
      }),
      db.stationOwner.count({
        'where': { ...activeOwnersWhere, 'createdAt': previousDay }
      }),
      db.chargingSession.aggregate({
        'where': currentEnergyWhere,
        '_sum': { 'energyConsumed': true }
      }),
      db.chargingSession.aggregate({
        'where': previousEnergyWhere,
        '_sum': { 'energyConsumed': true }
      })
    ])

    const response = {
      'totalOwners': calculateMetric(
        totalOwners,
        currentOwners,
        previousOwners,
        'LAST_MONTH'
      ),
      'totalChargingStations': calculateMetric(
        totalChargingStations,
        currentChargingStations,
        previousChargingStations,
        'IN_MAINTENANCE'
      ),
      maintenanceStations,
      'activeOwners': calculateMetric(
        totalActiveOwners,
        activeOwnersCreatedToday,
        activeOwnersCreatedYesterday,
        'VS_YESTERDAY'
      ),
      'totalEnergyDelivered': calculateMetric(
        Number(currentEnergy._sum.energyConsumed || 0),
        Number(currentEnergy._sum.energyConsumed || 0),
        Number(previousEnergy._sum.energyConsumed || 0),
        'THIS_WEEK'
      )
    }

    await Context.Debug(
      {
        'message': 'Station owner KPI stats fetched successfully.',
        response
      },
      functionName
    )

    return response
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to fetch station owner KPI stats.', error },
        functionName
      )
    }

    throw error
  }
}
