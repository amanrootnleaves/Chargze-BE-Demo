const _getCreatedAtFilter = (dateFilter) => {
  if (!dateFilter) return undefined;
  const { period, startDate, endDate } = dateFilter;
  if (period && (startDate || endDate)) throw new Error("INVALID_DATE_FILTER");
  if (!period && (!startDate || !endDate)) throw new Error("INVALID_DATE_FILTER");

  if (period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let filterStartDate = new Date(today);

    switch (period) {
      case "TODAY": break;
      case "WEEK": filterStartDate.setDate(filterStartDate.getDate() - 6); break;
      case "MONTH": filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case "HALF_YEAR": filterStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); break;
      case "YEAR": filterStartDate = new Date(today.getFullYear(), 0, 1); break;
      default: throw new Error("INVALID_DATE_FILTER");
    }
    return { gte: filterStartDate, lt: tomorrow };
  }

  const filterStartDate = new Date(startDate);
  const filterEndDate = new Date(endDate);
  if (Number.isNaN(filterStartDate.getTime()) || Number.isNaN(filterEndDate.getTime()) || filterStartDate > filterEndDate) {
    throw new Error("INVALID_DATE_FILTER");
  }
  filterStartDate.setHours(0, 0, 0, 0);
  filterEndDate.setHours(23, 59, 59, 999);
  return { gte: filterStartDate, lte: filterEndDate };
};

const _getPrevPeriodFilter = (dateFilter) => {
  if (!dateFilter || !dateFilter.period) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const period = dateFilter.period;
  let prevStart = new Date(today);
  let prevEnd = new Date(today);

  switch (period) {
    case "TODAY":
      prevStart.setDate(today.getDate() - 1);
      prevEnd = new Date(prevStart);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case "WEEK":
      prevStart.setDate(today.getDate() - 13);
      prevEnd = new Date(today);
      prevEnd.setDate(today.getDate() - 7);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case "MONTH":
      prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      break;

    case "HALF_YEAR":
      prevStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth() - 5, 0, 23, 59, 59, 999);
      break;

    case "YEAR":
      // Previous Calendar Year (e.g., 2025 if current year is 2026)
      prevStart = new Date(today.getFullYear() - 1, 0, 1);
      prevEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;

    default:
      return undefined;
  }

  return { gte: prevStart, lte: prevEnd };
};
export default async (parent, { dateFilter }, Context) => {
  const _functionName = "Routes -> PromoCode -> Query -> GetPromoCodeKPIs";

  try {
    if (Context && Context.isContext) {
      await Context.Debug({ message: "Fetching promo code KPIs.", dateFilter }, _functionName);
    }

    const currentCreatedAtFilter = _getCreatedAtFilter(dateFilter);
    const prevCreatedAtFilter = _getPrevPeriodFilter(dateFilter);

    const currentWhere = currentCreatedAtFilter ? { createdAt: currentCreatedAtFilter } : {};
    const prevWhere = prevCreatedAtFilter ? { createdAt: prevCreatedAtFilter } : {};

    const [
      totalCoupons,
      prevTotalCoupons,
      totalUses,
      prevTotalUses,
      currentUsageStats,
      prevUsageStats,
      currentCodesCount,
      prevCodesCount
    ] = await Promise.all([
      Context.DataBase.promoCode.count({ where: currentWhere }),
      Context.DataBase.promoCode.count({ where: prevWhere }),
      Context.DataBase.promoCodeUsage.count({ where: currentWhere }),
      Context.DataBase.promoCodeUsage.count({ where: prevWhere }),
      Context.DataBase.promoCodeUsage.aggregate({
        where: currentWhere,
        _avg: { discountGiven: true },
      }),
      Context.DataBase.promoCodeUsage.aggregate({
        where: prevWhere,
        _avg: { discountGiven: true },
      }),
      Context.DataBase.promoCode.count(),
      Context.DataBase.promoCode.count({ where: prevWhere }),
    ]);

    const [currentUsagesWithTx, prevUsagesWithTx] = await Promise.all([
      Context.DataBase.promoCodeUsage.findMany({
        where: currentWhere,
        include: { Transaction: true },
      }),
      Context.DataBase.promoCodeUsage.findMany({
        where: prevWhere,
        include: { Transaction: true },
      }),
    ]);

    let totalRevenue = 0;
    currentUsagesWithTx.forEach((u) => { 
      if (u.Transaction?.amount) totalRevenue += Number(u.Transaction.amount); 
    });

    let prevRevenue = 0;
    prevUsagesWithTx.forEach((u) => { 
      if (u.Transaction?.amount) prevRevenue += Number(u.Transaction.amount); 
    });

    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100.0 : 0.0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    const totalCouponsGrowth = calculateGrowth(totalCoupons, prevTotalCoupons);
    const totalRevenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
    const totalUsesGrowth = calculateGrowth(totalUses, prevTotalUses);
    
    const avgDiscount = currentUsageStats._avg.discountGiven ? Number(currentUsageStats._avg.discountGiven.toFixed(2)) : 0.0;
    const prevAvgDiscount = prevUsageStats._avg.discountGiven ? Number(prevUsageStats._avg.discountGiven.toFixed(2)) : 0.0;
    const avgDiscountGrowth = calculateGrowth(avgDiscount, prevAvgDiscount);

    const conversionRate = currentCodesCount > 0 ? Number(((totalUses / currentCodesCount) * 100).toFixed(2)) : 0.0;
    const prevConversionRate = prevCodesCount > 0 ? Number(((prevTotalUses / prevCodesCount) * 100).toFixed(2)) : 0.0;
    const conversionRateGrowth = calculateGrowth(conversionRate, prevConversionRate);

    // Returning all fields matching your exact PromoCodeKPIData schema
    return {
      totalCoupons,
      totalCouponsGrowth,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalRevenueGrowth,
      totalUses,
      totalUsesGrowth,
      avgDiscount,
      avgDiscountGrowth,
      conversionRate,
      conversionRateGrowth,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug({ message: "Failed to fetch KPIs.", dateFilter, error }, _functionName);
    }
    throw error;
  }
};