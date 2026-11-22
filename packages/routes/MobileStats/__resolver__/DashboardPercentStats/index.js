import { TRANSACTION_STATUS } from "@prisma/client";

export default async (_, __, Context) => {
  const _functionName =
    "Routes -> MobileStats -> Resolver -> DashboardPercentStats";

  try {
    if (Context && Context.isContext) {
      Context.Debug({ message: "Fetching DashboardStats" }, _functionName);
      const now = new Date();
      const currentWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousWindowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const previousWindowEnd = currentWindowStart;

      // ⚡ Charging Sessions
      const currentSessions = await Context.DataBase.chargingSession.count({
        where: {
          isDeleted: false,
          startTime: { gte: currentWindowStart },
        },
      });

      const previousSessions = await Context.DataBase.chargingSession.count({
        where: {
          isDeleted: false,
          startTime: { gte: previousWindowStart, lt: previousWindowEnd },
        },
      });

      const sessionsChange =
        previousSessions > 0
          ? ((currentSessions - previousSessions) / previousSessions) * 100
          : 0;

      // 💰 Revenue
      const currentRevenue = await Context.DataBase.transaction.aggregate({
        _sum: { amount: true },
        where: {
          isDeleted: false,
          status:TRANSACTION_STATUS.SUCCESS,
          createdAt: { gte: currentWindowStart },
        },
      });

      const previousRevenue = await Context.DataBase.transaction.aggregate({
        _sum: { amount: true },
        where: {
          isDeleted: false,
          createdAt: { gte: previousWindowStart, lt: previousWindowEnd },
        },
      });

      const revenueChange =
        previousRevenue._sum.amount > 0
          ? ((currentRevenue._sum.amount - previousRevenue._sum.amount) /
              previousRevenue._sum.amount) *
            100
          : 0;

      // 🔋 Energy
      const currentEnergy = await Context.DataBase.chargingSession.aggregate({
        _sum: { energyConsumed: true },
        where: {
          isDeleted: false,
          startTime: { gte: currentWindowStart },
        },
      });

      const previousEnergy = await Context.DataBase.chargingSession.aggregate({
        _sum: { energyConsumed: true },
        where: {
          isDeleted: false,
          startTime: { gte: previousWindowStart, lt: previousWindowEnd },
        },
      });

      const energyChange =
        previousEnergy._sum.energyConsumed > 0
          ? ((currentEnergy._sum.energyConsumed -
              previousEnergy._sum.energyConsumed) /
              previousEnergy._sum.energyConsumed) *
            100
          : 0;
         
      return {
        metrics: [
          {
            key: "chargingSession",
            changePercent: sessionsChange,
          },
          {
            key: "totalRevenue",
            changePercent: revenueChange,
          },
          {
            key: "totalEnergy",
            changePercent: energyChange,
          },
        ],
      };
    }
  } catch (error) {
    Context.Debug({ message: "Unable to fetch DashboardStats" }, _functionName);
    throw error;
  }
};
