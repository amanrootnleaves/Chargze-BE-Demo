const _getCreatedAtFilter = (dateFilter) => {
  if (!dateFilter) {
    return undefined;
  }

  const { period, startDate, endDate } = dateFilter;

  if (period && (startDate || endDate)) {
    throw new Error("INVALID_DATE_FILTER");
  }

  if (!period && (!startDate || !endDate)) {
    throw new Error("INVALID_DATE_FILTER");
  }

  if (period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filterStartDate = new Date(today);

    switch (period) {
      case "TODAY":
        break;

      case "WEEK":
        filterStartDate.setDate(filterStartDate.getDate() - 6);
        break;

      case "MONTH":
        filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;

      case "HALF_YEAR":
        filterStartDate = new Date(
          today.getFullYear(),
          today.getMonth() - 5,
          1,
        );
        break;

      case "YEAR":
        filterStartDate = new Date(today.getFullYear(), 0, 1);
        break;

      default:
        throw new Error("INVALID_DATE_FILTER");
    }

    return {
      gte: filterStartDate,
      lt: tomorrow,
    };
  }

  const filterStartDate = new Date(startDate);
  const filterEndDate = new Date(endDate);

  if (
    Number.isNaN(filterStartDate.getTime()) ||
    Number.isNaN(filterEndDate.getTime()) ||
    filterStartDate > filterEndDate
  ) {
    throw new Error("INVALID_DATE_FILTER");
  }

  filterStartDate.setHours(0, 0, 0, 0);
  filterEndDate.setHours(23, 59, 59, 999);

  return {
    gte: filterStartDate,
    lte: filterEndDate,
  };
};

export default async (__, { skip = 0, take = 10, filter }, Context) => {
  const _functionName = "Routes -> FleetHubInvoice -> Query -> FleetHubInvoices";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching Fleet Hub Invoices with UI metrics.",
          skip,
          take,
          filter,
        },
        _functionName,
      );
    }

    // 1. Where clause for invoices
    const whereClause = { isDeleted: false };

    if (filter) {
      const { search, fleetOwnerId, chargingStationId, status, dateFilter } = filter;

      // Date Filter Integration (FleetHubInvoice.createdAt)
      const createdAtFilter = _getCreatedAtFilter(dateFilter);
      if (createdAtFilter) {
        whereClause.createdAt = createdAtFilter;
      }

      // Search by Invoice ID or Fleet Owner Name
      if (search && search.trim() !== "") {
        const query = search.trim();
        whereClause.OR = [
          { invoiceNumber: { contains: query, mode: "insensitive" } },
          {
            fleetOwner: {
              ownerName: { contains: query, mode: "insensitive" },
            },
          },
        ];
      }

      // Dropdown Filters: Client (FleetOwner) & Station
      if (fleetOwnerId && fleetOwnerId.trim() !== "") {
        whereClause.fleetOwner__fk__ = fleetOwnerId.trim();
      }

      if (chargingStationId && chargingStationId.trim() !== "") {
        whereClause.chargingStation__fk__ = chargingStationId.trim();
      }

      // Status Filter: PENDING / PAID / OVERDUE
      if (status && status.trim() !== "") {
        whereClause.status = status.trim();
      }
    }

    // Month boundary dates for Growth Percentage calculation
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 2. Parallel queries: Paginated list, Total count, Raw metrics, and Month comparison counts
    const [
      totalCount,
      invoicesData,
      allInvoicesForMetrics,
      currentMonthCount,
      lastMonthCount,
    ] = await Promise.all([
      Context.DataBase.fleetHubInvoice.count({ where: whereClause }),
      Context.DataBase.fleetHubInvoice.findMany({
        where: whereClause,
        skip: Number(skip) || 0,
        take: Number(take) || 10,
        orderBy: { createdAt: "desc" },
        include: {
          fleetOwner: true,
          chargingStation: true,
          chargingSessions: {
            select: { id: true }
          }
        },
      }),
      Context.DataBase.fleetHubInvoice.findMany({
        where: { isDeleted: false },
        select: {
          status: true,
          totalAmount: true,
        },
      }),
      Context.DataBase.fleetHubInvoice.count({
        where: {
          isDeleted: false,
          createdAt: { gte: currentMonthStart },
        },
      }),
      Context.DataBase.fleetHubInvoice.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // 3. Calculate Growth Percentage (Total Invoices card)
    let growthPercentage = 0;
    if (lastMonthCount === 0) {
      growthPercentage = currentMonthCount > 0 ? 100.0 : 0.0;
    } else {
      growthPercentage = Number(
        (((currentMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1),
      );
    }

    // 4. Calculate Top Cards Summary (Total, Paid, Pending, Overdue)
    const metrics = {
      totalInvoices: allInvoicesForMetrics.length,
      growthPercentage,
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    };

    allInvoicesForMetrics.forEach((inv) => {
      const amount = Number(inv.totalAmount || 0);

      if (inv.status === "PAID") {
        metrics.paid.count += 1;
        metrics.paid.amount += amount;
      } else if (inv.status === "PENDING") {
        metrics.pending.count += 1;
        metrics.pending.amount += amount;
      } else if (inv.status === "OVERDUE") {
        metrics.overdue.count += 1;
        metrics.overdue.amount += amount;
      }
    });

    metrics.paid.amount = Number(metrics.paid.amount.toFixed(2));
    metrics.pending.amount = Number(metrics.pending.amount.toFixed(2));
    metrics.overdue.amount = Number(metrics.overdue.amount.toFixed(2));

    // 5. Map Items for Response
    const items = invoicesData.map((inv) => ({
      ...inv,
      totalSessions: inv.totalSessions,
      totalEnergy: Number(inv.totalEnergy || 0),
      subtotal: Number(inv.subtotal || 0),
      gstAmount: Number(inv.gstAmount || 0),
      totalAmount: Number(inv.totalAmount || 0),
      fleetName: inv.fleetOwner?.ownerName || "N/A",
      chargingHub: inv.chargingStation?.name || "N/A",
      FleetOwner: inv.fleetOwner,
      ChargingStation: inv.chargingStation,
      sessionId: inv.chargingSessions && inv.chargingSessions.length > 0 
                 ? inv.chargingSessions[0].id 
                 : null,
    }));

    const response = {
      items,
      totalCount,
      metrics,
    };

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fleet Hub Invoices fetched successfully.", totalCount, growthPercentage },
        _functionName,
      );
    }

    return response;
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};