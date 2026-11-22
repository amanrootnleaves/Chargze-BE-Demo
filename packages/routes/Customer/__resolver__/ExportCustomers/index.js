import { generateBase64Export } from "../../../../dyna_modules/Utils/index";
import _ from "underscore";

// Date filter helper bilkul CustomerRead jaisa
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

export default async (parent, args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Admin -> ExportCustomer";

      await Context.Debug(
        { message: "Exporting Customer details.." },
        _functionName
      );

      const {
        format,
        customerId,
        customerCode,
        status,
        search,
        stationId,
        dateFilter
      } = args;

      // 1. Same _whatToQuery structure as CustomerRead
      const _whatToQuery = { isDeleted: false };

      if (!_.isEmpty(customerId)) {
        Object.assign(_whatToQuery, { id: customerId });
      }

      if (!_.isEmpty(customerCode)) {
        Object.assign(_whatToQuery, {
          customerCode: { startsWith: customerCode, mode: "insensitive" },
        });
      }

      if (!_.isEmpty(status)) {
        Object.assign(_whatToQuery, { status: status });
      }

      if (!_.isEmpty(search)) {
        Object.assign(_whatToQuery, {
          OR: [
            { customerCode: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { addressLine1: { contains: search, mode: "insensitive" } },
            {
              Account: {
                fullName: { contains: search, mode: "insensitive" },
              },
            },
            { Account: { email: { contains: search, mode: "insensitive" } } },
            {
              Account: {
                phoneNumber: { contains: search, mode: "insensitive" },
              },
            },
          ],
        });
      }

      if (!_.isEmpty(stationId)) {
        Object.assign(_whatToQuery, {
          ChargingSessions: {
            some: {
              Charger: {
                ChargingStation: {
                  id: stationId,
                },
              },
            },
          },
        });
      }

      if (dateFilter) {
        const createdAtFilter = _getCreatedAtFilter(dateFilter);
        if (createdAtFilter) {
          _whatToQuery.createdAt = createdAtFilter;
        }
      }

      // 2. Query Database with same includes (No pagination limits for export)
      const customers = await Context.DataBase.customerProfile.findMany({
        where: _whatToQuery,
        include: {
          Account: true,
          CustomerVehicles: true,
          RfidTags: {
            where: { isDeleted: false },
          },
          ChargingSessions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              Charger: {
                include: {
                  ChargingStation: true,
                  Connectors: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // 3. Format Data for Export matching UI columns
      const exportData = customers.map((customer, index) => {
        const account = customer.Account;
        
        // Extracting Recent Station Name if exists
        const recentSession = customer.ChargingSessions?.[0];
        const recentStation = recentSession?.Charger?.ChargingStation?.name || "N/A";
        
        // Checking RFID assigned status
        const hasRfid = customer.RfidTags && customer.RfidTags.length > 0 ? "Yes" : "No";

        return {
          sNo: index + 1,
          customerCode: customer.customerCode || "N/A",
          fullName: account?.fullName || "N/A",
          email: account?.email || "N/A",
          phone: account?.phoneNumber || "N/A",
          city: customer.city || "N/A",
          rfidAssigned: hasRfid,
          recentStation: recentStation,
          status: customer.status || "N/A",
          joinDate: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB") : "N/A",
        };
      });

      // 4. Define Table Columns for Excel/CSV
      const columns = [
        { header: "#", key: "sNo", width: 8 },
        { header: "Customer Code", key: "customerCode", width: 22 },
        { header: "Full Name", key: "fullName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "City", key: "city", width: 18 },
        { header: "RFID Assigned", key: "rfidAssigned", width: 15 },
        { header: "Recent Station", key: "recentStation", width: 25 },
        { header: "Status", key: "status", width: 15 },
        { header: "Join Date", key: "joinDate", width: 15 }
      ];

      // 5. Generate File using Base64 helper
      const fileFormat = format.toUpperCase();
      const base64String = await generateBase64Export(
        exportData,
        columns,
        fileFormat,
        "Customer Export"
      );

      // 6. Final Output mapping
      const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
      const mimeType = fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

      return {
        base64String,
        fileName: `Customer_Export_${new Date().getTime()}.${extension}`,
        mimeType
      };
    }

    return new Error("MISSING_CONTEXT");
  } catch (error) {
    console.error(error);
    return error;
  }
};