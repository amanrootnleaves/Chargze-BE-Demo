export default async (__, { sessionId }, Context) => {
  const _functionName = "Routes -> ChargingSession -> Query -> getEVReceiptDetail";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching EV Receipt Detail with Invoice-based FleetOwner fallback.",
          sessionId,
        },
        _functionName,
      );
    }

    // 1. Fetch session with extended relations (Including ChargingStation)
    const session = await Context.DataBase.chargingSession.findUnique({
      where: { id: sessionId },
      include: {
        Connector: true,
        Charger: {
          include: {
            ChargingStation: true 
          }
        },
        CustomerProfile: true,
        Transaction: true,
      },
    });

    if (!session) {
      if (Context && Context.isContext) {
        await Context.Debug(
          { message: "Session not found in DB.", sessionId },
          _functionName,
        );
      }
      throw new Error("Charging session not found.");
    }

    // 2. Fetch Fleet Owner Details via FleetHubInvoice workaround
    let fleetOwner = null;

    const linkedInvoice = await Context.DataBase.fleetHubInvoice.findFirst({
      where: {
        // NOTE: Agar schema mein relation ka naam 'sessions' hai toh yahan 'sessions' kar dena
        chargingSessions: {
          some: {
            id: sessionId
          }
        }
      },
      include: {
        fleetOwner: true
      }
    });

    if (linkedInvoice && linkedInvoice.fleetOwner) {
      fleetOwner = linkedInvoice.fleetOwner;
    }

    // Formatting Fleet Owner Address
    const ownerAddress = fleetOwner 
      ? `${fleetOwner.addressLine1}${fleetOwner.addressLine2 ? ', ' + fleetOwner.addressLine2 : ''}, ${fleetOwner.city}, ${fleetOwner.state} - ${fleetOwner.pincode}`
      : "N/A";

    // 3. Duration Calculation
    let durationStr = "0h 0m";
    if (session.startTime && session.endTime) {
      const diffMs = new Date(session.endTime) - new Date(session.startTime);
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationStr = `${hours}h ${mins}m`;
    }

    // 4. Tax & Amount Calculations
    const totalAmount = Number(session.totalAmount || 0);
    const energyConsumed = Number(session.energyConsumed || 0);
    const unitRate = session.Connector?.price ? Number(session.Connector.price) : 0;
    
    // Backward calculation for tax: Total = Subtotal + 18% GST
    const subtotal = Number((totalAmount / 1.18).toFixed(2));
    const totalGst = Number((totalAmount - subtotal).toFixed(2));
    const cgst = Number((totalGst / 2).toFixed(2));
    const sgst = Number((totalGst / 2).toFixed(2));

    // 5. Dynamic Invoice Number Generation
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
    const dynamicInvoiceNo = `CHA-${dateStr}-${session.id.slice(-5).toUpperCase()}`;

    // 6. Mapping Final Response
    const response = {
      invoiceNumber: dynamicInvoiceNo,
      invoiceDate: (session.endTime || session.createdAt).toISOString(),
      transactionId: session.Transaction?.id || session.id.slice(-8).toUpperCase(),
      gstin: "09AANCC3782F1ZC", 
      
      // Client Info (Now using Fleet Owner / POC details via Invoice)
      driverName: fleetOwner?.poc || fleetOwner?.ownerName || session.CustomerProfile?.name || "Unknown Client",
      driverAddress: ownerAddress !== "N/A" ? ownerAddress : (session.CustomerProfile?.address || "N/A"),
      driverMobile: fleetOwner?.mobileNo || session.CustomerProfile?.phone || "N/A",
      driverEmail: fleetOwner?.email || session.CustomerProfile?.email || "N/A",
      
      // Station Info
      stationId: session.Charger?.ChargingStation?.name || session.Charger?.name || "N/A",
      stationAddress: session.Charger?.ChargingStation?.address || "N/A",
      connectorType: session.Connector?.connectorType || "N/A",
      
      // Table Data
      stationPointId: session.Connector?.name || "N/A",
      startTime: session.startTime ? session.startTime.toISOString() : null,
      endTime: session.endTime ? session.endTime.toISOString() : null,
      duration: durationStr,
      energyConsumed,
      unitRate,
      sessionAmount: subtotal, 
      
      // Footer / Payment Summary
      paymentMethod: session.Transaction?.paymentMethod || "Wallet",
      subtotal,
      cgst,
      sgst,
      totalGst,
      totalAmountPayable: totalAmount,
      paymentDate: session.Transaction?.createdAt 
                    ? session.Transaction.createdAt.toISOString() 
                    : (session.endTime ? session.endTime.toISOString() : null)
    };

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Receipt mapped successfully.", invoiceNumber: dynamicInvoiceNo },
        _functionName,
      );
    }

    return response;
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};