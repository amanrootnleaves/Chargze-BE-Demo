
export default async (__, { id }, Context) => {
  try {
    if (Context && Context.isContext) {
      const station = await Context.DataBase.chargingStation.update({
        where: { id },
        data: { isDeleted: true }
      });

      if (!station) {
        return new Error("Station not found");
      }

      return {
        statusMsg: "DELETE_SUCCESSFUL",
        message: "Charging station deleted successfully"
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
