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
        filterStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
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

export default async (__ , { input = {} }, Context) => {
  const _functionName =
    "Routes -> StationOwner -> Query -> GetAllStationOwners";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching station owners.",
          input,
        },
        _functionName,
      );
    }

    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = input.search?.trim();

    const where = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { displayId: { contains: search } },
        { ownerName: { contains: search } },
        { city: { contains: search } },
        { state: { contains: search } },
      ];
    }

    if (input.state) {
      where.state = input.state;
    }

    if (input.profileStatus) {
      where.profileStatus = input.profileStatus;
    }

    const createdAtFilter = _getCreatedAtFilter(input.dateFilter);

    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    const hasStationFilter =
      Boolean(input.stationType) ||
      Boolean(input.ownership) ||
      Boolean(input.accessType);

    if (hasStationFilter) {
      where.ChargingStations = {
        some: {
          isDeleted: false,
          ...(input.stationType && { type: input.stationType }),
          ...(input.ownership && { ownership: input.ownership }),
          ...(input.accessType && { accessType: input.accessType }),
        },
      };
    }

    const [totalCount, stationOwners] = await Context.DataBase.$transaction([
      Context.DataBase.stationOwner.count({ where }),

      Context.DataBase.stationOwner.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          ChargingStations: {
            where: {
              isDeleted: false,
            },
            include: {
              Chargers: {
                where: {
                  isDeleted: false,
                },
                select: {
                  chargingType: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const owners = stationOwners.map((owner) => {
      let acChargerCount = 0;
      let dcChargerCount = 0;

      owner.ChargingStations.forEach((station) => {
        station.Chargers.forEach((charger) => {
          if (charger.chargingType === "AC") {
            acChargerCount += 1;
          }

          if (charger.chargingType === "DC") {
            dcChargerCount += 1;
          }
        });
      });

      return {
        id: owner.id,
        displayId: owner.displayId,
        ownerName: owner.ownerName,
        stationCount: owner.ChargingStations.length,
        acChargerCount,
        dcChargerCount,
        ownerships: [
          ...new Set(
            owner.ChargingStations
              .map((station) => station.ownership)
              .filter(Boolean),
          ),
        ],
        city: owner.city,
        state: owner.state,
        profileStatus: owner.profileStatus,
      };
    });

    await Context.Debug(
        {
          message: "Successfully fetched station owners.",
          input,
        },
        _functionName,
      );
    return {
      owners,
      totalCount,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Unable to fetch station owners.",
          input,
        },
        _functionName,
      );
    }

    throw error;
  }
};