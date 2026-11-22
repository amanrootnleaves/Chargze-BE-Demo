export default async (__, { input }, Context) => {
  const _functionName = "Routes -> RfidTag -> Mutation -> MapRfidStations";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Mapping RFID Stations.", input },
        _functionName,
      );
    }

    // Yahan 'mappings' ki jagah 'hubs' aayega (As per new Schema)
    const { rfidTagId, hubs } = input;

    // 1. Validation Checks
    if (!rfidTagId) {
      throw new Error("RFID_TAG_ID_IS_REQUIRED");
    }

    if (!Array.isArray(hubs)) {
      throw new Error("HUBS_MUST_BE_AN_ARRAY");
    }

    // 2. Verify RFID Tag existence & status
    const _rfidTag = await Context.DataBase.rfidTag.findFirst({
      where: {
        OR: [{ id: rfidTagId }, { tagId: rfidTagId }],
        isDeleted: false,
      },
      select: { id: true, isBlocked: true },
    });

    if (!_rfidTag) {
      throw new Error("RFID_TAG_NOT_FOUND");
    }

    if (_rfidTag.isBlocked) {
      throw new Error("CANNOT_MAP_STATIONS_TO_BLOCKED_RFID_TAG");
    }

    // 3. Frontend ke nested Data ko Database ke Flat Data mein convert karna
    const mappingDataToInsert = [];

    for (const hub of hubs) {
      const stationId = hub.chargingStationId;

      // Handle DC Connectors
      if (hub.dcConnectors && hub.dcConnectors.length > 0) {
        let parsedDcPrice =
          hub.dcPrice !== undefined && hub.dcPrice !== null
            ? Number(hub.dcPrice)
            : null;
        if (parsedDcPrice !== null && isNaN(parsedDcPrice))
          throw new Error(`INVALID_DC_PRICE_FOR_STATION_${stationId}`);

        for (const dc of hub.dcConnectors) {
          mappingDataToInsert.push({
            rfidTag__fk__: rfidTagId,
            chargingStation__fk__: stationId,
            charger__fk__: dc.chargerId,
            connector__fk__: dc.connectorId,
            customPricePerKwh: parsedDcPrice,
          });
        }
      }

      // Handle AC Connectors
      if (hub.acConnectors && hub.acConnectors.length > 0) {
        let parsedAcPrice =
          hub.acPrice !== undefined && hub.acPrice !== null
            ? Number(hub.acPrice)
            : null;
        if (parsedAcPrice !== null && isNaN(parsedAcPrice))
          throw new Error(`INVALID_AC_PRICE_FOR_STATION_${stationId}`);

        for (const ac of hub.acConnectors) {
          mappingDataToInsert.push({
            rfidTag__fk__: rfidTagId,
            chargingStation__fk__: stationId,
            charger__fk__: ac.chargerId,
            connector__fk__: ac.connectorId,
            customPricePerKwh: parsedAcPrice,
          });
        }
      }
    }

    if (mappingDataToInsert.length === 0) {
      throw new Error("NO_CONNECTORS_SELECTED_TO_MAP");
    }

    // 4. Execute Transaction
    const createdMappings = await Context.DataBase.$transaction(
      async (prisma) => {
        // Purane mapping records clear karein
        await prisma.rfidStationMapping.deleteMany({
          where: { rfidTag__fk__: rfidTagId },
        });
        if (mappingDataToInsert.length === 0) {
          return [];
        }

        // Bulk insertion (Multiple Stations + Multiple AC/DC Guns)
        await prisma.rfidStationMapping.createMany({
          data: mappingDataToInsert,
        });

        // Insert hue fresh records return karein
        return await prisma.rfidStationMapping.findMany({
          where: { rfidTag__fk__: rfidTagId },
        });
      },
    );

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "RFID Stations mapped successfully.",
          output: createdMappings,
        },
        _functionName,
      );
    }

    // 5. GraphQL Schema Field Name Mapping
    return createdMappings.map((mapping) => ({
      ...mapping,
      rfidTagId: mapping.rfidTag__fk__,
      chargingStationId: mapping.chargingStation__fk__,
      chargerId: mapping.charger__fk__,
      connectorId: mapping.connector__fk__,
    }));
  } catch (error) {
    if (error.code === "P2003") {
      error = new Error("ONE_OR_MORE_STATIONS_OR_CHARGERS_DO_NOT_EXIST");
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Unable to map RFID Stations.",
          input,
          error: error.message || error,
        },
        _functionName,
      );
    }

    throw error;
  }
};
