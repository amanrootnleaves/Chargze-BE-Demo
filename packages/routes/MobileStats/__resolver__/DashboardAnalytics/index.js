import { SESSION_STATUS, TRANSACTION_STATUS } from '@prisma/client'
import { getCreatedAtFilter } from '../../../../dyna_modules/Utils/dateFilter'

export default async (__, { dateFilter, startDate, endDate }, Context) => {
  const _functionName = 'Routes -> MobileStats -> Query -> DashboardAnalytics'
  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Fetching UssagesChartStamp' },
        _functionName
      )

      const now = new Date()
      if (dateFilter && (startDate || endDate)) {
        throw new Error('INVALID_DATE_FILTER')
      }

      const selectedRange = dateFilter ? getCreatedAtFilter(dateFilter) : startDate || endDate ? getCreatedAtFilter({ startDate, endDate }) : null
      const statsStart = selectedRange?.gte || new Date(now)
      if (!selectedRange) {
        statsStart.setDate(statsStart.getDate() - 6)
        statsStart.setHours(0, 0, 0, 0)
      }
      const statsEndExclusive = selectedRange ? selectedRange.lt || new Date(selectedRange.lte.getTime() + 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const energyStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - ((now.getDay() + 6) % 7)
      )
      const energyEnd = new Date(
        energyStart.getFullYear(),
        energyStart.getMonth(),
        energyStart.getDate() + 7
      )
      const revenueStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      const revenueEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const sessionsStart = statsStart < energyStart ? statsStart : energyStart
      const sessionsEnd = statsEndExclusive > energyEnd ? statsEndExclusive : energyEnd

      const formatDate = date =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const dailyTotals = new Map()
      const getDayCount = (start, endExclusive) => {
        const endTimestamp = Date.UTC(
          endExclusive.getFullYear(),
          endExclusive.getMonth(),
          endExclusive.getDate()
        )
        const startTimestamp = Date.UTC(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        )

        return Math.round((endTimestamp - startTimestamp) / 86400000)
      }
      const statsDayCount = getDayCount(statsStart, statsEndExclusive)

      Array.from({ 'length': statsDayCount }, (_, offset) =>
        new Date(statsStart.getFullYear(), statsStart.getMonth(), statsStart.getDate() + offset)).forEach(day => dailyTotals.set(formatDate(day), 0))

      const energyTotals = new Map()
      const energyDayCount = getDayCount(energyStart, energyEnd)

      Array.from({ 'length': energyDayCount }, (_, offset) =>
        new Date(energyStart.getFullYear(), energyStart.getMonth(), energyStart.getDate() + offset)).forEach(day => energyTotals.set(formatDate(day), 0))

      const monthTotals = new Map()
      const revenueMonthCount = ((revenueEnd.getFullYear() - revenueStart.getFullYear()) * 12) + (revenueEnd.getMonth() - revenueStart.getMonth())

      Array.from({ 'length': revenueMonthCount }, (_, offset) =>
        new Date(revenueStart.getFullYear(), revenueStart.getMonth() + offset, 1)).forEach(month => monthTotals.set(
        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        0
      ))

      const [sessions, revenueTransactions] = await Promise.all([
        Context.DataBase.chargingSession.findMany({
          'where': {
            'startTime': { 'gte': sessionsStart, 'lt': sessionsEnd },
            'status': SESSION_STATUS.COMPLETED,
            'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
          },
          'select': {
            'startTime': true,
            'energyConsumed': true
          },
          'orderBy': { 'startTime': 'asc' }
        }),
        Context.DataBase.transaction.findMany({
          'where': {
            'createdAt': { 'gte': revenueStart, 'lt': revenueEnd },
            'status': TRANSACTION_STATUS.SUCCESS,
            'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
          },
          'select': {
            'createdAt': true,
            'amount': true
          },
          'orderBy': { 'createdAt': 'asc' }
        })
      ])

      sessions.forEach(session => {
        if (!session.startTime) return
        const key = formatDate(session.startTime)
        const energy = Number(session.energyConsumed || 0)
        if (dailyTotals.has(key)) {
          dailyTotals.set(key, dailyTotals.get(key) + energy)
        }
        if (energyTotals.has(key)) {
          energyTotals.set(key, energyTotals.get(key) + energy)
        }
      })

      revenueTransactions.forEach(transaction => {
        const createdAt = new Date(transaction.createdAt)
        if (Number.isNaN(createdAt.getTime())) {
          throw new Error('INVALID_TRANSACTION_CREATED_AT')
        }
        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
        if (monthTotals.has(monthKey)) {
          monthTotals.set(
            monthKey,
            monthTotals.get(monthKey) + Number(transaction.amount || 0)
          )
        }
      })

      const cumulativeUsage = Array.from(dailyTotals, ([date, value]) => ({
        'label': date,
        value
      }))
      const energyDelivered = Array.from(energyTotals, ([date, value]) => ({
        'label': new Date(`${date}T00:00:00`).toLocaleDateString('en', {
          'weekday': 'short'
        }),
        value
      }))
      const revenueOverview = Array.from(monthTotals, ([month, value]) => ({
        'label': new Date(`${month}-01T00:00:00`).toLocaleDateString('en', {
          'month': 'short'
        }),
        value
      }))

      return {
        cumulativeUsage,
        energyDelivered,
        revenueOverview
      }
    }

    throw new Error('MISSING__CONTEXT')
  } catch (error) {
    await Context.Debug(
      { 'message': 'Unable to Fetch UssagesChartStamp' },
      _functionName
    )

    throw error
  }
}
