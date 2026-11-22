import _ from "underscore";

export default async (__, { vehicleIds }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> ElectricVehicle -> Mutation -> Delete";

      await Context.Debug({ message: "Deleting electric vehicles.." }, _functionName);

      if (!vehicleIds || vehicleIds.length === 0) {
        return new Error("Missing vehicleIds");
      }

      const res = await Context.DataBase.electricVehicle.updateMany({
        where: { id: { in: vehicleIds } },
        data: { isDeleted: true },
      });

      return {
        message: "Successfully deleted electric vehicles",
        statusMsg: "DELETE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
