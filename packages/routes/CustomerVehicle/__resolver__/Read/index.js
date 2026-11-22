export default async (_, __, Context) => {
  const _functionName = "Routes -> CustomerVehicle -> Query -> Read";

  try {
    await Context.Debug(
        {
          message: "Fetching vehicles."
        },
        _functionName,
      );
    const _accountId = Context.Session?.user?.id;

    const customerProfile = await Context.DataBase.customerProfile.findUnique({
      where: {
        Account__fk__: _accountId,
      },
    });

    const vehicles = await Context.DataBase.customerVehicle.findMany({
      where: {
        CustomerProfile__fk__: customerProfile.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

     await Context.Debug(
        {
          message: "Vehicles fetched."
        
        },
        _functionName,
      );
    return vehicles || [];
  } catch (error) {
    await Context.Debug(
        {
          message: "Unable to fetch vehicles."
        },
        _functionName,
      );
    throw error;
  }
}

