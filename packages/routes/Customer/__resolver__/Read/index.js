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

import _, { include } from "underscore";

export default async (
  __,
  { customerId, customerCode, status, search, stationId,dateFilter, take, skip },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _whatToQuery = { isDeleted: false };

      const _functionName = "Routes -> Customer -> Read";

      take = take ?? 10;
      skip = skip ?? 0;

      await Context.Debug(
        { message: "Searching customer details.." },
        _functionName,
      );

      if (!_.isEmpty(customerId))
        Object.assign(_whatToQuery, { id: customerId });
      if (!_.isEmpty(customerCode))
        Object.assign(_whatToQuery, {
          customerCode: { startsWith: customerCode, mode: "insensitive" },
        });
      if (!_.isEmpty(status)) Object.assign(_whatToQuery, { status: status });

      if (!_.isEmpty(search)) {
        Object.assign(_whatToQuery, {
          OR: [
            { customerCode: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } }, // 👈 NAYA: Location City ke liye
            { addressLine1: { contains: search, mode: "insensitive" } }, // 👈 NAYA: Location Address ke liye
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
              Charger:{
                ChargingStation:{
                  id:stationId
                }
              } // Check karlena tumhare schema mein station ID ka exact field name kya hai
            },
          },
        });
      }
      // Filter by Date Range
      if (dateFilter) {
        // filters.dateFilter ki jagah seedha dateFilter pass kiya
        const createdAtFilter = _getCreatedAtFilter(dateFilter); 
        
        if (createdAtFilter) {
          // where ki jagah _whatToQuery use kiya
          _whatToQuery.createdAt = createdAtFilter; 
        }
      }
      if (Context.Session.user.accountType === "COMPANY") {
      }

      const _totalCount = await Context.DataBase.customerProfile.count({
        where: _whatToQuery,
      });

      if (_totalCount instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to get count of customer details.",
            error: _totalCount,
          },
          _functionName,
        );
        return _totalCount;
      }

      const _CustomerFindMany = await Context.DataBase.customerProfile.findMany(
        {
          where: _whatToQuery,
          include: {
            Account: true,
            CustomerVehicles: true, // Vechicle aur Charging Type ke liye
            RfidTags: {
              where: { isDeleted: false }, // Array ki length se UI par 'Yes/No' dikhane ke liye
            },
            ChargingSessions: {
              orderBy: { createdAt: "desc" },
              take: 1, // Table mein recent station dikhane ke liye
              include: {
                Charger: {
                  include:{
                    ChargingStation: true,
                    Connectors: true
                  }

                } // Assume kar raha hoon station details yahan se milengi
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take,
          skip,
        },
      );

      if (
        0 < _CustomerFindMany?.length &&
        !(_CustomerFindMany instanceof Error)
      ) {
        await Context.Debug(
          { message: "Successfully got given customer details." },
          _functionName,
        );
        return _CustomerFindMany?.map((j) => {
          return {
            ...j,
            // UI table mein inki zaroorat nahi hai aur relations missing hain,
            // isliye crash se bachne ke liye inhe 0 bhej rahe hain.
            totalOrders: 0,
            totalSpend: 0,
            _totalCount,
          };
        });
      }

      await Context.Debug(
        {
          message: `Failed to get customer details.`,
          error: _CustomerFindMany,
        },
        _functionName,
      );
      return _CustomerFindMany instanceof Error ? _CustomerFindMany : [];
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
