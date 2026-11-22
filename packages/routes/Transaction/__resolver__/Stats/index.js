
import _ from "underscore";

export default async (__, _, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Transaction -> Stats";
      await Context.Debug({ message: "Fetching transaction stats.." }, _functionName);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);

      const calculatePercentage = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const currentStats = await Context.DataBase.transaction.aggregate({
        where: {
          isDeleted: false,
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const currentSuccessCount = await Context.DataBase.transaction.count({
        where: { isDeleted: false, status: "SUCCESS", createdAt: { gte: sevenDaysAgo } },
      });

      const currentPendingCount = await Context.DataBase.transaction.count({
        where: { isDeleted: false, status: "PENDING", createdAt: { gte: sevenDaysAgo } },
      });

      const currentFailedCount = await Context.DataBase.transaction.count({
        where: { 
            isDeleted: false, 
            OR: [
                { status: "FAILED" },
                { status: "CANCELLED" }
            ],
            createdAt: { gte: sevenDaysAgo } 
        },
      });

      const prevStats = await Context.DataBase.transaction.aggregate({
        where: {
          isDeleted: false,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
        _sum: { amount: true },
      });

      const prevSuccessCount = await Context.DataBase.transaction.count({
        where: { isDeleted: false, status: "SUCCESS", createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      });

      const prevPendingCount = await Context.DataBase.transaction.count({
        where: { isDeleted: false, status: "PENDING", createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      });

      const prevFailedCount = await Context.DataBase.transaction.count({
        where: { 
            isDeleted: false, 
            OR: [
                { status: "FAILED" },
                { status: "CANCELLED" }
            ],
            createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } 
        },
      });

      const totalRevenue = parseFloat(currentStats._sum.amount || 0);
      const prevRevenue = parseFloat(prevStats._sum.amount || 0);

      return {
        totalRevenue,
        completedTransactions: currentSuccessCount,
        pendingTransactions: currentPendingCount,
        failedTransactions: currentFailedCount,
        totalRevenuePercentage: calculatePercentage(totalRevenue, prevRevenue),
        completedTransactionsPercentage: calculatePercentage(currentSuccessCount, prevSuccessCount),
        pendingTransactionsPercentage: calculatePercentage(currentPendingCount, prevPendingCount),
        failedTransactionsPercentage: calculatePercentage(currentFailedCount, prevFailedCount),
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
