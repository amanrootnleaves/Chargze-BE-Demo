
export default async (__, ___, Context) => {
  try {
    if (Context && Context.isContext) {
      return await Context.DataBase.chargingSession.findMany({
        orderBy: { createdAt: "desc" },
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
