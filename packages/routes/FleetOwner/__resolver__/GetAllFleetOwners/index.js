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
export default async (__, { page = 1, limit = 10, filters }, Context) => {
  const _functionName = "Routes -> FleetOwners -> Query -> GetFleetOwners";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching Fleet Owners with RFID mapping.",
          page,
          limit,
          filters,
        },
        _functionName,
      );
    }

    const skip = (page - 1) * limit;
    const take = limit;

    // 1. Root where clause for Fleet Owner
    const whereClause = { isDeleted: false };

    if (filters) {
      const { search, fleetOwner, chargingHub, ownership, accessType, status } =
        filters;

      // Date Filter Integration (FleetOwner.createdAt)
      const createdAtFilter = _getCreatedAtFilter(filters.dateFilter);
      if (createdAtFilter) {
        whereClause.createdAt = createdAtFilter;
      }
      // Search by Owner Name or Fleet ID
      if (search && search.trim() !== "") {
        whereClause.OR = [
          { ownerName: { contains: search.trim(), mode: "insensitive" } },
          { fleetId: { contains: search.trim(), mode: "insensitive" } },
        ];
      }
      // Fleet Owner Dropdown Filter (Targeting Name)
      if (fleetOwner && fleetOwner.trim() !== "") {
        whereClause.ownerName = {
          contains: fleetOwner.trim(),
          mode: "insensitive",
        };
      }
      // Root Filter: Status
      if (status) {
        whereClause.status = status;
      }

      // Nested Station Filters: chargingHub, accessType, ownership
      const stationConditions = { isDeleted: false };

      if (chargingHub && chargingHub.trim() !== "") {
        const hubVal = chargingHub.trim();
        stationConditions.OR = [
          { id: hubVal },
          { stationId: { equals: hubVal, mode: "insensitive" } },
          { name: { contains: hubVal, mode: "insensitive" } },
        ];
      }

      if (accessType && accessType.trim() !== "") {
        stationConditions.accessType = {
          equals: accessType.trim(),
          mode: "insensitive",
        };
      }

      if (ownership && ownership.trim() !== "") {
        stationConditions.ownership = {
          equals: ownership.trim(),
          mode: "insensitive",
        };
      }

      // Apply nested relation filter if any station condition is present
      const hasStationFilter = chargingHub || accessType || ownership;
      if (hasStationFilter) {
        whereClause.rfidTags = {
          some: {
            isDeleted: false,
            stationMappings: {
              some: {
                isDeleted: false,
                chargingStation: stationConditions,
              },
            },
          },
        };
      }
    }

    // 2. Fetch Total Count and Data
    const [totalCount, fleetOwnersData] = await Promise.all([
      Context.DataBase.fleetOwner.count({ where: whereClause }),
      Context.DataBase.fleetOwner.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          rfidTags: {
            where: { isDeleted: false },
            include: {
              stationMappings: {
                where: { isDeleted: false },
                include: {
                  chargingStation: {
                    include: {
                      Chargers: {
                        where: { isDeleted: false },
                        include: {
                          Connectors: {
                            where: { isDeleted: false },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // 3. Process Data: Grouping Stations & Calculating UI Values
    const nodes = fleetOwnersData.map((owner) => {
      const activeRfids = owner.rfidTags || [];
      const totalActiveRfids = activeRfids.length;

      const stationMap = new Map();

      activeRfids.forEach((rfid) => {
        const mappings = rfid.stationMappings || [];

        mappings.forEach((mapping) => {
          const station = mapping.chargingStation;

          if (station) {
            if (!stationMap.has(station.id)) {
              let totalConnectors = 0;
              (station.Chargers || []).forEach((charger) => {
                totalConnectors += (charger.Connectors || []).length;
              });

              stationMap.set(station.id, {
                id: station.id,
                city: station.city || "N/A",
                hubName: station.name || "N/A",
                hubStationCount: 1,
                chargingPointCount: totalConnectors,
                accessType: station.accessType || "Fleet Reserved",
                // RFID details ko track karne ke liye Map (keyed by rfid.id to prevent duplicates)
                rfidMap: new Map([
                  [
                    rfid.id,
                    {
                      id: rfid.id,
                      tagId: rfid.tagId || "N/A",
                      tagType: rfid.tagType || "STANDALONE",
                      reserveAmount: Number(rfid.reserveAmount || 0),
                      balanceAmount: Number(rfid.balanceAmount || 0),
                    },
                  ],
                ]),
              });
            } else {
              const existingHub = stationMap.get(station.id);
              if (!existingHub.rfidMap.has(rfid.id)) {
                existingHub.rfidMap.set(rfid.id, {
                  id: rfid.id,
                  tagId: rfid.tagId || "N/A",
                  tagType: rfid.tagType || "STANDALONE",
                  reserveAmount: Number(rfid.reserveAmount || 0),
                  balanceAmount: Number(rfid.balanceAmount || 0),
                });
              }
            }
          }
        });
      });

      // Hub array format aur total connectors calculate karein
      const hubs = Array.from(stationMap.values()).map((hub) => {
        const rfidsList = Array.from(hub.rfidMap.values());

        return {
          id: hub.id,
          city: hub.city,
          hubName: hub.hubName,
          hubStationCount: hub.hubStationCount,
          chargingPointCount: hub.chargingPointCount,
          accessType: hub.accessType,
          rfidCount: rfidsList.length,
          rfids: rfidsList, // Har station ke mapped RFIDs list
        };
      });

      const totalChargingPoints = hubs.reduce(
        (sum, hub) => sum + hub.chargingPointCount,
        0,
      );

      return {
        id: owner.id,
        fleetId: owner.fleetId,
        fleetOwnerName: owner.ownerName || "Unknown",
        totalChargingPoints,
        totalActiveRfids,
        hubs,
      };
    });

    // 4. Return Final Response
    const response = {
      nodes,
      totalCount,
      page,
      limit,
    };

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fleet Owners list mapped successfully.", totalCount },
        _functionName,
      );
    }

    return response;
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};
