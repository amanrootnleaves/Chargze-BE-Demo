export default async (_, { sessionId, input }, Context) => {
  const _functionName =
    "Routes -> ChargingSession -> Update -> AdminUpdateChargingSession";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("Invalid context");
    }

    const session = await Context.DataBase.chargingSession.findUnique({
      where: {
        id: sessionId,
        isDeleted: false,
      },
    });

    if (!session) {
      throw new Error("Charging session not found.");
    }

    const updatedSession = await Context.DataBase.chargingSession.update({
      where: {
        id: sessionId,
      },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.status === "COMPLETED" && 
          session.status !== "COMPLETED" && {
          endTime: new Date(),
        }),
        ...(input.energyLimit !== undefined && {
          energyLimit: input.energyLimit,
        }),
        ...(input.amountLimit !== undefined && {
          amountLimit: input.amountLimit,
        }),
      },
    });

    Context.Debug(
      { message: "Charging session updated successfully." },
      _functionName,
    );

    return updatedSession;
  } catch (error) {
    Context.Debug(
      { message: error.message || "Failed to update charging session." },
      _functionName,
    );

    throw error;
  }
};
