// Standard Date Filter Helper (Timezone & Range Safe)
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

export default async (parent, { filters = {} }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> GetRfidTagTransactions";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching transactions by RFID tag with summary metrics.", filters },
        _functionName
      );
    }

    const { rfidTagId, page = 1, limit = 20, dateFilter } = filters;

    if (!rfidTagId) {
      throw new Error("RFID_TAG_ID_REQUIRED");
    }

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);

    const where = {
      isDeleted: false,
      RfidTag__fk__: rfidTagId,
    };

    // Apply accurate date filter helper
    const createdAtFilter = _getCreatedAtFilter(dateFilter);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    // 1. Fetch RfidTag details to get current live balance
    const rfidTag = await Context.DataBase.rfidTag.findUnique({
      where: { id: rfidTagId },
    });

    if (!rfidTag) {
      throw new Error("RFID_TAG_NOT_FOUND");
    }

    // 2. Fetch all matching transactions for Summary Cards calculation
    const allMatchingTxns = await Context.DataBase.transaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
      },
    });

    let totalCredits = 0;
    let totalDebit = 0;

    allMatchingTxns.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "CREDIT" || tx.type === "TOPUP" || amt < 0) {
        totalCredits += Math.abs(amt);
      } else {
        totalDebit += Math.abs(amt);
      }
    });

    // 3. Fetch paginated records with complete ChargingSession, Charger & Station relation
    const [totalCount, records] = await Promise.all([
      Context.DataBase.transaction.count({ where }),
      Context.DataBase.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          ChargingSession: {
            include: {
              Charger: {
                include: {
                  ChargingStation: true,
                },
              },
              Connector: true,
            },
          },
        },
      }),
    ]);

    // 4. Map DB records to exact GraphQL Schema response structure
    const nodes = records.map((record) => {
      const session = record.ChargingSession;

      return {
        id: record.id,
        gatewayTxnId: record.gatewayTxnId || `TXN-${record.id.slice(-4)}`,
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
        updatedAt: record.updatedAt ? new Date(record.createdAt).toISOString() : null,
        amount: record.amount ? Number(record.amount) : 0,
        refundAmount: record.refundAmount ? Number(record.refundAmount) : 0,
        balanceAmount: record.balanceAmount ? Number(record.balanceAmount) : Number(rfidTag.balanceAmount || 0),
        currency: record.currency || "INR",
        status: record.status,
        type: record.type,
        invoiceUrl: record.invoiceUrl || null,
        chargingSession: session
          ? {
              id: session.id,
              status: session.status,
              energyConsumed: session.energyConsumed ? Number(session.energyConsumed) : 0,
              totalAmount: session.totalAmount ? Number(session.totalAmount) : 0,
              startTime: session.startTime,
              endTime: session.endTime,
              Charger: session.Charger,
              Connector: session.Connector,
            }
          : null,
      };
    });

    return {
      summary: {
        totalCredits,
        totalDebit,
        currentBalance: Number(rfidTag.balanceAmount || 0),
      },
      nodes,
      totalCount,
      totalPages: Math.ceil(totalCount / take) || 1,
      currentPage: page,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to fetch RFID tag transactions.", filters, error },
        _functionName
      );
    }
    throw error;
  }
};