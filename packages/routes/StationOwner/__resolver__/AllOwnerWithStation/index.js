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

export default async (_, { input = {} }, Context) => {
  const _functionName =
    "Routes -> StationOwner -> Query -> GetAllStationOwnersWithStations";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching station owners with charging stations.",
          input,
        },
        _functionName,
      );
    }

    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = input.search?.trim();
    const ownerId = input.ownerId?.trim();
    const ownerName = input.ownerName?.trim();
    const ownerLocation = input.ownerLocation?.trim();

    /*
     * OWNER FILTER
     */
    const where = {
      isDeleted: false,
    };

    if (ownerId) {
      where.id = ownerId;
    }

    if (ownerName) {
      where.ownerName = {
        contains: ownerName,
        mode: "insensitive"// <--- Case-insensitive match ke liye
      };
    }

    if (ownerLocation) {
      where.AND = [
        {
          OR: [
            {
              city: {
                contains: ownerLocation,
                mode: "insensitive",
              },
            },
            {
              state: {
                contains: ownerLocation,
                mode: "insensitive",
              },
            },
          ],
        },
      ];
    }

    /*
     * GENERAL SEARCH
     */
    if (search) {
      const searchConditions = [
        {
          displayId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          ownerName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          state: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          ChargingStations: {
            some: {
              isDeleted: false,
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  stationId: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  city: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  state: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ];

      where.AND = [...(where.AND || []), { OR: searchConditions }];
    }

    if (input.state) {
      where.state = {
        equals: input.state,
        mode: "insensitive",
      };
    }

    if (input.profileStatus) {
      where.profileStatus = input.profileStatus;
    }

    /*
     * CREATED DATE FILTER
     */
    const createdAtFilter = _getCreatedAtFilter(input.dateFilter);

    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    /*
     * STATION FILTER
     *
     * These filters determine which owners are returned.
     * The same station filters are also applied while
     * fetching the stations for each owner.
     */
    const hasStationFilter =
      Boolean(input.stationType) ||
      Boolean(input.ownership) ||
      Boolean(input.accessType) ||
      Boolean(input.status);

    const stationTypeValues = {
      STATION: ["STATION", "Station"],
      HUB: ["HUB", "Hub"],
      FLEET_DEPOT: ["FLEET_DEPOT", "Fleet Depot"],
    };
    const accessTypeValues = {
      PUBLIC: ["PUBLIC", "Public"],
      PRIVATE: ["PRIVATE", "Private"],
      RESIDENT_ONLY: ["RESIDENT_ONLY", "Resident Only"],
      EMPLOYEE_ONLY: ["EMPLOYEE_ONLY", "Employee Only"],
      FLEET_RESERVED: ["FLEET_RESERVED", "Fleet Reserved"],
    };
    const stationType = input.stationType?.trim();
    const accessType = input.accessType?.trim();
    const stationTypeFilter = stationType
      ? stationTypeValues[
          stationType.toUpperCase().replace(/\s+/g, "_")
        ] || [stationType]
      : undefined;
    const accessTypeFilter = accessType
      ? accessTypeValues[
          accessType.toUpperCase().replace(/\s+/g, "_")
        ] || [accessType]
      : undefined;

    const stationFilter = {
      isDeleted: false,
      ...(stationTypeFilter && {
        type: {
          in: stationTypeFilter,
        },
      }),
      ...(input.ownership && {
        ownership: input.ownership,
      }),
      ...(accessTypeFilter && {
        accessType: {
          in: accessTypeFilter,
        },
      }),
      ...(input.status && {
        status: input.status,
      }),
    };

    /*
     * If station-level filters are present,
     * only owners having at least one matching
     * charging station should be returned.
     */
    if (hasStationFilter) {
      where.ChargingStations = {
        some: stationFilter,
      };
    }

    const [totalCount, stationOwners] =
      await Context.DataBase.$transaction([
        Context.DataBase.stationOwner.count({
          where,
        }),

        Context.DataBase.stationOwner.findMany({
          where,
          skip,
          take: limit,

          orderBy: {
            createdAt: "desc",
          },

          include: {
            ChargingStations: {
              where: hasStationFilter
                ? stationFilter
                : {
                    isDeleted: false,
                  },

              include: {
                Chargers: {
                  where: {
                    isDeleted: false,
                  },

                  include: {
                    Connectors: {
                      where: {
                        isDeleted: false,
                      },

                      select: {
                        price: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

    /*
     * RESPONSE MAPPING
     */
    const owners = stationOwners.map((owner) => {
      const chargingStations = owner.ChargingStations.map((station) => {
        const connectors = station.Chargers.flatMap(
          (charger) => charger.Connectors,
        );

        const chargerPrice = connectors
          .map((connector) => connector.price)
          .filter((price) => price !== null);

        return {
            id: station.id,
          stationName: station.name,
 
          stationType: station.type,
          ownership: station.ownership,
          accessType: station.accessType,

          chargingPoint: connectors.length,
          chargerPrice,

          city: station.city,
          state: station.state,

          status: station.status,
        };
      });

      return {
        id: owner.id,
        displayId: owner.displayId,
        ownerName: owner.ownerName,
        status: owner.status,
        profileStatus: owner.profileStatus,

        chargingStations,
      };
    });

    await Context.Debug(
      {
        message:
          "Successfully fetched station owners with charging stations.",
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
          message:
            "Unable to fetch station owners with charging stations.",
          input,
        },
        _functionName,
      );
    }

    throw error;
  }
};