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
  const _functionName = "Routes -> RfidRequest -> Query -> ExportRfidPurchaseRequests";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Exporting RFID purchase requests/linked cards list with precise filters.", filters, format },
        _functionName
      );
    }

    const {
      status,
      customerProfileId,
      isIssued,
      search,
      dateFilter,
    } = filters;

    const where = {
      isDeleted: false,
    };

    // Tab switch based purely on isIssued (false = Purchase Requests, true = Linked Cards)
    if (typeof isIssued === "boolean") {
      where.isIssued = isIssued;
    }

    if (status) {
      where.status = status;
    }

    if (customerProfileId) {
      where.customerProfile__fk__ = customerProfileId;
    }

    // Apply accurate date filter helper
    const createdAtFilter = _getCreatedAtFilter(dateFilter);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    // Search filter handling (Tag ID & Account Email)
    if (search && search.trim() !== "") {
      const searchPattern = search.trim();
      where.OR = [
        {
          RfidTag: {
            tagId: { contains: searchPattern, mode: "insensitive" },
          },
        },
        {
          CustomerProfile: {
            Account: {
              email: { contains: searchPattern, mode: "insensitive" },
            },
          },
        },
      ];
    }

   

    // Fetch all matching records without pagination for export
    const records = await Context.DataBase.rfidRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        CustomerProfile: {
          include: {
            Account: true,
          },
        },
        RfidTag: true,
      },
    });

    // Format Data for Export matching UI columns
    const exportData = records.map((record, index) => ({
      sNo: index + 1,
      requestId: record.id || "N/A",
      status: record.status || "N/A",
      tagId: record.RfidTag?.tagId || "N/A",
      customerName: record.CustomerProfile?.name || "N/A",
      email: record.CustomerProfile?.Account?.email || "N/A",
      isIssued: record.isIssued ? "Yes" : "No",
      createdAt: record.createdAt ? new Date(record.createdAt).toLocaleDateString("en-GB") : "N/A",
    }));

    // Define Columns for Excel/PDF
    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Request ID", key: "requestId", width: 22 },
      { header: "Status", key: "status", width: 16 },
      { header: "Tag ID", key: "tagId", width: 20 },
      { header: "Customer Name", key: "customerName", width: 22 },
      { header: "Customer Email", key: "email", width: 28 },
      { header: "Is Issued", key: "isIssued", width: 12 },
      { header: "Created Date", key: "createdAt", width: 16 },
    ];

    const fileFormat = format ? format.toUpperCase() : "EXCEL";
    const reportTitle = isIssued ? "Linked RFID Cards Report" : "RFID Purchase Requests Report";
    
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      reportTitle
    );

    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const filePrefix = isIssued ? "Linked_RFID_Cards" : "RFID_Purchase_Requests";

    return {
      success: true,
      message: `${reportTitle} exported successfully`,
      base64String,
      mimeType:
        fileFormat === "EXCEL"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
      fileName: `${filePrefix}_${new Date().getTime()}.${extension}`,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to export RFID Purchase Requests / Linked Cards.", filters, format, error },
        _functionName
      );
    }
    throw error;
  }
};