
export default async (__, { sessionId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const session = await Context.DataBase.chargingSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) throw new Error("SESSION_NOT_FOUND");

      const _TransactionCreate = await Context.DataBase.transaction.create({
        data: {
          amount: session.amountLimit || 0,
          currency: "INR", 
          status: "SUCCESS",
          type: "PAYMENT",
          gateway: "WALLET", 
          CustomerProfile: { connect: { id: session.CustomerProfile__fk__ } },
        }
      });

      const _SessionUpdate = await Context.DataBase.chargingSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
          energyConsumed: session.energyLimit || 0,
          totalAmount: session.amountLimit || 0,
          Transaction: { connect: { id: _TransactionCreate.id } }
        },
      });

      if (_SessionUpdate && _SessionUpdate.CustomerProfile__fk__) {
        try {
          await Context.DataBase.customerProfile.update({
            where: { id: _SessionUpdate.CustomerProfile__fk__ },
            data: {
              totalOrders: { increment: 1 },
              totalSpend: { increment: _SessionUpdate.totalAmount || 0 },
              lastOrderAt: new Date(),
            },
          });
        } catch (error) {
          console.error("Failed to update customer stats after session stop:", error);
        }
      }

      return _SessionUpdate;
    }
    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    throw error;
  }
};
