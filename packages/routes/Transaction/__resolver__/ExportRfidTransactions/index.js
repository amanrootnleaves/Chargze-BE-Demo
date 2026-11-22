import { generateBase64Export } from '../../../../dyna_modules/Utils/index';

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

export default async (__, { format, filters = {} }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> ExportRfidTagTransactions";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Exporting RFID tag transactions with date filters.", filters, format },
        _functionName
      );
    }

    const { rfidTagId, dateFilter } = filters;

    if (!rfidTagId) {
      throw new Error("RFID_TAG_ID_REQUIRED");
    }

    const where = {
      isDeleted: false,
      RfidTag__fk__: rfidTagId,
    };

    // Apply accurate date filter helper
    const createdAtFilter = _getCreatedAtFilter(dateFilter);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    // 1. Fetch RfidTag details for fallback balance check
    const rfidTag = await Context.DataBase.rfidTag.findUnique({
      where: { id: rfidTagId },
    });

    if (!rfidTag) {
      throw new Error("RFID_TAG_NOT_FOUND");
    }

    // 2. Fetch ALL matching transactions without pagination for export
    const records = await Context.DataBase.transaction.findMany({
      where,
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
    });

    // 3. Format Data for Export matching UI Table columns
    const exportData = records.map((record, index) => {
      const session = record.ChargingSession;
      const station = session?.Charger?.ChargingStation;

      return {
        sNo: index + 1,
        txnId: record.gatewayTxnId || `TXN-${record.id.slice(-4)}`,
        chargingHub: station?.name || "N/A",
        city: station ? `${station.city || ""}, ${station.state || ""}`.trim().replace(/^,|,$/g, "") : "N/A",
        chargerId: session?.Charger?.chargeboxId || "N/A",
        paymentType: "RFID",
        energyConsumed: session?.energyConsumed ? `${session.energyConsumed} kWh` : "0 kWh",
        refundAmount: record.refundAmount ? `₹${Number(record.refundAmount).toFixed(2)}` : "---",
        amountPaid: `₹${Number(record.amount || 0).toFixed(2)}`,
        balanceAmount: `₹${Number(record.balanceAmount || rfidTag.balanceAmount || 0).toFixed(2)}`,
        dateTime: record.createdAt ? new Date(record.createdAt).toLocaleString("en-IN") : "N/A",
        status: record.status || "N/A",
      };
    });

    // 4. Define Columns for Excel/PDF
    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Txn ID", key: "txnId", width: 20 },
      { header: "Charging Hub", key: "chargingHub", width: 25 },
      { header: "City", key: "city", width: 18 },
      { header: "Charger ID", key: "chargerId", width: 18 },
      { header: "Payment Type", key: "paymentType", width: 15 },
      { header: "Energy Consumed", key: "energyConsumed", width: 18 },
      { header: "Refund Amount", key: "refundAmount", width: 16 },
      { header: "Amount Paid", key: "amountPaid", width: 16 },
      { header: "Balance Amount", key: "balanceAmount", width: 18 },
      { header: "Date & Time", key: "dateTime", width: 22 },
      { header: "Status", key: "status", width: 15 },
    ];

    const fileFormat = format ? format.toUpperCase() : "EXCEL";
    const reportTitle = `RFID Tag (${rfidTag.tagId || rfidTagId}) Transactions Report`;

    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      reportTitle
    );

    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";

    return {
      success: true,
      message: `${reportTitle} exported successfully`,
      base64String,
      mimeType:
        fileFormat === "EXCEL"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
      fileName: `RFID_Transactions_${rfidTag.tagId || rfidTagId}_${new Date().getTime()}.${extension}`,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to export RFID Tag Transactions.", filters, format, error },
        _functionName
      );
    }
    throw error;
  }
};