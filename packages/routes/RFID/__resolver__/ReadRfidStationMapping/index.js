
export default async (__, { rfidTagId }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> GetRfidStationMappings";
  const rawTag = await Context.DataBase.rfidTag.findUnique({
  where: { id: rfidTagId },
});
console.log("Raw Tag Check in DB:", rawTag);
// Check kijiye ki rfidTagId undefined toh nahi aa raha
  console.log("Passed RFID Tag ID:", rfidTagId);
  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching RFID Station Mappings for Edit Modal", rfidTagId },
        _functionName
      );
    }

    if (!rfidTagId) {
      throw new Error("RFID_TAG_ID_IS_REQUIRED");
    }

    // 1. Fetch RFID Tag Details
    const rfidTag = await Context.DataBase.rfidTag.findFirst({
      where: { id: rfidTagId, isDeleted: false },
      select: {
        id: true,
        tagId: true,
      },
    });

    if (!rfidTag) {
      throw new Error("RFID_TAG_NOT_FOUND");
    }

    // 2. Fetch Flat Mappings with Station Info
    const mappings = await Context.DataBase.rfidStationMapping.findMany({
      where: {
        rfidTag__fk__: rfidTagId,
        isDeleted: false,
      },
      include: {
        chargingStation: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!mappings.length) {
      return {
        rfidTagId: rfidTag.id,
        tagId: rfidTag.tagId || "N/A",
        hubs: [],
      };
    }

    // 3. Extract Charger & Connector IDs to fetch display metadata safely
    const chargerIds = [
      ...new Set(mappings.map((m) => m.charger__fk__).filter(Boolean)),
    ];
    const connectorIds = [
      ...new Set(mappings.map((m) => m.connector__fk__).filter(Boolean)),
    ];

    const [chargers, connectors] = await Promise.all([
      chargerIds.length
        ? Context.DataBase.charger.findMany({
            where: { id: { in: chargerIds }, isDeleted: false },
          })
        : [],
      connectorIds.length
        ? Context.DataBase.connector.findMany({
            where: { id: { in: connectorIds }, isDeleted: false },
          })
        : [],
    ]);

    const chargerMap = new Map(chargers.map((c) => [c.id, c]));
    const connectorMap = new Map(connectors.map((cn) => [cn.id, cn]));

    // 4. Group Mappings by Charging Station into AC and DC sections
    const hubsMap = new Map();

    for (const mapping of mappings) {
      const station = mapping.chargingStation;
      if (!station) continue;

      const stationId = station.id;

      if (!hubsMap.has(stationId)) {
        hubsMap.set(stationId, {
          chargingStationId: stationId,
          chargingStationName: station.name || "N/A",
          city: station.city || null,
          dcPrice: null,
          dcConnectors: [],
          acPrice: null,
          acConnectors: [],
          _seenConnectors: new Set(),
        });
      }

      const hubGroup = hubsMap.get(stationId);
      if (!mapping.charger__fk__) {
        continue;
      }
      const charger = chargerMap.get(mapping.charger__fk__);
      const connector = connectorMap.get(mapping.connector__fk__);

      const connectorKey = `${mapping.charger__fk__}_${mapping.connector__fk__}`;
      const isAlreadyAdded = hubGroup._seenConnectors.has(connectorKey);

      const connectorPayload = {
        chargerId: mapping.charger__fk__,
        connectorId: mapping.connector__fk__,
        chargerName: charger?.name || null,
        chargeboxId: charger?.chargeboxId || null,
        chargingId: charger?.chargingId || null,
        connectorName: connector?.name || null,
        connectorType: connector?.connectorType || null
      };

      const chargingType = (charger?.chargingType || "").toUpperCase();
      const isDc = chargingType.includes("DC");

      if (isDc) {
        if (hubGroup.dcPrice === null && mapping.customPricePerKwh !== null) {
          hubGroup.dcPrice = Number(mapping.customPricePerKwh);
        }
        if (!isAlreadyAdded) {
          hubGroup.dcConnectors.push(connectorPayload);
          hubGroup._seenConnectors.add(connectorKey);
        }
      } else {
        if (hubGroup.acPrice === null && mapping.customPricePerKwh !== null) {
          hubGroup.acPrice = Number(mapping.customPricePerKwh);
        }
        if (!isAlreadyAdded) {
          hubGroup.acConnectors.push(connectorPayload);
          hubGroup._seenConnectors.add(connectorKey);
        }
      }
    }

    // 5. Clean internal tracking sets and format final response
    const hubs = Array.from(hubsMap.values()).map(
      ({ _seenConnectors, ...hub }) => ({
        ...hub,
        dcPrice: hub.dcPrice !== null ? hub.dcPrice : 0.0,
        acPrice: hub.acPrice !== null ? hub.acPrice : 0.0,
      })
    );

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "RFID Station Mappings retrieved successfully",
          rfidTagId,
          hubsCount: hubs.length,
        },
        _functionName
      );
    }

    return {
      rfidTagId: rfidTag.id,
      tagId: rfidTag.tagId || "N/A",
      hubs,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in GetRfidStationMappings", error: error.message },
        _functionName
      );
    }
    throw error;
  }
};