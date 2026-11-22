export default async (__, { id }, Context) => {
  const _functionName =
    "Routes -> FleetOwners -> Query -> GetFleetOwnerDetails";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Fleet Owner Details.", id },
        _functionName,
      );
    }

    // 1. Fetch Fleet Owner with full nested relation graph
    const fleetOwner = await Context.DataBase.fleetOwner.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
      include: {
        rfidTags: {
          where: {
            isDeleted: false,
          },
          include: {
            stationMappings: {
              where: {
                isDeleted: false,
              },
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
    });

    if (!fleetOwner) {
      if (Context && Context.isContext) {
        await Context.Debug(
          { message: "Fleet Owner not found.", id },
          _functionName,
        );
      }
      throw new Error("Fleet Owner not found");
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message:
            "Fleet Owner retrieved. Processing RFID mapping and specific connectors.",
          rfidCount: fleetOwner.rfidTags?.length || 0,
        },
        _functionName,
      );
    }
    // 2. Format RFID Details: group by station to return an array of connectedStations
    const formatRfidTag = (tag) => {
      const stationMap = new Map();

      if (tag.stationMappings && tag.stationMappings.length > 0) {
        tag.stationMappings.forEach((mapping) => {
          const currentStation = mapping.chargingStation;
          if (!currentStation || !Array.isArray(currentStation.Chargers))
            return;

          if (!stationMap.has(currentStation.id)) {
            stationMap.set(currentStation.id, {
              id: currentStation.id,
              stationName: currentStation.name || "Unknown Station",
              stationCode: currentStation.stationId || null,
              city: currentStation.city || "",
              connectors: [],
              addedConnectorIds: new Set(),
            });
          }

          const stationEntry = stationMap.get(currentStation.id);

          const addConnector = (conn, charger, customPrice) => {
            if (!conn || stationEntry.addedConnectorIds.has(conn.id)) return;
            stationEntry.addedConnectorIds.add(conn.id);

            stationEntry.connectors.push({
              id: conn.id,
              name: conn.name || "Gun",
              chargingType: charger.chargingType || null,
              connectorType: conn.connectorType || null,
              chargerId: charger.id,
              chargerCode: charger.chargeboxId || charger.chargingId || null,
              customPrice: customPrice || null,
            });
          };

          // Scenario A: Specific connector or charger mapped
          if (mapping.connector__fk__ || mapping.charger__fk__) {
            currentStation.Chargers.forEach((charger) => {
              if (
                mapping.charger__fk__ &&
                charger.id !== mapping.charger__fk__
              ) {
                return;
              }

              (charger.Connectors || []).forEach((conn) => {
                if (
                  !mapping.connector__fk__ ||
                  conn.id === mapping.connector__fk__
                ) {
                  addConnector(conn, charger, mapping.customPricePerKwh);
                }
              });
            });
          } else {
            // Scenario B: Whole station mapped
            currentStation.Chargers.forEach((charger) => {
              (charger.Connectors || []).forEach((conn) => {
                addConnector(conn, charger, mapping.customPricePerKwh);
              });
            });
          }
        });
      }

      // Convert grouped stations to array & remove internal tracking set
      const connectedStations = Array.from(stationMap.values()).map(
        ({ addedConnectorIds, ...rest }) => rest,
      );

      return {
        id: tag.id,
        tagId: tag.tagId,
        tagType: tag.tagType,
        balanceAmount: tag.balanceAmount || 0,
        reserveAmount: tag.reserveAmount || 0,
        inTransaction: Boolean(tag.inTransaction),
        isBlocked: Boolean(tag.isBlocked),
        expiryDate: tag.expiryDate,
        parentId: tag.parentRfid__fk__ || null,
        connectedStations: connectedStations, // <-- Ab ye Array return karega
      };
    };

    // 3. Separate Parent and Child Tags using parentRfid__fk__
    const allFormattedTags = (fleetOwner.rfidTags || []).map(formatRfidTag);
    const parentTags = allFormattedTags.filter(
      (tag) => tag.tagType === "PARENT",
    );
    const childTags = allFormattedTags.filter((tag) => tag.tagType === "CHILD");

    const rfidDetails = parentTags.map((parent) => {
      const children = childTags.filter(
        (child) => child.parentId === parent.id,
      );
      return {
        ...parent,
        children: children,
      };
    });

    const orphanChildren = childTags.filter(
      (child) => !parentTags.some((p) => p.id === child.parentId),
    );
    rfidDetails.push(...orphanChildren);

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Successfully formatted details view response.",
          parentTagsCount: parentTags.length,
          childTagsCount: childTags.length,
        },
        _functionName,
      );
    }

    // 4. Return Final Payload matching UI Cards
    return {
      id: fleetOwner.id,
      fleetId: fleetOwner.fleetId || fleetOwner.id.slice(-4),
      businessProfile: {
        ownerName: fleetOwner.ownerName || "",
        status: fleetOwner.status || "LIVE",
        paymentTerms: fleetOwner.paymentTerms || "PREPAID",
        payoutDay: fleetOwner.payoutDay || null,
        onboardingDate: fleetOwner.onboardingDate || fleetOwner.createdAt,
        closedDate: fleetOwner.closedDate || null,
        pocName: fleetOwner.poc || "",
        email: fleetOwner.email || "",
        mobileNumber: fleetOwner.mobileNo || "",
        addressLine1: fleetOwner.addressLine1 || "",
        addressLine2: fleetOwner.addressLine2 || "",
        pincode: fleetOwner.pincode || "",
        city: fleetOwner.city || "",
        state: fleetOwner.state || "",
      },
      legalDetails: {
        entityName: fleetOwner.entityName || null,
        entityType: fleetOwner.entityType || null,
        gstNumber: fleetOwner.gstNumber || "",
        gstDocUrl: fleetOwner.gstDocUrl || null,
        agreementDocUrl: fleetOwner.agreementDocUrl || null,
      },
      rfidDetails: rfidDetails,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in GetFleetOwnerDetails", error: error.message },
        _functionName,
      );
    }
    throw error;
  }
};
