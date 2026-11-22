
export default async (__, { id }, Context) => {
  try {
    if (Context && Context.isContext) {
      return await Context.DataBase.chargingSession.findUnique({
        where: { id },
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
