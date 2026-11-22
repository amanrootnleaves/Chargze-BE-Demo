import _ from "underscore";

// Growth calculate karne ka helper function (Divide by zero se bachne ke liye)
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

export default async (parent, args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Admin -> AdminCustomerKPIStats";

      await Context.Debug(
        { message: "Calculating Admin Customer KPI Stats..." },
        _functionName,
      );

      // 1. Date Ranges Setup (Current Month vs Last Month)
      const now = new Date();

      // Current Month: 1st date of this month to NOW
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );

      // Last Month: 1st date of last month to Last date of last month
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      // ==========================================
      // 2. FETCH CURRENT MONTH DATA
      // ==========================================

      // A. Total Customers (Current Month)
      const currentCustomersCount =
        await Context.DataBase.customerProfile.count({
          where: { isDeleted: false, createdAt: { gte: startOfCurrentMonth } },
        });

      // B. App Downloads (Assuming Account ya Customer creation se map hota hai)
      const currentAppDownloads = await Context.DataBase.account.count({
        where: { isDeleted: false, createdAt: { gte: startOfCurrentMonth } },
      });

      // C. Sessions Metrics (Energy, Revenue, Refund) - Current Month
      const currentSessionsStats =
        await Context.DataBase.chargingSession.aggregate({
          _sum: {
            energyConsumed: true, // DB field name check karlena
            totalAmount: true, // DB field name check karlena
          },
          where: { createdAt: { gte: startOfCurrentMonth }, isDeleted: false },
        });

      // D. Refund Amount (Current Month) - Assuming status is REFUNDED ya koi refund field hai
      const currentRefundStats = await Context.DataBase.transaction.aggregate({
        _sum: { refundAmount: true },
        where: {
          createdAt: { gte: startOfCurrentMonth },
          isDeleted: false,
        },
      });
      // ==========================================
      // 3. FETCH LAST MONTH DATA (For Growth)
      // ==========================================

      const lastCustomersCount = await Context.DataBase.customerProfile.count({
        where: {
          isDeleted: false,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      });

      const lastAppDownloads = await Context.DataBase.account.count({
        where: {
          isDeleted: false,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      });

      const lastSessionsStats =
        await Context.DataBase.chargingSession.aggregate({
          _sum: { energyConsumed: true, totalAmount: true },
          where: {
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            isDeleted: false,
          },
        });

      const lastRefundStats = await Context.DataBase.transaction.aggregate({
        _sum: { refundAmount: true },
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          isDeleted: false,
        },
      });

      // ==========================================
      // NEW: FETCH LIFETIME TOTALS (For Main UI Numbers)
      // ==========================================
      const totalCustomersCount = await Context.DataBase.customerProfile.count({
        where: { isDeleted: false },
      });

      const totalAppDownloads = await Context.DataBase.account.count({
        where: { isDeleted: false },
      });

      const totalSessionsStats =
        await Context.DataBase.chargingSession.aggregate({
          _sum: { energyConsumed: true, totalAmount: true },
          where: { isDeleted: false },
        });

      const totalRefundStats = await Context.DataBase.transaction.aggregate({
        _sum: { refundAmount: true },
        where: { isDeleted: false },
      });
      // ==========================================
      // 4. DATA FORMATTING & GROWTH CALCULATION
      // ==========================================

      // Extract raw values (handle nulls if aggregate returns empty)
      const currentEnergy = Number(
        currentSessionsStats._sum.energyConsumed || 0,
      );
      const lastEnergy = Number(lastSessionsStats._sum.energyConsumed || 0);

      const currentRevenue = Number(currentSessionsStats._sum.totalAmount || 0);
      const lastRevenue = Number(lastSessionsStats._sum.totalAmount || 0);

      const currentRefund = Number(currentRefundStats._sum.refundAmount || 0);
      const lastRefund = Number(lastRefundStats._sum.refundAmount || 0);

      // Extract Lifetime values (For Main Numbers)
      const lifetimeEnergy = Number(
        totalSessionsStats._sum.energyConsumed || 0,
      );
      const lifetimeRevenue = Number(totalSessionsStats._sum.totalAmount || 0);
      const lifetimeRefund = Number(totalRefundStats._sum.refundAmount || 0);

      // Prepare Final Output
      const _kpiStats = {
        // Main Values -> LIFETIME
        totalCustomers: totalCustomersCount,
        totalCustomersGrowth: calculateGrowth(
          currentCustomersCount,
          lastCustomersCount,
        ),

        appDownloaded: totalAppDownloads,
        appDownloadedGrowth: calculateGrowth(
          currentAppDownloads,
          lastAppDownloads,
        ),

        totalEnergyKw: lifetimeEnergy,
        totalEnergyGrowth: calculateGrowth(currentEnergy, lastEnergy),

        refundAmount: lifetimeRefund,
        refundAmountGrowth: calculateGrowth(currentRefund, lastRefund),

        totalRevenue: lifetimeRevenue,
        totalRevenueGrowth: calculateGrowth(currentRevenue, lastRevenue),
      };

      await Context.Debug(
        { message: "Successfully calculated KPI Stats" },
        _functionName,
      );

      return _kpiStats;
    }

    return new Error("MISSING_CONTEXT");
  } catch (error) {
    console.error(error);
    return error;
  }
};
