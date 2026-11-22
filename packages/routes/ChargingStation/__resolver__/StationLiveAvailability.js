export default async (_, { id }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName ="Routes -> ChargingStation -> Resolver  -> stationLiveAvailability";
      await Context.Debug(
        { message: `Fetching live availability for station ID: ${id}` },
        _functionName,
      );
      const station = await Context.DataBase.chargingStation.findFirst({
        where: {
          id,
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

      const chargers = station.Chargers.map((charger) => {
        const hasAvailable = charger.Connectors.some(
          (connector) => connector.status === "AVAILABLE",
        );

        return {
          id: charger.id,
          name: charger.name,
          status: hasAvailable
            ? "AVAILABLE"
            : charger.Connectors.every(
                  (connector) => connector.status === "OFFLINE",
                )
              ? "OFFLINE"
              : "BUSY",
          connectors: charger.Connectors.map((connector) => ({
            id: connector.id,
            name: connector.name,
            connectorType: connector.connectorType,
            status: connector.status,
            power: connector.power,
          })),
        };
      });

      return { chargers };
    }

    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug({
      message: "Failed to fetch live charger and connector details.",
      error,
    });
    throw error;
  }
};
