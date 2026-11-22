import { generateBase64Export } from "../../../../dyna_modules/Utils/index";

// 1. Same Date Filter helper from GetTransactions
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
        filterStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
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

export default async (__, { filters = {}, format }, Context) => {
  const _functionName = "Routes -> Transactions -> Query -> ExportTransactions";

  try {
    if (Context && Context.isContext) {
      await Context.Debug({ message: "Exporting Transactions", filters, format }, _functionName);
    }

    // 2. Build dynamic Prisma 'where' conditions exactly like GetTransactions
    const where = {
      isDeleted: false,
      RfidTag__fk__: { not: null },
    };

    // Filter by Fleet Owner (Client) ID
    if (filters.clientId) {
      where.RfidTag = {
        fleetOwner__fk__: filters.clientId,
        isDeleted: false,
      };
    }

    // Filter by Charging Hub & City & Station ID
    if (filters.chargingHub || filters.city || filters.stationId) {
      const stationCondition = {
        isDeleted: false,
      };

      if (filters.stationId) {
        stationCondition.id = filters.stationId;
      }

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

    // Filter by Charger ID
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

    // Global Search
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

    // 3. Query Database (No pagination limits for export)
    const sessions = await Context.DataBase.chargingSession.findMany({
      where,
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
    });

    // 4. Format Data for Export matching UI columns
    const exportData = sessions.map((session, index) => {
      const txn = session.Transaction;
      const charger = session.Charger;
      const station = charger?.ChargingStation;
      const fleet = session.RfidTag?.fleetOwner;

      const displayTxnId = txn?.gatewayTxnId || `TXN-${session.id.slice(-3).toUpperCase()}`;
      const amountVal = txn?.amount ? Number(txn.amount) : Number(session.totalAmount || 0);
      const status = txn?.status || (session.status === "COMPLETED" ? "SUCCESSFUL" : session.status);

      return {
        sNo: index + 1,
        txnId: displayTxnId,
        date: session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-GB") : "N/A",
        clientName: fleet?.ownerName || "N/A",
        chargingHub: station?.name || "N/A",
        city: station?.city ? `${station.city}, ${station.state || ""}` : "N/A",
        amount: "Rs. " + amountVal.toFixed(2),
        status: status,
      };
    });

    // 5. Define Columns for Excel/PDF
    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Transaction ID", key: "txnId", width: 22 },
      { header: "Date", key: "date", width: 14 },
      { header: "Client Name", key: "clientName", width: 22 },
      { header: "Charging Hub", key: "chargingHub", width: 22 },
      { header: "City", key: "city", width: 18 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];

    // 6. Generate File using our existing Universal Helper
    const fileFormat = format.toUpperCase();
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      "Transactions Report",
    );

    // 7. Return response
    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const mimeType =
      fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    return { 
      base64String,
      fileName: `Transactions_Export_${new Date().getTime()}.${extension}`,
      mimeType,
    };
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error);
    throw new Error("Failed to export transactions.");
  }
};