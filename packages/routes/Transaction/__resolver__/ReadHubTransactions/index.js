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
export default async (__, { page = 1, limit = 10, filters = {} }, Context) => {
  const _functionName = "Routes -> Transactions -> Query -> GetTransactions";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Fleet Hub Transactions", page, limit, filters },
        _functionName,
      );
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const take = Math.max(1, limit);

    // 1. Build dynamic Prisma 'where' conditions
    const where = {
      isDeleted: false,
      // Fleet-only transactions: RFID tag mapped hona mandatory hai
      RfidTag__fk__: { not: null },
    };

    // Filter by Fleet Owner (Client)
    if (filters.clientId) {
      where.RfidTag = {
        fleetOwner__fk__: filters.clientId,
        isDeleted: false,
      };
    }

    // Filter by Charging Hub & City (Charger -> ChargingStation relation)
    if (filters.chargingHub || filters.city || filters.stationId) {
      const stationCondition = {
        isDeleted: false,
      };

      if (filters.stationId) {
        stationCondition.id = filters.stationId;
      }

      // if (filters.chargingHub && filters.chargingHub.trim()) {
      //   stationCondition.name = {
      //     contains: filters.chargingHub.trim(),
      //     mode: "insensitive",
      //   };
      // }
      if (filters.chargingHub) {
        stationCondition.id = filters.chargingHub;
      }

      if (filters.city && filters.city.trim()) {
        stationCondition.city = {
          contains: filters.city.trim(),
          mode: "insensitive",
        };
      }

      where.Charger = {
        ...(where.Charger || {}),
        ChargingStation: stationCondition,
      };
    }

    // Filter by Status
    if (filters.status) {
      where.Transaction = {
        ...(where.Transaction || {}),
        status: filters.status,
      };
    }

    // Filter by Date Range
    const createdAtFilter = _getCreatedAtFilter(filters.dateFilter);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    // Filter by Charger ID (Supports DB foreign key ID as well as display box/charging IDs)
    if (filters.chargerId && filters.chargerId.trim()) {
      const cId = filters.chargerId.trim();

      where.Charger = {
        ...(where.Charger || {}),
        OR: [
          { id: cId },
          { chargingId: { equals: cId, mode: "insensitive" } },
          { chargeboxId: { equals: cId, mode: "insensitive" } },
          { name: { contains: cId, mode: "insensitive" } },
        ],
      };
    }

    // Global Search (Txn ID, Client Name, Charger ID / Charging ID / Box ID / Name)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      where.OR = [
        {
          Transaction: {
            gatewayTxnId: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          RfidTag: {
            fleetOwner: {
              ownerName: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
        {
          Charger: {
            OR: [
              { chargeboxId: { contains: searchTerm, mode: "insensitive" } },
              { chargingId: { contains: searchTerm, mode: "insensitive" } },
              { name: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Prisma Query Where Clause Built",
          whereClause: JSON.stringify(where),
        },
        _functionName,
      );
    }

    // 2. Query Database with count & data in parallel
    const [totalCount, sessions] = await Promise.all([
      Context.DataBase.chargingSession.count({ where }),
      Context.DataBase.chargingSession.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          Transaction: true,
          Connector: true,
          Charger: {
            include: {
              ChargingStation: true,
            },
          },
          RfidTag: {
            include: {
              fleetOwner: true,
            },
          },
        },
      }),
    ]);

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Transactions retrieved successfully",
          count: sessions.length,
          totalCount,
        },
        _functionName,
      );
    }

    // 3. Map records to Figma UI Table columns
    const nodes = sessions.map((session) => {
      const txn = session.Transaction;
      const charger = session.Charger;
      const station = charger?.ChargingStation;
      const rfid = session.RfidTag;
      const fleet = rfid?.fleetOwner;
      const connector = session.Connector;

      // Display Txn ID: gatewayTxnId ya formatted ID fallback
      const displayTxnId =
        txn?.gatewayTxnId || `TXN-${session.id.slice(-3).toUpperCase()}`;

      // Payment Type mapping
      const paymentType = txn?.type || "RFID";

      // Status mapping
      const status =
        txn?.status ||
        (session.status === "COMPLETED" ? "SUCCESSFUL" : session.status);

      return {
        id: session.id,
        txnId: displayTxnId,
        clientName: fleet?.ownerName || "N/A",
        chargingHub: station?.name || "N/A",
        clientId: fleet?.id || rfid?.fleetOwner__fk__ || null,
        chargingHubId: station?.id || null,
        city: station?.city ? `${station.city}, ${station.state || ""}` : "N/A",
        chargerId:
          charger?.chargeboxId || charger?.chargingId || charger?.name || "N/A",
        chargingType: charger?.chargingType || "DC",
        connectorId: connector?.name || "CID-01",
        paymentType: session.RfidTag__fk__ ? "RFID" : txn?.gateway || "UPI",
        energyConsumed: session.energyConsumed
          ? Number(session.energyConsumed)
          : 0,
        refundAmount: txn?.refundAmount ? Number(txn.refundAmount) : 0,
        amountPaid: txn?.amount
          ? Number(txn.amount)
          : Number(session.totalAmount || 0),
        status: status,
        invoiceUrl: txn?.invoiceUrl || null,
        createdAt: session.createdAt,
      };
    });

    return {
      nodes,
      totalCount,
      page,
      limit,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in GetTransactions", error: error.message },
        _functionName,
      );
    }
    throw error;
  }
};
