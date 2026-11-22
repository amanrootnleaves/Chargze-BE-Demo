const validatePrismaId = (id, fieldName = "ID") => {
  // 1. Check if present and is a string
  if (!id || typeof id !== "string") {
    throw new Error(`${fieldName}_REQUIRED`);
  }

  const trimmedId = id.trim();

  // 2. Check empty or too short (Prisma CUID ~25-30 chars, UUID is 36 chars)
  if (trimmedId.length < 10) {
    throw new Error(`${fieldName}_TOO_SHORT`);
  }

  // 3. Optional: Regex check for valid Prisma ID (CUID or UUID)
  const isCuid = /^c[a-z0-9]{20,32}$/i.test(trimmedId);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

  if (!isCuid && !isUuid) {
    throw new Error(`INVALID_${fieldName}_FORMAT`);
  }

  return trimmedId;
};
export default async (__, { id }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName =
        "Routes -> ChargingStation -> Resolver  -> GetDetails";
      await Context.Debug(
        { message: `Fetching charging station details for ID: ${id}` },
        _functionName,
      );
      if (!id || typeof id !== "string" || id.trim().length < 10) {
      throw new Error("INVALID_OR_MISSING_STATION_ID");
    }
    const cleanId = id.trim();
      const accountId = Context.Session.user.id;
      const station = await Context.DataBase.chargingStation.findFirst({
        where: { id:cleanId, isDeleted: false },
        include: {
          Company: true,
          WeeklyHours: true,
          StationOwner:true, 
          Chargers: {
            where: {
              isDeleted: false,
            },
            include: {
              Connectors: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
          // 3. Operating Hours (Step 2)
          WeeklyHours: true,
          StationHours: true,

          // 4. Remote Operations Configuration (Step 4)
          RemoteOperationConfig: true,

          // 5. Station Settings (Step 5)
          Settings: true,

          // 6. Commercial Terms (Step 6)
          Commercial: true,

          // 7. Documents (Step 7)
          Documents: {
            where: { isDeleted: false },
          },
          StationReviews: {
            include: {
              CustomerProfile: {
                include: {
                  Account: true,
                },
              },
            },
          },
        },
      });

      if (!station) {
        await Context.Debug(
          { message: `Charging station not found for ID: ${id}` },
          _functionName,
        );
        throw new Error("CHARGING_STATION_NOT_FOUND");
      }

      await Context.Debug(
        { message: `Fetched charging station details for ID: ${id}` },
        _functionName,
      );
      await Context.Debug(
        { message: `Fetched charging station details for ID: ${id}` },
        _functionName,
      );

      // Map relation fields to match GraphQL Schema field names
      return {
        ...station,
        ownerId: station.StationOwner__fk__,
        chargers: station.Chargers,
        weeklyHours: station.WeeklyHours,
        stationReviews: station.StationReviews,
        stationOwner: station.StationOwner,
      };
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug({
      message: "Failed to fetch charging station details.",
      error,
    });
    throw error;
  }
};
