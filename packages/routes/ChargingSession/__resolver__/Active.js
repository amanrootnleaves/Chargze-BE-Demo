
export default async (__, ___, Context) => {
  try {
    if (Context && Context.isContext) {
      if (!Context.Session?.user?.id) return null;
      const accountId = Context.Session.user.id;

      const customerProfile = await Context.DataBase.customerProfile.findUnique({
        where: { Account__fk__: accountId },
      });
      if (!customerProfile) return null;

      return await Context.DataBase.chargingSession.findFirst({
        where: {
          CustomerProfile__fk__: customerProfile.id,
          status: "IN_PROGRESS",
        },
        orderBy: { createdAt: "desc" },
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
