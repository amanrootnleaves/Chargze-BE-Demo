export default async (__, { filters = {} }, Context) => {
  const _functionName = "Routes -> Transactions -> Query -> GetTransactionsKPIs";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Transactions KPIs", filters },
        _functionName
      );
    }

    // Base filter: Only Fleet RFID sessions
    const baseWhere = {
      isDeleted: false,
      RfidTag__fk__: { not: null },
    };

    if (filters.fleetOwnerId) {
      baseWhere.RfidTag = { fleetOwner__fk__: filters.fleetOwnerId, isDeleted: false };
    }

    // Filter by Charging Hub & City (Charger -> ChargingStation relation)
    if (filters.chargingHub || filters.city || filters.stationId) {
      const stationCondition = {
        isDeleted: false,
      };

      if (filters.stationId) {
        stationCondition.id = filters.stationId;
      }

      if (filters.chargingHub && filters.chargingHub.trim()) {
        stationCondition.name = {
          contains: filters.chargingHub.trim(),
          mode: "insensitive",
        };
      }

      if (filters.city && filters.city.trim()) {
        stationCondition.city = {
          contains: filters.city.trim(),
          mode: "insensitive",
        };
      }

      baseWhere.Charger = {
        ...(baseWhere.Charger || {}),
        ChargingStation: stationCondition,
      };
    }

    if (filters.chargerId) {
      baseWhere.Charger__fk__ = filters.chargerId;
    }

    if (filters.startDate || filters.endDate) {
      baseWhere.createdAt = {};
      if (filters.startDate) baseWhere.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) baseWhere.createdAt.lte = new Date(filters.endDate);
    }

    // Parallel execution for 5 KPI cards
    const [totalTransactions, activeNow, completed, failed, revenueAggregate] = await Promise.all([
      // Card 1: Total Transactions
      Context.DataBase.chargingSession.count({
        where: baseWhere,
      }),

      // Card 2: Active Now (In-progress sessions)
      Context.DataBase.chargingSession.count({
        where: {
          ...baseWhere,
          status: "IN_PROGRESS",
        },
      }),

      // Card 3: Completed (Transaction STATUS is SUCCESS)
      Context.DataBase.chargingSession.count({
        where: {
          ...baseWhere,
          Transaction: {
            isDeleted: false,
            status: "SUCCESS",
          },
        },
      }),

      // Card 4: Failed (Transaction STATUS is FAILED)
      Context.DataBase.chargingSession.count({
        where: {
          ...baseWhere,
          Transaction: {
            isDeleted: false,
            status: "FAILED",
          },
        },
      }),

      // Card 5: Total Revenue (Sum of successful amounts)
      Context.DataBase.transaction.aggregate({
        where: {
          isDeleted: false,
          status: "SUCCESS",
          ChargingSession: baseWhere,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalRevenue = revenueAggregate?._sum?.amount
      ? Number(revenueAggregate._sum.amount)
      : 0;

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Transactions KPIs computed successfully",
          totalTransactions,
          activeNow,
          completed,
          failed,
          totalRevenue,
        },
        _functionName
      );
    }

    return {
      totalTransactions,
      activeNow,
      completed,
      failed,
      totalRevenue,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in GetTransactionsKPIs", error: error.message },
        _functionName
      );
    }
    throw error;
  }
};