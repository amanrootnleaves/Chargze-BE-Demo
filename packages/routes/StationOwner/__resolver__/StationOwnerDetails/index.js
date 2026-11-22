export default async (__, { id }, Context) => {
  const _functionName = "Routes -> StationOwner -> Resolver -> GetDetails";

  try {
    // ID Validation
    if (!id || typeof id !== "string" || id.trim().length < 10) {
      throw new Error("INVALID_OR_MISSING_OWNER_ID");
    }

    const cleanId = id.trim();

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: `Fetching station owner details for ID: ${cleanId}` },
        _functionName,
      );

      const owner = await Context.DataBase.stationOwner.findFirst({
        where: {
          id: cleanId,
          isDeleted: false,
        },
        include: {
          // Relations ko include karein
          LegalDetails: true,
          BankingDetails: true,
          OwnerDocument: {
            where: { isDeleted: false },
          },
          ChargingStations: {
            where: { isDeleted: false },
          },
        },
      });

      if (!owner) {
        await Context.Debug(
          { message: `Station owner not found for ID: ${cleanId}` },
          _functionName,
        );
        throw new Error("STATION_OWNER_NOT_FOUND");
      }

      await Context.Debug(
        { message: `Fetched station owner details for ID: ${cleanId}` },
        _functionName,
      );

      // Schema casing mapping
      return {
        ...owner,
        legalDetails: owner.LegalDetails,
        bankingDetails: owner.BankingDetails,
        documents: owner.OwnerDocument,
        chargingStations: owner.ChargingStations,
      };
    }

    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Failed to fetch station owner details.",
          error: error.message || error,
        },
        _functionName,
      );
    }
    throw error;
  }
};