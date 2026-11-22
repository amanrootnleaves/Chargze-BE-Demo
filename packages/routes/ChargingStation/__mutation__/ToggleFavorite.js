
export default async (__, { stationId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const accountId = Context.Session?.user?.id;
      if (!accountId) return new Error("UNAUTHORIZED");

      let customerProfile = await Context.DataBase.customerProfile.findUnique({
        where: { Account__fk__: accountId },
      });

      if (!customerProfile) {
        console.log(`[ToggleFavorite] Creating on-demand CustomerProfile for account: ${accountId}`);
        customerProfile = await Context.DataBase.customerProfile.create({
          data: {
            Account: { connect: { id: accountId } },
            customerCode: `CUST_${accountId.substring(accountId.length - 6)}`,
            status: "ACTIVE",
          },
        });
      }

      const existingFavorite = await Context.DataBase.favoriteStation.findUnique({
        where: {
          CustomerProfile__fk___ChargingStation__fk__: {
            CustomerProfile__fk__: customerProfile.id,
            ChargingStation__fk__: stationId,
          },
        },
      });

      if (existingFavorite && !existingFavorite.isDeleted) {
        await Context.DataBase.favoriteStation.delete({
          where: { id: existingFavorite.id },
        });
      } else {
        await Context.DataBase.favoriteStation.upsert({
          where: {
            CustomerProfile__fk___ChargingStation__fk__: {
              CustomerProfile__fk__: customerProfile.id,
              ChargingStation__fk__: stationId,
            },
          },
          update: { isDeleted: false },
          create: {
            CustomerProfile__fk__: customerProfile.id,
            ChargingStation__fk__: stationId,
            isDeleted: false
          },
        });
      }

      return await Context.DataBase.chargingStation.findUnique({
        where: { id: stationId },
        include: {
          Chargers: true,
          StationReviews: {
            include: {
              CustomerProfile: true
            }
          }
        }
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
