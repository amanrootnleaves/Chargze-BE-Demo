
export default async (__, { input }, Context) => {
  try {
    if (Context && Context.isContext) {
      if (!Context.Session?.user?.id) throw new Error("UNAUTHORIZED");
      const accountId = Context.Session.user.id;

      const customerProfile = await Context.DataBase.customerProfile.findUnique({
        where: { Account__fk__: accountId },
      });
      if (!customerProfile) throw new Error("CUSTOMER_PROFILE_NOT_FOUND");

      const activeSession = await Context.DataBase.chargingSession.findFirst({
        where: {
          CustomerProfile__fk__: customerProfile.id,
          status: "IN_PROGRESS",
        },
      });
      if (activeSession) throw new Error("SESSION_ALREADY_IN_PROGRESS");

      return await Context.DataBase.chargingSession.create({
        data: {
          status: "IN_PROGRESS",
          startTime: new Date(),
          energyLimit: input.energyLimit,
          amountLimit: input.amountLimit,
          Charger: { connect: { id: input.chargerId } },
          CustomerProfile: { connect: { id: customerProfile.id } },
        },
      });
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    throw error;
  }
};
