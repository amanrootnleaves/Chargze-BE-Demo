import { OwnerProfileStatus } from "@prisma/client";
// Validates 10-digit Indian numbers starting with 6, 7, 8, or 9
const _isValidPhoneNumber = (phone) => {
  if (phone === null || phone === undefined || phone === "") return true; // Optional field ke liye
  if (typeof phone !== "string") return false;

  // Space, dash (-), ya brackets () ignore karein validation ke waqt
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Regex: 10 digits starting with 6-9 (optional +91, 91, or 0 prefix)
  const phoneRegex = /^(?:\+?91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
};
// Check valid Latitude format: numeric string between -90 and 90
const _isValidLatitudeString = (val) => {
  if (val === null || val === undefined || val === "") return true; // Optional field ke liye
  const num = Number(val);
  return !isNaN(num) && num >= -90 && num <= 90;
};

// Check valid Longitude format: numeric string between -180 and 180
const _isValidLongitudeString = (val) => {
  if (val === null || val === undefined || val === "") return true; // Optional field ke liye
  const num = Number(val);
  return !isNaN(num) && num >= -180 && num <= 180;
};
const _hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const _isOwnerProfileComplete = (owner) => {
  const basicDetailsComplete = [
    owner.partnerType,
    owner.ownerName,
    owner.email,
    owner.phoneNumber,
    owner.addressLineOne,
    owner.pincode,
    owner.city,
    owner.state,
  ].every(_hasValue);

  const legalDetailsComplete =
    owner.LegalDetails &&
    [
      owner.LegalDetails.entityName,
      owner.LegalDetails.entityType,
      owner.LegalDetails.aadhaarNumber,
      owner.LegalDetails.panNumber,
      owner.LegalDetails.gstNumber,
    ].every(_hasValue);

  const bankingDetailsComplete =
    owner.BankingDetails &&
    [
      owner.BankingDetails.accountHolderName,
      owner.BankingDetails.accountHolderNumber,
      owner.BankingDetails.accountHolderBank,
      owner.BankingDetails.ifscCode,
    ].every(_hasValue);

  const documentsComplete =
    owner.OwnerDocument &&
    [
      owner.OwnerDocument.aadhaar,
      owner.OwnerDocument.pancard,
      owner.OwnerDocument.gst,
      owner.OwnerDocument.cancelledCheque,
    ].every(_hasValue);

  return Boolean(
    basicDetailsComplete &&
    legalDetailsComplete &&
    bankingDetailsComplete &&
    documentsComplete,
  );
};

export default async (__, { input }, Context) => {
  const _functionName =
    "Routes -> ChargingStation -> Mutation -> CreateChargingStation";
  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Creating chargingStation" },
        _functionName,
      );
      // Mandatory ya provided check
      if (
        input.latitude !== undefined &&
        !_isValidLatitudeString(input.latitude)
      ) {
        throw new Error("INVALID_LATITUDE_FORMAT");
      }

      if (
        input.longitude !== undefined &&
        !_isValidLongitudeString(input.longitude)
      ) {
        throw new Error("INVALID_LONGITUDE_FORMAT");
      }
      // Latitude / Longitude checks ke sath phone number check
      if (
        input.pocMobile !== undefined &&
        !_isValidPhoneNumber(input.pocMobile)
      ) {
        throw new Error("INVALID_PHONE_NUMBER");
      }
      const {
        Chargers,
        WeeklyHours,
        // Casing normalize kar rahe hain taaki ...stationData mein leak na ho
        Settings: CapitalSettings,
        settings: LowerSettings,
        Commercial: CapitalCommercial,
        commercial: LowerCommercial,
        Documents: CapitalDocuments,
        documents: LowerDocuments,
        companyId,
        ownerId,
        addressLine1,
        addressLine2,
        address,
        remoteOperation,
        ...stationData
      } = input;

      const settingsData = CapitalSettings || LowerSettings;
      const commercialData = CapitalCommercial || LowerCommercial;
      const documentsData = CapitalDocuments || LowerDocuments;

      // 1. Mandatory Owner ID Check
      if (!ownerId) {
        throw new Error("OWNER_ID_IS_REQUIRED");
      }

      // 2. Database Mein Owner Exist Karta Hai Ya Nahi Check
      const existingOwner = await Context.DataBase.stationOwner.findUnique({
        where: { id: ownerId },
      });

      if (!existingOwner) {
        throw new Error("STATION_OWNER_NOT_FOUND");
      }

      // 3. Auto Generate Station ID (3-Digit Padded String: 001, 002...)
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
      const autoStationId = String(nextStationNum).padStart(3, "0");

      // 4. Auto Generate Charging ID for Chargers (4-Digit Padded String: 0393, 0394...)
      const lastCharger = await Context.DataBase.charger.findFirst({
        where: { chargingId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { chargingId: true },
      });

      let currentChargingNum = 1; // Base default ID as per Figma
      if (lastCharger && lastCharger.chargingId) {
        const parsed = parseInt(lastCharger.chargingId, 10);
        if (!isNaN(parsed)) currentChargingNum = parsed + 1;
      }

      // Chargers Map Loop (Ab chargingId Charger level par attach ho rahi hai)
      const formattedChargers = Chargers
        ? Chargers.map((charger) => {
            const { connectors, chargingId, ...chargerData } = charger;

            // Agar frontend ne chargingId bheja hai toh wo use hoga, nahi toh auto-increment ID
            const assignedChargingId =
              chargingId || String(currentChargingNum++).padStart(4, "0");

            return {
              ...chargerData,
              chargingId: assignedChargingId, // Charger level par chargingId set ho gayi
              Connectors: connectors
                ? {
                    create: connectors,
                  }
                : undefined,
            };
          })
        : undefined;

      // 5. Address Fallback Handling
      const finalAddress =
        address ||
        [addressLine1, addressLine2].filter(Boolean).join(", ").trim();

      // 6. Create Charging Station
      const station = await Context.DataBase.chargingStation.create({
        data: {
          ...stationData,
          stationId: autoStationId, // Auto-generated stationId
          address: finalAddress,
          addressLine1,
          addressLine2,
          Company__fk__: companyId,
          StationOwner__fk__: ownerId,

          Chargers: formattedChargers
            ? {
                create: formattedChargers,
              }
            : undefined,

          WeeklyHours: WeeklyHours
            ? {
                create: WeeklyHours,
              }
            : undefined,

          Settings: settingsData
            ? {
                create: settingsData,
              }
            : undefined,

          Commercial: commercialData
            ? {
                create: commercialData,
              }
            : undefined,

          Documents: documentsData
            ? {
                create: documentsData,
              }
            : undefined,
          RemoteOperationConfig: remoteOperation
            ? {
                create: {
                  connectorId: remoteOperation.connectorId,
                  meterIntervalSeconds: remoteOperation.meterIntervalSeconds,
                  selectedOperation: remoteOperation.selectedOperation,
                },
              }
            : undefined,
        },
        include: {
          Chargers: {
            include: {
              Connectors: true,
            },
          },
          Company: true,
          StationOwner: true,
          WeeklyHours: true,
          Settings: true,
          Commercial: true,
          Documents: true,
          RemoteOperationConfig: true,
        },
      });

      // 7. Owner Profile Status Auto-Update
      // 7. Owner Profile Status Auto-Update
      const ownerForProfileStatus =
        await Context.DataBase.stationOwner.findUnique({
          where: {
            id: ownerId,
          },
          include: {
            LegalDetails: true,
            BankingDetails: true,
            OwnerDocument: true,
          },
        });

      if (
        ownerForProfileStatus &&
        ownerForProfileStatus.profileStatus === OwnerProfileStatus.INCOMPLETE &&
        _isOwnerProfileComplete(ownerForProfileStatus)
      ) {
        await Context.DataBase.stationOwner.update({
          where: {
            id: ownerId,
          },
          data: {
            profileStatus: OwnerProfileStatus.COMPLETED,
          },
        });
      }
      await Context.Debug(
        { message: "ChargingStation Created" },
        _functionName,
      );
      return station;
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      { message: "Error in ChargingStation Resolver" },
      _functionName,
    );
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};
