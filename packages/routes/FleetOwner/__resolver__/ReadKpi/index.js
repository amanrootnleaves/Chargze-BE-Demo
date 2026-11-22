const getMonthToDateRanges = now => {
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

const getDayToDateRanges = now => {
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

const getWeekToDateRanges = now => {
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
  const percentageChange = 0 === previousValue ? 0 < currentValue ? 100 : 0 : Number((((currentValue - previousValue) / Math.abs(previousValue)) * 100).toFixed(1))

  return {
    value,
    percentageChange,
    comparisonPeriod
  }
}

const getSessionWhere = endTime => ({
  'isDeleted': false,
  'status': 'COMPLETED',
  ...(endTime ? { endTime } : {})
})

export default async (__, args, Context) => {
  const _functionName = 'Routes -> FleetOwners -> Query -> GetFleetOwnersKPIs'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Fetching Fleet Owners overall KPIs.' },
      _functionName
    )

    const now = new Date()
    const { 'current': currentMonth, 'previous': previousMonth } = getMonthToDateRanges(now)
    const { 'current': currentDay, 'previous': previousDay } = getDayToDateRanges(now)
    const { 'current': currentWeek, 'previous': previousWeek } = getWeekToDateRanges(now)
    const db = Context.DataBase

    const [
      sessionKPIs,
      todaySessionKPIs,
      yesterdaySessionKPIs,
      thisWeekSessionKPIs,
      lastWeekSessionKPIs,
      totalFleetCustomers,
      currentFleetCustomers,
      previousFleetCustomers,
      totalHubs,
      currentHubs,
      previousHubs
    ] = await Promise.all([
      db.chargingSession.aggregate({
        'where': getSessionWhere(),
        '_count': { 'id': true },
        '_sum': { 'totalAmount': true, 'energyConsumed': true }
      }),
      db.chargingSession.aggregate({
        'where': getSessionWhere(currentDay),
        '_count': { 'id': true }
      }),
      db.chargingSession.aggregate({
        'where': getSessionWhere(previousDay),
        '_count': { 'id': true }
      }),
      db.chargingSession.aggregate({
        'where': getSessionWhere(currentWeek),
        '_sum': { 'totalAmount': true, 'energyConsumed': true }
      }),
      db.chargingSession.aggregate({
        'where': getSessionWhere(previousWeek),
        '_sum': { 'totalAmount': true, 'energyConsumed': true }
      }),
      db.fleetOwner.count({
        'where': { 'isDeleted': false }
      }),
      db.fleetOwner.count({
        'where': { 'isDeleted': false, 'createdAt': currentMonth }
      }),
      db.fleetOwner.count({
        'where': { 'isDeleted': false, 'createdAt': previousMonth }
      }),
      db.chargingStation.count({
        'where': { 'isDeleted': false }
      }),
      db.chargingStation.count({
        'where': { 'isDeleted': false, 'createdAt': currentMonth }
      }),
      db.chargingStation.count({
        'where': { 'isDeleted': false, 'createdAt': previousMonth }
      })
    ])

    const response = {
      'totalFleetCustomers': calculateMetric(
        totalFleetCustomers,
        currentFleetCustomers,
        previousFleetCustomers,
        'LAST_MONTH'
      ),
      'totalHubs': calculateMetric(
        totalHubs,
        currentHubs,
        previousHubs,
        'LAST_MONTH'
      ),
      'totalTransactions': calculateMetric(
        sessionKPIs._count.id || 0,
        todaySessionKPIs._count.id || 0,
        yesterdaySessionKPIs._count.id || 0,
        'VS_YESTERDAY'
      ),
      'totalRevenue': calculateMetric(
        Number(sessionKPIs._sum.totalAmount || 0),
        Number(thisWeekSessionKPIs._sum.totalAmount || 0),
        Number(lastWeekSessionKPIs._sum.totalAmount || 0),
        'THIS_WEEK'
      ),
      'totalEnergyDelivered': calculateMetric(
        Number(sessionKPIs._sum.energyConsumed || 0),
        Number(thisWeekSessionKPIs._sum.energyConsumed || 0),
        Number(lastWeekSessionKPIs._sum.energyConsumed || 0),
        'THIS_WEEK'
      )
    }

    await Context.Debug(
      { 'message': 'KPIs fetched successfully.', response },
      _functionName
    )

    return response
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to fetch Fleet Owners overall KPIs.', error },
        _functionName
      )
    }

    throw error
  }
}
