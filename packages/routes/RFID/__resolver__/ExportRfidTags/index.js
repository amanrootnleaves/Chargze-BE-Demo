import { generateBase64Export } from '../../../../dyna_modules/Utils/index';

// 1. Standard Date Filter Helper (Timezone & Range Safe)
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
    return { gte: filterStartDate, lt: tomorrow };
  }

  if (startDate && endDate) {
    return {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  return undefined;
};

export default async (__, { format, filters = {} }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> ExportGetRfidTags";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Exporting RFID tags list with precise date filters.", filters, format },
        _functionName
      );
    }

    const {
      tagType,
      fleetOwnerId,
      dateFilter,
      isBlocked,
      inTransaction,
    } = filters;

  console.log("FULL FILTERS OBJECT:", filters);
  console.log("DATE FILTER VALUE:", filters?.dateFilter);

    const where = {
      isDeleted: false,
    };

    if (tagType) {
      where.tagType = tagType;
    }

    if (typeof isBlocked === "boolean") {
      where.isBlocked = isBlocked;
    }

    if (typeof inTransaction === "boolean") {
      where.inTransaction = inTransaction;
    }

    if (fleetOwnerId) {
      where.fleetOwner__fk__ = fleetOwnerId;
    }

    // Apply accurate date filter helper
    const createdAtFilter = _getCreatedAtFilter(dateFilter);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    console.log("WHERE",where)

    // Fetch all matching records without pagination for export
    const records = await Context.DataBase.rfidTag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        fleetOwner: true,
        parent: true,
        children: true,
        stationMappings: {
          include: {
            chargingStation: true,
          },
        },
        CustomerProfile: {
          include: {
            Account: true,
          },
        },
      },
    });

    // Format Data for Export matching UI columns
    const exportData = records.map((record, index) => ({
      sNo: index + 1,
      tagId: record.tagId || "N/A",
      tagType: record.tagType || "N/A",
      isBlocked: record.isBlocked ? "Yes" : "No",
      inTransaction: record.inTransaction ? "Yes" : "No",
      email: record.CustomerProfile?.Account?.email || "N/A",
      createdAt: record.createdAt ? new Date(record.createdAt).toLocaleDateString("en-GB") : "N/A",
    }));

    // Define Columns for Excel/PDF
    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Tag ID", key: "tagId", width: 22 },
      { header: "Tag Type", key: "tagType", width: 16 },
      { header: "Is Blocked", key: "isBlocked", width: 14 },
      { header: "In Transaction", key: "inTransaction", width: 16 },
      { header: "Customer Email", key: "email", width: 28 },
      { header: "Created Date", key: "createdAt", width: 16 },
    ];

    const fileFormat = format ? format.toUpperCase() : "EXCEL";
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      "RFID Tags Report"
    );

    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const mimeType =
      fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    return {
      success: true,
      message: "RFID tags exported successfully",
      base64String,
      mimeType,
      fileName: `RFID_Tags_Export_${new Date().getTime()}.${extension}`,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to export RFID Tags.", filters, format, error },
        _functionName
      );
    }
    throw error;
  }
};