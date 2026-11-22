export default async (__, { filter = {} }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> GetRfidTags";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching RFID tags list.", filter },
        _functionName
      );
    }

    const {
      search,
      tagType,
      fleetOwnerId,
      dateFilter,
      isBlocked,
      inTransaction,
      page = 1,
      limit = 20,
    } = filter;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);

    // Build Prisma Where Clause
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
    if (dateFilter) {
      const { period, startDate, endDate } = dateFilter;
      let gteDate = startDate ? new Date(startDate) : null;
      let lteDate = endDate ? new Date(endDate) : null;
      const now = new Date();

      if (period) {
        switch (period) {
          case "TODAY":
            gteDate = new Date(now.setHours(0, 0, 0, 0));
            lteDate = new Date(); // current exact time or end of day
            break;
          case "WEEK":
            gteDate = new Date();
            gteDate.setDate(now.getDate() - 7);
            break;
          case "MONTH":
            gteDate = new Date();
            gteDate.setMonth(now.getMonth() - 1);
            break;
          case "HALF_YEAR":
            gteDate = new Date();
            gteDate.setMonth(now.getMonth() - 6);
            break;
          case "YEAR":
            gteDate = new Date();
            gteDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
      }

      if (gteDate || lteDate) {
        where.createdAt = {};
        if (gteDate) where.createdAt.gte = gteDate;
        if (lteDate) where.createdAt.lte = lteDate;
      }
    }

    if (search && search.trim() !== "") {
      const searchPattern = search.trim();
      where.OR = [
        // 1. Tag ID search
        { tagId: { contains: searchPattern, mode: "insensitive" } },
        // 2. Tag Type search (if tagType is stored as text/string)
        { tagType: { contains: searchPattern, mode: "insensitive" } },
        // 3. Account Email search (via CustomerProfile -> Account relation)
        {
          CustomerProfile: {
            Account: {
              email: { contains: searchPattern, mode: "insensitive" },
            },
          },
        },
        // 4. Charging Station Name search (via stationMappings -> chargingStation relation)
        {
          stationMappings: {
            some: {
              chargingStation: {
                name: { contains: searchPattern, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    // Execute count & fetch concurrently
    const [totalCount, records] = await Promise.all([
      Context.DataBase.rfidTag.count({ where }),
      Context.DataBase.rfidTag.findMany({
        where,
        skip,
        take,
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
      }),
    ]);

    // Map Prisma foreign keys to GraphQL schema field names
    const nodes = records.map((record) => ({
      ...record,
      fleetOwnerId: record.fleetOwner__fk__,
      parentId: record.parentRfid__fk__,
      stationMappings: (record.stationMappings || []).map((m) => ({
        ...m,
        rfidTagId: m.rfidTag__fk__,
        chargingStationId: m.chargingStation__fk__,
        chargerId: m.charger__fk__,
        connectorId: m.connector__fk__,
      })),
    }));

    return {
      nodes,
      totalCount,
      totalPages: Math.ceil(totalCount / take) || 1,
      currentPage: page,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to fetch RFID Tags.", filter, error },
        _functionName
      );
    }
    throw error;
  }
};