export default async (_, { id }, Context) => {
  const _functionName = "Routes -> CustomerVehicle -> Mutation -> Delete";

  try {
    await Context.Debug(
      {
        message: "Removing CustomerVehicle",
      },
      _functionName,
    );
    const _accountId = Context.Session?.user?.id;

    const vehicle = await Context.DataBase.customerVehicle.findFirst({
      where: {
        id,
        isDeleted: false,
        CustomerProfile: {
          Account__fk__: _accountId,
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }
    await Context.Debug(
      {
        message: `CustomerVehicle id ${id} is invalid.`,
      },
      _functionName,
    );
    const deletedCustomerVehicle =
      await Context.DataBase.customerVehicle.delete({
        where: {
          id
        },
      });
    await Context.Debug(
      {
        message: `CustomerVehicle is deleted.`,
      },
      _functionName,
    );
    return {
      id: deletedCustomerVehicle.id,
      isDeleted: true,
    };
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while deleting CustomerVehicle.",
        error: error.message,
      },
      _functionName,
    );
    return error;
  }
};
