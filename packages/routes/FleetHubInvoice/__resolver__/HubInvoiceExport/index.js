import { generateBase64Export } from "../../../../dyna_modules/Utils/index"; // Apne helper file ka sahi path dena
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

export default async (__, { filter, format }, Context) => {
  const _functionName =
    "Routes -> FleetHubInvoice -> Query -> exportFleetHubInvoices";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Exporting Fleet Hub Invoices", filter, format },
        _functionName,
      );
    }

    // 1. Same Where Clause as List API
    const whereClause = { isDeleted: false };

    if (filter) {
      const { search, fleetOwnerId, chargingStationId, status, dateFilter } =
        filter;

      // Date Filter
      const createdAtFilter =
        typeof _getCreatedAtFilter === "function"
          ? _getCreatedAtFilter(dateFilter)
          : null;
      if (createdAtFilter) {
        whereClause.createdAt = createdAtFilter;
      }

      // Search Filter
      if (search && search.trim() !== "") {
        const query = search.trim();
        whereClause.OR = [
          { invoiceNumber: { contains: query, mode: "insensitive" } },
          {
            fleetOwner: { ownerName: { contains: query, mode: "insensitive" } },
          },
        ];
      }

      if (fleetOwnerId && fleetOwnerId.trim() !== "")
        whereClause.fleetOwner__fk__ = fleetOwnerId.trim();
      if (chargingStationId && chargingStationId.trim() !== "")
        whereClause.chargingStation__fk__ = chargingStationId.trim();
      if (status && status.trim() !== "") whereClause.status = status.trim();
    }

    // 2. Fetch ALL matching records (No skip/take limits)
    const invoicesData = await Context.DataBase.fleetHubInvoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        fleetOwner: true,
        chargingStation: true,
      },
    });

    // 3. Format Data for Export (Jis format mein helper ko chahiye)
    const exportData = invoicesData.map((inv) => ({
      invoiceNumber: inv.invoiceNumber || "N/A",
      date: inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString("en-GB")
        : "N/A",
      fleetName: inv.fleetOwner?.ownerName || "N/A",
      stationName: inv.chargingStation?.name || "N/A",
      totalSessions: inv.totalSessions || 0,
      energy: Number(inv.totalEnergy || 0).toFixed(2) + " kWh",
      amount: "Rs. " + Number(inv.totalAmount || 0).toFixed(2),
      status: inv.status || "N/A",
    }));

    // 4. Define Columns for Excel/PDF
    const columns = [
      { header: "Invoice Number", key: "invoiceNumber", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Client (Fleet Name)", key: "fleetName", width: 30 },
      { header: "Charging Hub", key: "stationName", width: 30 },
      { header: "Total Sessions", key: "totalSessions", width: 15 },
      { header: "Energy Consumed", key: "energy", width: 20 },
      { header: "Total Amount", key: "amount", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    // 5. Generate File using Helper
    const fileFormat = format.toUpperCase(); // Ensure uppercase 'EXCEL' or 'PDF'
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      "Fleet Hub Invoices",
    );

    // 6. Return response to Frontend
    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const mimeType =
      fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    return {
      base64String,
      fileName: `FleetHubInvoices_Export_${new Date().getTime()}.${extension}`,
      mimeType,
    };
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error);
    throw new Error("Failed to export invoices.");
  }
};
