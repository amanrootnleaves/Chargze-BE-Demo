import { OwnerProfileStatus } from "@prisma/client";

// Validates 10-digit Indian numbers starting with 6, 7, 8, or 9
const _isValidPhoneNumber = (phone) => {
  if (phone === null || phone === undefined || phone === "") return true;
  if (typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const phoneRegex = /^(?:\+?91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
};

// Check valid Latitude format: numeric string between -90 and 90
const _isValidLatitudeString = (val) => {
  if (val === null || val === undefined || val === "") return true;
  const num = Number(val);
  return !isNaN(num) && num >= -90 && num <= 90;
};

// Check valid Longitude format: numeric string between -180 and 180
const _isValidLongitudeString = (val) => {
  if (val === null || val === undefined || val === "") return true;
  const num = Number(val);
  return !isNaN(num) && num >= -180 && num <= 180;
};

const _hasValue = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
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

export default async (__, { id, input }, Context) => {
  const _functionName =
    "Routes -> ChargingStation -> Mutation -> UpdateChargingStation";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("MISSING__CONTEXT");
    }

    if (!id || typeof id !== "string" || id.trim().length < 5) {
      throw new Error("INVALID_OR_MISSING_STATION_ID");
    }

    const cleanId = id.trim();

    await Context.Debug(
      { message: `Starting station update for ID: ${cleanId}` },
      _functionName,
    );

    // 1. Validation Checks
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

    if (
      input.pocMobile !== undefined &&
      !_isValidPhoneNumber(input.pocMobile)
    ) {
      throw new Error("INVALID_PHONE_NUMBER");
    }

    // 2. Verify Station Existence
    const existingStation = await Context.DataBase.chargingStation.findFirst({
      where: { id: cleanId, isDeleted: false },
    });

    if (!existingStation) {
      throw new Error("CHARGING_STATION_NOT_FOUND");
    }

    const user = Context.Session?.user;
    const accountType = user?.accountType;
    const isAdmin = Context.noAuth || accountType === "ADMIN";
    let accessibleCompanyIds = [];

    if (!isAdmin) {
      if (accountType === "COMPANY") {
        const companies = await Context.DataBase.company.findMany({
          where: {
            Account: { id: user.id },
            isDeleted: false,
          },
          select: { id: true },
        });
        accessibleCompanyIds = companies.map((company) => company.id);

        if (!accessibleCompanyIds.includes(existingStation.Company__fk__)) {
          throw new Error("UNAUTHORIZED_ACCESS");
        }
      } else if (accountType === "EMPLOYEE") {
        const stationAccess =
          await Context.DataBase.accountStationAccess.findFirst({
            where: {
              Account__fk__: user.id,
              ChargingStation__fk__: cleanId,
              isDeleted: false,
            },
            select: { id: true },
          });

        if (!stationAccess) {
          throw new Error("UNAUTHORIZED_ACCESS");
        }
      } else {
        throw new Error("UNAUTHORIZED_ACCESS");
      }
    }

    // 3. Destructure & Casing Normalization
    const {
      stationId: _omitStationId,
      Chargers,
      chargers,
      WeeklyHours,
      weeklyHours,
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
      RemoteOperationConfig,
      ...stationData
    } = input;

    const settingsData = CapitalSettings || LowerSettings;
    const commercialData = CapitalCommercial || LowerCommercial;
    const documentsData = CapitalDocuments || LowerDocuments;
    const chargersList = Chargers || chargers;
    const remoteOpData = remoteOperation || RemoteOperationConfig;
    const weeklyHoursList = WeeklyHours || weeklyHours;

    // 4. Address Fallback Handling
    const updatePayload = { ...stationData };

    if (addressLine1 !== undefined) updatePayload.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updatePayload.addressLine2 = addressLine2;

    if (address !== undefined) {
      updatePayload.address = address;
    } else if (addressLine1 !== undefined || addressLine2 !== undefined) {
      const line1 =
        addressLine1 !== undefined
          ? addressLine1
          : existingStation.addressLine1;
      const line2 =
        addressLine2 !== undefined
          ? addressLine2
          : existingStation.addressLine2;
      updatePayload.address = [line1, line2].filter(Boolean).join(", ").trim();
    }

    if (companyId) {
      if (
        !isAdmin &&
        (accountType !== "COMPANY" ||
          !accessibleCompanyIds.includes(companyId))
      ) {
        throw new Error("UNAUTHORIZED_ACCESS");
      }
      updatePayload.Company = { connect: { id: companyId } };
    }

    if (ownerId !== undefined) {
      if (typeof ownerId !== "string" || !ownerId.trim()) {
        throw new Error("OWNER_ID_IS_REQUIRED");
      }

      const cleanOwnerId = ownerId.trim();
      const targetOwner = await Context.DataBase.stationOwner.findFirst({
        where: { id: cleanOwnerId, isDeleted: false },
      });
      if (!targetOwner) {
        throw new Error("STATION_OWNER_NOT_FOUND");
      }
      updatePayload.StationOwner = { connect: { id: cleanOwnerId } };
    }

    // 1:1 Upserts
    if (settingsData) {
      updatePayload.Settings = {
        upsert: {
          create: { ...settingsData },
          update: { ...settingsData },
        },
      };
    }

    if (commercialData) {
      updatePayload.Commercial = {
        upsert: {
          create: { ...commercialData },
          update: { ...commercialData },
        },
      };
    }

    if (remoteOpData) {
      updatePayload.RemoteOperationConfig = {
        upsert: {
          create: {
            connectorId: remoteOpData.connectorId,
            meterIntervalSeconds: remoteOpData.meterIntervalSeconds,
            selectedOperation: remoteOpData.selectedOperation,
          },
          update: {
            connectorId: remoteOpData.connectorId,
            meterIntervalSeconds: remoteOpData.meterIntervalSeconds,
            selectedOperation: remoteOpData.selectedOperation,
          },
        },
      };
    }

    // 5. Execute Atomic Transaction
    const updatedStation = await Context.DataBase.$transaction(async (tx) => {
      // Handle Documents
      if (Array.isArray(documentsData)) {
        for (const doc of documentsData) {
          const { id: docId, ...docFields } = doc;
          if (docId) {
            await tx.stationDocument.update({
              where: { id: docId },
              data: { ...docFields },
            });
          } else {
            await tx.stationDocument.create({
              data: {
                ...docFields,
                ChargingStation__fk__: cleanId,
              },
            });
          }
        }
      }

      // Handle WeeklyHours if provided
      if (Array.isArray(weeklyHoursList)) {
        await tx.weeklyHour.deleteMany({
          where: { ChargingStation__fk__: cleanId },
        });
        await tx.weeklyHour.createMany({
          data: weeklyHoursList.map((wh) => ({
            ...wh,
            ChargingStation__fk__: cleanId,
          })),
        });
      }

      // Handle Chargers & Charging ID Calculation
      if (Array.isArray(chargersList)) {
        // Fetch all existing chargers to find the absolute max numerical ID
        const allExistingChargers = await tx.charger.findMany({
          where: { chargingId: { not: null } },
          select: { chargingId: true },
        });

        let maxChargingNum = 0;
        for (const c of allExistingChargers) {
          const parsed = parseInt(c.chargingId, 10);
          if (!isNaN(parsed) && parsed > maxChargingNum) {
            maxChargingNum = parsed;
          }
        }

        for (const charger of chargersList) {
          const {
            id: chargerId,
            chargingId: passedChargingId,
            connectors,
            Connectors,
            ...chargerFields
          } = charger;

          const connectorsList = connectors || Connectors;
          let activeChargerId = chargerId;

          if (chargerId) {
            // Existing Charger: Keep existing chargingId completely untouched
            await tx.charger.update({
              where: { id: chargerId },
              data: { ...chargerFields },
            });
          } else {
            // Newly Added Charger: Use frontend-provided ID if available, otherwise compute next sequence
            maxChargingNum += 1;
            const assignedChargingId =
              passedChargingId && passedChargingId.trim() !== ""
                ? passedChargingId.trim()
                : String(maxChargingNum).padStart(4, "0");

            const newCharger = await tx.charger.create({
              data: {
                ...chargerFields,
                chargingId: assignedChargingId,
                ChargingStation__fk__: cleanId,
              },
            });
            activeChargerId = newCharger.id;
          }

          // Handle Connectors
          if (Array.isArray(connectorsList) && activeChargerId) {
            for (const conn of connectorsList) {
              const { id: connId, ...connFields } = conn;
              if (connId) {
                await tx.connector.update({
                  where: { id: connId },
                  data: { ...connFields },
                });
              } else {
                await tx.connector.create({
                  data: {
                    ...connFields,
                    Charger__fk__: activeChargerId,
                  },
                });
              }
            }
          }
        }
      }

      // Main Station Update Query
      return await tx.chargingStation.update({
        where: { id: cleanId },
        data: updatePayload,
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
    });

    // 6. Owner Profile Status Re-Evaluation
    const targetOwnerId =
      ownerId !== undefined
        ? ownerId.trim()
        : existingStation.StationOwner__fk__;
    if (targetOwnerId) {
      const ownerForProfileStatus =
        await Context.DataBase.stationOwner.findUnique({
          where: { id: targetOwnerId },
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
          where: { id: targetOwnerId },
          data: { profileStatus: OwnerProfileStatus.COMPLETED },
        });
      }
    }

    await Context.Debug(
      { message: "ChargingStation Updated Successfully", id: cleanId },
      _functionName,
    );

    return updatedStation;
  } catch (error) {
    await Context.Debug(
      {
        message: "Error in ChargingStation Update Resolver",
        error: error.message || error,
      },
      _functionName,
    );
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};