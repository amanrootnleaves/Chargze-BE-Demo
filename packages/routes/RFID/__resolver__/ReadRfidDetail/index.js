export default async (__, { id }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> GetRfidDetail";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching RFID tag details.", id },
        _functionName
      );
    }

    if (!id) {
      throw new Error("RFID tag ID is required.");
    }

    // Database se RfidTag aur related CustomerProfile & other relations fetch karna
    const record = await Context.DataBase.rfidTag.findUnique({
      where: { id },
      include: {
        fleetOwner: true,
        parent: true,
        children: true,
        stationMappings: true,
        CustomerProfile:{
          include:{
            Account:true
          }
        } // Relation to fetch customer details and shipping data
      },
    });

    if (!record || record.isDeleted) {
      throw new Error("RFID Tag not found.");
    }

    // Map Prisma foreign keys to GraphQL schema field names (matching getRfidTags style)
    const rfidTag = {
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
    };

    // Return structure matching RfidTagDetailResponse (shipping data same as customer profile)
    return {
      rfidTag,
      customerProfile: record.CustomerProfile || null,
      shippingDetails: record.CustomerProfile || null,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to fetch RFID Tag details.", id, error },
        _functionName
      );
    }
    throw error;
  }
};