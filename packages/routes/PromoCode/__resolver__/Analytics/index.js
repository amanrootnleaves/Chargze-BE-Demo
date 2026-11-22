const _getDateRange = dateFilter => {
  if (!dateFilter) return null

  const { period, startDate, endDate } = dateFilter
  if (period && (startDate || endDate)) throw new Error('INVALID_DATE_FILTER')
  if (!period && (!startDate || !endDate)) throw new Error('INVALID_DATE_FILTER')

  if (period) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    switch (period) {
    case 'TODAY':
      break
    case 'WEEK':
      start.setDate(start.getDate() - 6)

      break
    case 'MONTH':
      start.setDate(1)

      break
    case 'HALF_YEAR':
      start.setDate(1)
      start.setMonth(start.getMonth() - 5)

      break
    case 'YEAR':
      start.setMonth(0, 1)

      break
    default:
      throw new Error('INVALID_DATE_FILTER')
    }

    return { 'gte': start, 'lt': end }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('INVALID_DATE_FILTER')
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)

  return { 'gte': start, 'lt': end }
}

const _getPreviousDateRange = dateRange => {
  if (!dateRange) return null

  const duration = dateRange.lt.getTime() - dateRange.gte.getTime()

  return {
    'gte': new Date(dateRange.gte.getTime() - duration),
    'lt': new Date(dateRange.gte)
  }
}

const _getGrowthPercentage = (current, previous) => {
  if (!previous) return 0 < current ? 100 : 0

  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export default async (parent, { dateFilter }, Context) => {
  const functionName = 'Routes -> PromoCode -> Query -> GetPromoCodeAnalytics'

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Fetching promo code analytics data.', dateFilter },
        functionName
      )
    }

    const dateRange = _getDateRange(dateFilter)
    const previousDateRange = _getPreviousDateRange(dateRange)
    const usageFilter = dateRange ? { 'createdAt': dateRange } : null
    const previousUsageFilter = previousDateRange ? { 'createdAt': previousDateRange, 'PromoCode': { 'isDeleted': false } } : null

    const [promoCodes, previousUsageCount] = await Promise.all([
      Context.DataBase.promoCode.findMany({
        'where': { 'isDeleted': false },
        'orderBy': { 'createdAt': 'desc' },
        'include': {
          'usages': {
            ...(usageFilter ? { 'where': usageFilter } : {}),
            'select': { 'createdAt': true, 'discountGiven': true }
          }
        }
      }),
      previousUsageFilter ? Context.DataBase.promoCodeUsage.count({ 'where': previousUsageFilter }) : Promise.resolve(0)
    ])

    const usageCount = promoCodes.reduce((count, promo) => count + promo.usages.length, 0)
    const trendGrowthPercentage = dateRange ? _getGrowthPercentage(usageCount, previousUsageCount) : 0

    const statusCounts = {}
    const savingsByCode = new Map()
    const trendByMonth = new Map()

    promoCodes.forEach(promo => {
      statusCounts[promo.status] = (statusCounts[promo.status] || 0) + 1
      savingsByCode.set(promo.id, { 'code': promo.code, 'savings': 0 })

      promo.usages.forEach(usage => {
        const usageDate = new Date(usage.createdAt)
        const monthKey = `${usageDate.getFullYear()}-${String(usageDate.getMonth() + 1).padStart(2, '0')}`
        const trendPoint = trendByMonth.get(monthKey) || {
          'label': usageDate.toLocaleString('en-US', { 'month': 'short', 'year': 'numeric' }),
          'usageCount': 0,
          'savingsAmount': 0
        }

        trendPoint.usageCount += 1
        trendPoint.savingsAmount += usage.discountGiven
        trendByMonth.set(monthKey, trendPoint)

        const codeSavings = savingsByCode.get(promo.id)
        codeSavings.savings += usage.discountGiven
      })
    })

    const totalCodes = promoCodes.length
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      'percentage': totalCodes ? Number(((count / totalCodes) * 100).toFixed(1)) : 0
    }))

    const allCodesPerformance = promoCodes.map(promo => {
      const savings = savingsByCode.get(promo.id).savings
      const totalUses = promo.usageLimit

      return {
        'id': promo.id,
        'code': promo.code,
        'discountScope': promo.discountScope,
        'discountValue': promo.discountValue,
        'maxDiscountValue': promo.maxDiscountValue,
        'redeemedCount': promo.usages.length,
        'totalUses': totalUses,
        'usagePercentage': 0 < totalUses ? Number(((promo.usages.length / totalUses) * 100).toFixed(1)) : null,
        'savingsGiven': Number(savings.toFixed(2)),
        'status': promo.status
      }
    })

    const savingsDistribution = [...savingsByCode.values()]
      .filter(item => 0 < item.savings)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5)

    const topPerformingCodes = [...promoCodes]
      .filter(promo => 0 < promo.usages.length)
      .sort((a, b) => b.usages.length - a.usages.length)
      .slice(0, 5)
      .map(promo => ({
        'id': promo.id,
        'code': promo.code,
        'uses': promo.usages.length,
        'status': promo.status
      }))

    const redemptionTrend = [...trendByMonth.entries()]
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([, trendPoint]) => ({
        ...trendPoint,
        'savingsAmount': Number(trendPoint.savingsAmount.toFixed(2))
      }))

    return {
      trendGrowthPercentage,
      redemptionTrend,
      'savingsDistribution': savingsDistribution.map(item => ({
        ...item,
        'savings': Number(item.savings.toFixed(2))
      })),
      topPerformingCodes,
      statusBreakdown,
      allCodesPerformance
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to fetch promo code analytics.', dateFilter, error },
        functionName
      )
    }

    throw error
  }
}
