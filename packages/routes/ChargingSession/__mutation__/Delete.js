export default async (__, { sessionId }, Context) => {
  const _functionName =
    "Routes -> ChargingSession -> Mutation -> AdminDeleteChargingSession";
  try {
    if (Context && Context.isContext) {
      Context.Debug(
        { message: "Deleting the charging session", id: sessionId },
        _functionName,
      );
      const session = await Context.DataBase.chargingSession.findFirst({
        where: {
          isDeleted: false,
          id: sessionId,
        },
      });
      if (!session) {
        throw new Error("Charging session not found.");
      }
      const deletedSession = await Context.DataBase.chargingSession.delete({
        where: {
          id: sessionId
        },
      });
      Context.Debug(
        {
          message: " charging session has been deleted by the admin",
          id: sessionId,
        },
        _functionName,
      );
      return {
        id: deletedSession.id,
        isDeleted: true,
      };
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    Context.Debug(
      { message: error.message || "Failed to delete charging session." },
      _functionName,
    );
    throw error;
  }
};
