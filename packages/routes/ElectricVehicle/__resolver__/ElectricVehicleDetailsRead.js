export default async (__, { vehicleId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> ElectricVehicle -> DetailsRead";

      await Context.Debug(
        { message: "Reading electric vehicle details.." },
        _functionName,
      );

      if (!vehicleId) {
        return new Error("Vehicle ID is required.");
      }

      const vehicle = await Context.DataBase.electricVehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return new Error("Electric Vehicle not found.");
      }

      return {
        ...vehicle,
        exShowroomPrice: vehicle.exShowroomPrice ? Number(vehicle.exShowroomPrice) : null,
        onRoadPrice: vehicle.onRoadPrice ? Number(vehicle.onRoadPrice) : null,
        salePrice: vehicle.salePrice ? Number(vehicle.salePrice) : null,
        discountPercent: vehicle.discountPercent ? Number(vehicle.discountPercent) : null,
        motorPowerKW: vehicle.motorPowerKW ? Number(vehicle.motorPowerKW) : null,
        motorTorqueNm: vehicle.motorTorqueNm ? Number(vehicle.motorTorqueNm) : null,
        message: "Successfully read electric vehicle details",
        statusMsg: "READ_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
