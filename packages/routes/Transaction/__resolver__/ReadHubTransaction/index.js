export default async (__, { id }, Context) => {
  const _functionName =
    "Routes -> Transactions -> Query -> GetHubTransactionDetails";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Transaction Details", sessionId: id },
        _functionName,
      );
    }

    if (!id) {
      throw new Error("TRANSACTION_ID_REQUIRED");
    }

    // 1. Fetch ChargingSession with all relations
    const session = await Context.DataBase.chargingSession.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        Transaction: true,
        Connector: true,
        Charger: {
          include: {
            ChargingStation: true,
          },
        },
        RfidTag: {
          include: {
            fleetOwner: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    const txn = session.Transaction;
    const charger = session.Charger;
    const station = charger?.ChargingStation;
    const rfid = session.RfidTag;
    const fleet = rfid?.fleetOwner;
    const connector = session.Connector;

    // 2. Pricing Lookup from RfidStationMapping
    let customPricePerKwh = 0;

    if (session.RfidTag__fk__) {
      // Step 1: Connector-level exact match
      let mapping = null;
      if (session.Connector__fk__) {
        mapping = await Context.DataBase.rfidStationMapping.findFirst({
          where: {
            rfidTag__fk__: session.RfidTag__fk__,
            connector__fk__: session.Connector__fk__,
            isDeleted: false,
          },
        });
      }

      // Step 2: Station-level fallback match agar connector specific na mile
      if (!mapping && station?.id) {
        mapping = await Context.DataBase.rfidStationMapping.findFirst({
          where: {
            rfidTag__fk__: session.RfidTag__fk__,
            chargingStation__fk__: station.id,
            isDeleted: false,
          },
        });
      }

      if (mapping && mapping.customPricePerKwh != null) {
        customPricePerKwh = Number(mapping.customPricePerKwh);
      }
    }

    // Step 3: Agar mapping mein price na mile, toh session total se derive karein ya default lein
    if (
      customPricePerKwh === 0 &&
      Number(session.energyConsumed) > 0 &&
      Number(session.totalAmount) > 0
    ) {
      customPricePerKwh = Number(
        (Number(session.totalAmount) / Number(session.energyConsumed)).toFixed(
          2,
        ),
      );
    }

    // 3. Timings & Duration Calculation
    let durationMinutes = null;
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        durationMinutes = Math.round((end - start) / (1000 * 60));
      }
    }

    // 4. Financial & Breakdown Calculations
    const energyDeliveredKwh = Number(session.energyConsumed || 0);
    const energyCost = Number(
      (energyDeliveredKwh * customPricePerKwh).toFixed(2),
    );

    const totalCharged = txn?.amount
      ? Number(txn.amount)
      : Number(session.totalAmount || energyCost);

    // GST calculation (18% standard, or difference breakdown)
    const gstRatePercentage = 18.0;
    const gstAmount = Number(
      ((energyCost * gstRatePercentage) / 100).toFixed(2),
    );

    // Display identifiers
    const displayTxnId =
      txn?.gatewayTxnId || `TXN-${session.id.slice(-4).toUpperCase()}`;

    // Valid enum values: PENDING, SUCCESS, FAILED, CANCELLED, REFUNDED
    let status = "PENDING";

    if (txn?.status) {
      status = txn.status;
    } else if (session.status === "COMPLETED") {
      status = "SUCCESS";
    } else if (session.status === "FAILED") {
      status = "FAILED";
    } else {
      status = "PENDING";
    }
    // Payment Method determination
    let paymentMethod = "Auto-debit (Hub Wallet)";
    if (txn?.gateway) {
      paymentMethod = txn.gateway;
    } else if (txn?.type) {
      paymentMethod = txn.type;
    } else if (session.RfidTag__fk__) {
      paymentMethod = "RFID Wallet";
    }

    const response = {
      id: session.id,
      displayTxnId,
      status,
      createdAt: session.createdAt,
      clientDetails: {
        transactionId: displayTxnId,
        clientName: fleet?.ownerName || "N/A",
        clientId: fleet?.id || "N/A",
        city: station?.city || "N/A",
      },
      stationDetails: {
        hubName: station?.name || "N/A",
        hubId: station?.id || "N/A",
        chargerPort: connector?.name || charger?.name || "DC-01",
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes,
        meterStartValue: null, // Telemetry log mapping point
        meterStopValue: null,
      },
      costBreakdown: {
        energyDeliveredKwh,
        ratePerKwh: customPricePerKwh,
        energyCost,
        couponCode: null,
        couponDiscount: 0,
        gstRatePercentage,
        gstAmount,
        totalCharged,
      },
      paymentDetails: {
        paymentMethod,
        status,
      },
      invoiceUrl: txn?.invoiceUrl || null,
    };

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetched Transaction Details successfully",
          sessionId: id,
          displayTxnId,
        },
        _functionName,
      );
    }

    return response;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Error fetching Transaction Details",
          sessionId: id,
          error: error.message,
        },
        _functionName,
      );
    }
    throw error;
  }
};
