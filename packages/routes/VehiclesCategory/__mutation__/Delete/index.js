import _ from "underscore";

export default async (_root, _args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> VehiclesCategory -> Delete";

      await Context.Debug({ message: "Deleting categories.." }, _functionName);

      const { ids } = _args;

      if (!ids || ids.length === 0) {
        return new Error("MISSING_IDS");
      }

      const res = await Context.DataBase.vehiclesCategory.deleteMany({
        where: { id: { in: ids } },
      });

      return !!res;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
