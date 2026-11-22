import { OwnerProfileStatus } from "@prisma/client";
import isOwnerProfileComplete from "../../utils/isOwnerProfileComplete";

export default async (__, { input }, Context) => {
  const _functionName = "Routes -> StationOwner -> Resolver -> Update";

  try {
    const {
      id,
      legalDetails,
      bankingDetails,
      ownerDocument,
      ...directFields
    } = input;

    // 1. ID Validation
    if (!id || typeof id !== "string" || id.trim().length < 10) {
      throw new Error("INVALID_OR_MISSING_OWNER_ID");
    }

    const cleanId = id.trim();

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: `Initiating station owner update for ID: ${cleanId}` },
        _functionName,
      );

      // 2. Check if the record exists
      const existingOwner = await Context.DataBase.stationOwner.findFirst({
        where: {
          id: cleanId,
          isDeleted: false,
        },
      });

      if (!existingOwner) {
        await Context.Debug(
          { message: `Station owner not found for ID: ${cleanId}` },
          _functionName,
        );
        throw new Error("STATION_OWNER_NOT_FOUND");
      }

      // 3. Prepare Update Payload
      const updateData = {
        ...directFields,
      };

      // 4. Handle LegalDetails Relation (Upsert)
      if (legalDetails) {
        updateData.LegalDetails = {
          upsert: {
            create: {
              ...legalDetails,
            },
            update: {
              ...legalDetails,
            },
          },
        };
      }

      // 5. Handle BankingDetails Relation (Upsert)
      if (bankingDetails) {
        updateData.BankingDetails = {
          upsert: {
            create: {
              ...bankingDetails,
            },
            update: {
              ...bankingDetails,
            },
          },
        };
      }

      // 6. Handle OwnerDocument Relation (Upsert)
      if (ownerDocument) {
        updateData.OwnerDocument = {
          upsert: {
            create: {
              ...ownerDocument,
            },
            update: {
              ...ownerDocument,
            },
          },
        };
      }

      // 7. Execute Update Query
      const updatedOwner = await Context.DataBase.stationOwner.update({
        where: { id: cleanId },
        data: updateData,
        include: {
          LegalDetails: true,
          BankingDetails: true,
          OwnerDocument: true,
        },
      });

      const shouldMarkComplete =
        updatedOwner.profileStatus === OwnerProfileStatus.INCOMPLETE &&
        isOwnerProfileComplete(updatedOwner);
      const resultOwner = shouldMarkComplete
        ? await Context.DataBase.stationOwner.update({
            where: { id: cleanId },
            data: { profileStatus: OwnerProfileStatus.COMPLETED },
            include: {
              LegalDetails: true,
              BankingDetails: true,
              OwnerDocument: true,
            },
          })
        : updatedOwner;

      await Context.Debug(
        { message: `Station owner updated successfully for ID: ${cleanId}` },
        _functionName,
      );

      return resultOwner;
    }

    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Failed to update station owner.",
          error: error.message || error,
        },
        _functionName,
      );
    }
    throw error;
  }
};