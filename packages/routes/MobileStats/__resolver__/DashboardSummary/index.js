import {
  CHARGER_STATUS,
  CONNECTOR_STATUS,
  SESSION_STATUS,
  TRANSACTION_STATUS
} from '@prisma/client'
import { getCreatedAtFilter } from '../../../../dyna_modules/Utils/dateFilter'

const activeRecordWhere = {
  'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
}

const getPercentageChange = (current, previous) =>
  0 === previous ? 0 < current ? 100 : 0 : Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1))

export default async (__, { dateFilter, startDate, endDate }, Context) => {
  const functionName = 'Routes -> MobileStats -> Query -> DashboardSummary'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug({ 'message': 'Fetching dashboard summary.' }, functionName)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
    const previousWeekStart = new Date(weekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(now)
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    if (dateFilter && (startDate || endDate)) {
      throw new Error('INVALID_DATE_FILTER')
    }

    const selectedRange = dateFilter ? getCreatedAtFilter(dateFilter) : startDate || endDate ? getCreatedAtFilter({ startDate, endDate }) : null
    const selectedStart = selectedRange?.gte
    const selectedEndExclusive = selectedRange ? selectedRange.lt || new Date(selectedRange.lte.getTime() + 1) : null
    const previousSelectedRange = selectedRange ? {
      'gte': new Date(
        selectedStart.getTime() - (selectedEndExclusive.getTime() - selectedStart.getTime())
      ),
      'lt': selectedStart
    } : null
    const newCountsCurrentRange = selectedRange ? { 'gte': selectedStart, 'lt': selectedEndExclusive } : { 'gte': weekStart, 'lte': now }
    const newCountsPreviousRange = selectedRange ? previousSelectedRange : { 'gte': previousWeekStart, 'lt': previousWeekEnd }
    const revenueCurrentRange = selectedRange ? { 'gte': selectedStart, 'lt': selectedEndExclusive } : { 'gte': monthStart, 'lt': nextMonthStart }
    const revenuePreviousRange = selectedRange ? previousSelectedRange : { 'gte': previousMonthStart, 'lt': monthStart }
    const energyCurrentRange = selectedRange ? { 'gte': selectedStart, 'lt': selectedEndExclusive } : { 'gte': weekStart, 'lte': now }
    const energyPreviousRange = selectedRange ? previousSelectedRange : { 'gte': previousWeekStart, 'lt': previousWeekEnd }
    const sessionCurrentRange = selectedRange ? { 'gte': selectedStart, 'lt': selectedEndExclusive } : { 'gte': todayStart, 'lt': tomorrowStart }
    const sessionPreviousRange = selectedRange ? previousSelectedRange : { 'gte': yesterdayStart, 'lt': todayStart }
    const sessionDateFilter = selectedRange ? { 'startTime': sessionCurrentRange } : {}

    const [
      faultConnectors,
      currentFaultConnectors,
      previousFaultConnectors,
      preparingConnectors,
      maintenanceChargers,
      activeChargingSessions,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeStations,
      currentActiveStations,
      previousActiveStations,
      chargingSessions,
      revenue,
      previousRevenue,
      newUsers,
      previousNewUsers,
      newChargingPoints,
      previousNewChargingPoints,
      newStationOwners,
      previousNewStationOwners,
      totalEnergy,
      previousEnergy,
      sessionsToday,
      sessionsYesterday,
      recentSessions,
      stationTypes
    ] = await Promise.all([
      Context.DataBase.connector.count({
        'where': { ...activeRecordWhere, 'status': CONNECTOR_STATUS.FAULT }
      }),
      Context.DataBase.connector.count({
        'where': {
          ...activeRecordWhere,
          'status': CONNECTOR_STATUS.FAULT,
          'createdAt': newCountsCurrentRange
        }
      }),
      Context.DataBase.connector.count({
        'where': {
          ...activeRecordWhere,
          'status': CONNECTOR_STATUS.FAULT,
          'createdAt': newCountsPreviousRange
        }
      }),
      Context.DataBase.connector.count({
        'where': { ...activeRecordWhere, 'status': CONNECTOR_STATUS.PREPARING }
      }),
      Context.DataBase.charger.count({
        'where': { ...activeRecordWhere, 'status': CHARGER_STATUS.MAINTENANCE }
      }),
      Context.DataBase.chargingSession.count({
        'where': { ...activeRecordWhere, 'status': SESSION_STATUS.IN_PROGRESS }
      }),
      Context.DataBase.charger.count({ 'where': activeRecordWhere }),
      Context.DataBase.charger.count({
        'where': { ...activeRecordWhere, 'status': CHARGER_STATUS.AVAILABLE }
      }),
      Context.DataBase.charger.count({
        'where': { ...activeRecordWhere, 'status': CHARGER_STATUS.OFFLINE }
      }),
      Context.DataBase.chargingStation.count({
        'where': { ...activeRecordWhere, 'status': 'LIVE' }
      }),
      Context.DataBase.chargingStation.count({
        'where': {
          ...activeRecordWhere,
          'status': 'LIVE',
          'createdAt': newCountsCurrentRange
        }
      }),
      Context.DataBase.chargingStation.count({
        'where': {
          ...activeRecordWhere,
          'status': 'LIVE',
          'createdAt': newCountsPreviousRange
        }
      }),
      Context.DataBase.chargingSession.count({
        'where': { ...activeRecordWhere, ...sessionDateFilter }
      }),
      Context.DataBase.transaction.aggregate({
        'where': {
          ...activeRecordWhere,
          'status': TRANSACTION_STATUS.SUCCESS,
          'createdAt': revenueCurrentRange
        },
        '_sum': { 'amount': true }
      }),
      Context.DataBase.transaction.aggregate({
        'where': {
          ...activeRecordWhere,
          'status': TRANSACTION_STATUS.SUCCESS,
          'createdAt': revenuePreviousRange
        },
        '_sum': { 'amount': true }
      }),
      Context.DataBase.customerProfile.count({
        'where': { ...activeRecordWhere, 'createdAt': newCountsCurrentRange }
      }),
      Context.DataBase.customerProfile.count({
        'where': { ...activeRecordWhere, 'createdAt': newCountsPreviousRange }
      }),
      Context.DataBase.chargingStation.count({
        'where': {
          ...activeRecordWhere,
          'createdAt': newCountsCurrentRange
        }
      }),
      Context.DataBase.chargingStation.count({
        'where': {
          ...activeRecordWhere,
          'createdAt': newCountsPreviousRange
        }
      }),
      Context.DataBase.stationOwner.count({
        'where': { 'isDeleted': false, 'createdAt': newCountsCurrentRange }
      }),
      Context.DataBase.stationOwner.count({
        'where': { 'isDeleted': false, 'createdAt': newCountsPreviousRange }
      }),
      Context.DataBase.chargingSession.aggregate({
        'where': {
          ...activeRecordWhere,
          'status': SESSION_STATUS.COMPLETED,
          'startTime': energyCurrentRange
        },
        '_sum': { 'energyConsumed': true }
      }),
      Context.DataBase.chargingSession.aggregate({
        'where': {
          ...activeRecordWhere,
          'status': SESSION_STATUS.COMPLETED,
          'startTime': energyPreviousRange
        },
        '_sum': { 'energyConsumed': true }
      }),
      Context.DataBase.chargingSession.count({
        'where': { ...activeRecordWhere, 'startTime': sessionCurrentRange }
      }),
      Context.DataBase.chargingSession.count({
        'where': { ...activeRecordWhere, 'startTime': sessionPreviousRange }
      }),
      Context.DataBase.chargingSession.findMany({
        'where': activeRecordWhere,
        'include': {
          'CustomerProfile': {
            'include': {
              'Account': { 'select': { 'fullName': true } }
            }
          },
          'Charger': {
            'include': {
              'ChargingStation': { 'select': { 'name': true } }
            }
          }
        },
        'orderBy': { 'createdAt': 'desc' },
        'take': 5
      }),
      Context.DataBase.chargingStation.findMany({
        'where': activeRecordWhere,
        'select': { 'type': true }
      })
    ])

    const totalRevenue = Number(revenue._sum.amount || 0)
    const previousMonthRevenue = Number(previousRevenue._sum.amount || 0)
    const currentEnergy = Number(totalEnergy._sum.energyConsumed || 0)
    const previousWeekEnergy = Number(previousEnergy._sum.energyConsumed || 0)
    const stationModelCounts = stationTypes.reduce((counts, station) => {
      const type = station.type || 'Unspecified'
      counts.set(type, (counts.get(type) || 0) + 1)

      return counts
    }, new Map())
    const stationModels = Array.from(
      stationModelCounts,
      ([type, count]) => ({ type, count })
    )

    return {
      'licenseStatus': {
        'status': 'ACTIVE',
        'expiryDate': null,
        'supportEmail': null,
        'supportPhone': null
      },
      faultConnectors,
      'faultConnectorsChangePercent': getPercentageChange(
        currentFaultConnectors,
        previousFaultConnectors
      ),
      preparingConnectors,
      maintenanceChargers,
      activeChargingSessions,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeStations,
      'activeStationsChangePercent': getPercentageChange(
        currentActiveStations,
        previousActiveStations
      ),
      chargingSessions,
      sessionsToday,
      sessionsYesterday,
      'sessionsTodayChangePercent': getPercentageChange(
        sessionsToday,
        sessionsYesterday
      ),
      totalRevenue,
      previousMonthRevenue,
      'revenueChangePercent': getPercentageChange(
        totalRevenue,
        previousMonthRevenue
      ),
      newUsers,
      'newUsersChangePercent': getPercentageChange(newUsers, previousNewUsers),
      newChargingPoints,
      'newChargingPointsChangePercent': getPercentageChange(
        newChargingPoints,
        previousNewChargingPoints
      ),
      newStationOwners,
      'newStationOwnersChangePercent': getPercentageChange(
        newStationOwners,
        previousNewStationOwners
      ),
      'totalEnergy': currentEnergy,
      'energyChangePercent': getPercentageChange(
        currentEnergy,
        previousWeekEnergy
      ),
      stationModels,
      'recentSessions': recentSessions.map(session => ({
        'id': session.id,
        'customerName': session.CustomerProfile?.Account?.fullName || 'Unknown customer',
        'stationName': session.Charger?.ChargingStation?.name || 'Unknown station',
        'energyDelivered': Number(session.energyConsumed || 0),
        'amount': Number(session.totalAmount || 0),
        'status': session.status,
        'startTime': session.startTime
      }))
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Unable to fetch dashboard summary.', error },
        functionName
      )
    }

    throw error
  }
}
