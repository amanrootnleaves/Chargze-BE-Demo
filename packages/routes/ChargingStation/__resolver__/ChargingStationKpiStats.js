const getMonthToDateRanges = () => {
  const now = new Date()
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const elapsedDays = now.getDate()
  const previousMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  const previousEnd = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(elapsedDays, previousMonthDays) + 1
  )

  return {
    'current': { 'gte': currentStart, 'lt': currentEnd },
    'previous': { 'gte': previousStart, 'lt': previousEnd }
  }
}

const calculateMetric = (value, currentPeriodValue, previousPeriodValue) => {
  const difference = currentPeriodValue - previousPeriodValue
  const percentageChange = 0 === previousPeriodValue ? 0 < currentPeriodValue ? 100 : 0 : Number(((Math.abs(difference) / previousPeriodValue) * 100).toFixed(1))

  return {
    'value': value,
    percentageChange,
    'isIncrease': 0 <= difference
  }
}

const activeStationWhere = {
  'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
}

const getStationSessionWhere = createdAt => ({
  'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
  ...(createdAt ? { createdAt } : {}),
  'Charger': {
    'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
    'ChargingStation': activeStationWhere
  }
})

export default async (_, __, Context) => {
  const functionName = 'Routes -> ChargingStation -> Query -> GetChargingStationKpiStats'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Fetching charging station KPI stats.' },
      functionName
    )

    const db = Context.DataBase
    const { current, previous } = getMonthToDateRanges()

    const [
      currentStationCount,
      previousStationCount,
      totalStationCount,
      currentTransactionCount,
      previousTransactionCount,
      totalTransactionCount,
      currentFaultyChargerCount,
      previousFaultyChargerCount,
      totalFaultyChargerCount,
      lifetimeRevenue,
      currentRevenue,
      previousRevenue
    ] = await Promise.all([
      db.chargingStation.count({
        'where': { ...activeStationWhere, 'createdAt': current }
      }),
      db.chargingStation.count({
        'where': { ...activeStationWhere, 'createdAt': previous }
      }),
      db.chargingStation.count({
        'where': activeStationWhere
      }),
      db.chargingSession.count({
        'where': getStationSessionWhere(current)
      }),
      db.chargingSession.count({
        'where': getStationSessionWhere(previous)
      }),
      db.chargingSession.count({
        'where': getStationSessionWhere()
      }),
      db.charger.count({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'FAULT',
          'updatedAt': current,
          'ChargingStation': activeStationWhere
        }
      }),
      db.charger.count({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'FAULT',
          'updatedAt': previous,
          'ChargingStation': activeStationWhere
        }
      }),
      db.charger.count({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'FAULT',
          'ChargingStation': activeStationWhere
        }
      }),
      db.transaction.aggregate({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'SUCCESS',
          'ChargingSession': getStationSessionWhere()
        },
        '_sum': { 'amount': true }
      }),
      db.transaction.aggregate({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'SUCCESS',
          'ChargingSession': getStationSessionWhere(current)
        },
        '_sum': { 'amount': true }
      }),
      db.transaction.aggregate({
        'where': {
          'OR': [{ 'isDeleted': false }, { 'isDeleted': null }],
          'status': 'SUCCESS',
          'ChargingSession': getStationSessionWhere(previous)
        },
        '_sum': { 'amount': true }
      })
    ])

    const lifetimeRevenueValue = Number(lifetimeRevenue._sum.amount || 0)
    const currentRevenueValue = Number(currentRevenue._sum.amount || 0)
    const previousRevenueValue = Number(previousRevenue._sum.amount || 0)

    const response = {
      'totalChargingStations': calculateMetric(
        totalStationCount,
        currentStationCount,
        previousStationCount
      ),
      'newChargingStations': calculateMetric(
        totalStationCount,
        currentStationCount,
        previousStationCount
      ),
      'totalTransactions': calculateMetric(
        totalTransactionCount,
        currentTransactionCount,
        previousTransactionCount
      ),
      'faultyChargers': calculateMetric(
        totalFaultyChargerCount,
        currentFaultyChargerCount,
        previousFaultyChargerCount
      ),
      'totalRevenue': calculateMetric(
        lifetimeRevenueValue,
        currentRevenueValue,
        previousRevenueValue
      )
    }

    await Context.Debug(
      { 'message': 'Charging station KPI stats fetched successfully.', response },
      functionName
    )

    return response
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to fetch charging station KPI stats.', error },
        functionName
      )
    }

    throw error
  }
}
