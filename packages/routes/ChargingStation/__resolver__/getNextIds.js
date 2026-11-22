import crypto from "crypto";
export default async (__, args, Context) => {
  const _functionName = "Routes -> ChargingStation -> Resolver -> getNextIds";
  try {
    if (Context && Context.isContext) {
      
       await Context.Debug(
        { message: "Fetching nextIds" },
        _functionName,
      );
      const lastStation = await Context.DataBase.chargingStation.findFirst({
        where: { stationId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { stationId: true },
      });

      let nextStationNum = 1;
      if (lastStation && lastStation.stationId) {
        const parsed = parseInt(lastStation.stationId, 10);
        if (!isNaN(parsed)) nextStationNum = parsed + 1;
      }
      const nextStationId = String(nextStationNum).padStart(3, "0");

      // Get Next Customer ID (3 digits: 001, 002...)
      const lastCustomer = await Context.DataBase.customerProfile.findFirst({
        orderBy: { createdAt: "desc" }, // Ya id: "desc" agar sequential chahiye
        select: { customerCode: true },
      });

      let nextCustomerNum = 1;
      if (lastCustomer && lastCustomer.customerCode) {
        // Agar format 'CUST-001' hai, toh usko handle karna padega, 
        // par agar sirf '001' save ho raha hai toh ye direct chal jayega:
        const parsed = parseInt(lastCustomer.customerCode, 10);
        if (!isNaN(parsed)) nextCustomerNum = parsed + 1;
      }
      const nextCustomerId = String(nextCustomerNum).padStart(3, "0");

      // 2. Get Next Charging ID (3 digits: 001, 002...)
      const lastCharger = await Context.DataBase.charger.findFirst({
        where: { chargingId: { not: null } },
        orderBy: { chargingId: "desc" },
        select: { chargingId: true },
      });

      let nextChargingNum = 1;

      if (lastCharger?.chargingId) {
        const parsed = parseInt(lastCharger.chargingId, 10);

        if (!isNaN(parsed)) {
          nextChargingNum = parsed + 1;
        }
      }

      const nextChargingId = String(nextChargingNum).padStart(4, "0");
      // 3. Get Next Fleet ID (3 digits: 001, 002...)
      const lastFleet = await Context.DataBase.fleetOwner.findFirst({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        select: { fleetId: true },
      });

      let nextFleetNum = 1;
      if (lastFleet?.fleetId) {
        const parsed = parseInt(lastFleet.fleetId, 10);
        if (!isNaN(parsed)) {
          nextFleetNum = parsed + 1;
        }
      }
      const nextFleetId = String(nextFleetNum).padStart(3, "0");
      let nextRfidTagId = null;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        attempts++;
        // Cryptographically secure integer between 100000 and 999999
        const generatedNum = crypto.randomInt(100000, 1000000);
        const candidateTagId = String(generatedNum);

        const existingTag = await Context.DataBase.rfidTag.findFirst({
          where: {
            tagId: candidateTagId,
            isDeleted: false,
          },
          select: { id: true },
        });

        if (!existingTag) {
          nextRfidTagId = candidateTagId;
          isUnique = true;
        }
      }

      if (!nextRfidTagId) {
        throw new Error("FAILED_TO_GENERATE_UNIQUE_RFID_TAG_ID");
      }

      await Context.Debug(
        {
          message: "NextIds fetched successfully.",
          output: { nextStationId, nextChargingId, nextFleetId, nextRfidTagId },
        },
        _functionName,
      );

      
      return {
        nextStationId,
        nextChargingId,
        nextFleetId,
        nextRfidTagId,
        nextCustomerId
      };
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
     await Context.Debug(
        { message: "Error in fetching nextIds" },
        _functionName,
      );
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};
