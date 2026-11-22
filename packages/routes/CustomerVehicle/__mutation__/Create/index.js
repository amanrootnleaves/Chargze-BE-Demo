export default async (__, { input }, Context) => {
  const _functionName = "Routes -> CustomerVehicle -> Mutation -> CreateVehicle";
  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Adding Vehicle to CustomerVehicle.",
          input,
        },
        _functionName,
      );
    }
    const _accountId = Context.Session?.user?.id;
    const normalizedInput = {
  brand: String.toCapitalize(input.brand.trim()),
  model: String.toCapitalize(input.model.trim()),
  chargerType: input.chargerType.trim().toUpperCase(),
  vehicleNumber: input.vehicleNumber.trim().toUpperCase(),
};
    const isVehicleNumberExist = await Context.DataBase.customerVehicle.findFirst({
        where:{
            vehicleNumber:normalizedInput.vehicleNumber
        }
    })
    if(isVehicleNumberExist)
    {
         throw new Error("VEHICLE NUMBER ALREADY EXISTS")

    }
    const customerProfile = await Context.DataBase.customerProfile.findUnique({
      where: {
        Account__fk__: _accountId,
      },
    });
    if(!customerProfile)
    {
        
        throw new Error("CUSTOMER PROFILE NOT FOUND")
    }
    const customerVehicle = await Context.DataBase.customerVehicle.create({
      data: {
        ...normalizedInput,
        CustomerProfile: {
          connect: {
            id: customerProfile.id,
          },
        },
      },
    });
    await Context.Debug(
      {
        message: "Vehicle added in customerVehicle",
      },
      _functionName,
    );
    return customerVehicle;
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while adding vehicle in customerVehicle.",
        error: error.message,
      },
      _functionName,
    );
    throw error;
  }
};
 