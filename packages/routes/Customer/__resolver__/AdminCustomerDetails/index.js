export default async (_root, { customerId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName =
        "Routes -> Admin -> Customer -> AdminCustomerDetails";

      await Context.Debug(
        { message: "Fetching single customer details for admin UI..." },
        _functionName,
      );

      // 1. Fetch main customer data along with nested relations
      const customerData = await Context.DataBase.customerProfile.findFirst({
        where: { id: customerId, isDeleted: false },
        include: {
          Account: true,
          CustomerVehicles: {
            where: { isDeleted: false },
          },
          ChargingSessions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              Charger: {
                include: {
                  ChargingStation: true,
                },
              },
              Transaction: true, // <-- Naya include taaki payment/invoice ka data mil sake
              RfidTag: true,
            },
          },
        },
      });

      if (!customerData) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      // 2. Aggregate data for Top Summary Cards (Dynamic)
      const totalSessionsCount = await Context.DataBase.chargingSession.count({
        where: { CustomerProfile__fk__: customerId },
      });

      const sessionAggregates =
        await Context.DataBase.chargingSession.aggregate({
          where: { CustomerProfile__fk__: customerId },
          _sum: {
            energyConsumed: true,
          },
        });

      const totalEnergyKwVal =
        Number(sessionAggregates._sum.energyConsumed) || 0;
      // Abhi totalEnergy ke liye DB field nahi hai, toh Kw ko hi use kar rahe hain
      const totalEnergyVal = totalEnergyKwVal;

      // 3. Format Recent Charging Session for the UI (Real DB Fields mapped)
      let recentSessionFormatted = null;
      if (
        customerData.ChargingSessions &&
        customerData.ChargingSessions.length > 0
      ) {
        const session = customerData.ChargingSessions[0];
        const vehicle = customerData.CustomerVehicles?.[0];

        recentSessionFormatted = {
          id: session.id,
          stationName: session.Charger?.ChargingStation?.name || "N/A",
          status: session.status,
          sessionDate: session.createdAt.getTime().toString(), // Timestamp string mein bhejna
          chargingKw: Number(session.energyConsumed) || 0, // Decimal to Float
          totalSpend: Number(session.totalAmount) || 0, // Decimal to Float
          // Apne DB column ke hisaab se 'tagNumber' ko replace kar lena
          rfidStatus: session.RfidTag
            ? `${session.RfidTag.tagId} - Linked`
            : "Not Linked",
          walletStatus: "Linked", // Iska relation abhi clear nahi tha isliye fallback hai

          // Yeh teeno Transaction model se aayenge, check karlena DB column names!
          invoiceUrl: session.Transaction?.invoiceUrl || "N/A",
          paymentDetails: session.Transaction?.paymentMethod || "N/A",
          offerApplied: session.Transaction?.promoCode || "None",

          vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A",
          registrationNumber: vehicle?.vehicleNumber || "N/A",
          chargerType: session.Charger?.chargingType || "N/A",
        };
      }

      // 4. Return exact structure matching the GraphQL Schema
      return {
        id: customerData.id,
        customerCode: customerData.customerCode || "N/A",

        totalSessions: totalSessionsCount,
        totalEnergy: totalEnergyVal,
        totalEnergyKw: totalEnergyKwVal,

        Account: customerData.Account
          ? {
              id: customerData.Account.id,
              fullName: customerData.Account.fullName,
              phoneNumber: customerData.Account.phoneNumber,
              email: customerData.Account.email,
            }
          : null,
        gstin: customerData.gstin,
        addressLine1: customerData.addressLine1,
        addressLine2: customerData.addressLine2,
        city: customerData.city,
        state: customerData.state,
        pincode: customerData.pincode,
        status: customerData.status,

        recentChargingSession: recentSessionFormatted,

        // Trips abhi nahi bane hain, toh isko empty array bhej rahe hain UI crash se bachane ke liye
        savedTrips: [
          {
            id: "fallback-1",
            source: "Vishwas Nagar (Fallback Dummy)",
            destination: "Muzaffarnagar (Fallback Dummy)",
          },
          {
            id: "fallback-2",
            source: "Vishwas Nagar (Fallback Dummy)",
            destination: "Dehradoon (Fallback Dummy)",
          },
        ],
      };
    }
    return new Error("MISSING_CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Failed to get single customer details.",
        error: error.message || error,
      },
      "Routes -> Admin -> Customer -> AdminCustomerDetails",
    );
    return error;
  }
};
