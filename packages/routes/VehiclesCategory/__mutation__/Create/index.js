import _ from "underscore";

export default async (_root, _args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> VehiclesCategory -> Create";

      await Context.Debug(
        { message: "Creating vehiclesCategory.." },
        _functionName,
      );

      const { name, description, isActive, imageStoredAt } = _args;

      if (!name) {
        return new Error("MISSING__NAME");
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const dbPayload = {
        name,
        slug,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        imageStoredAt: imageStoredAt || null,
      };

      if (Context.user && Context.user.companyId) {
        dbPayload.Company = { connect: { id: Context.user.companyId } };
      }

      const createdVehiclesCategory = await Context.DataBase.vehiclesCategory.create({
        data: dbPayload,
      });

      return createdVehiclesCategory;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    if (error.code === 'P2002') {
       return new Error("CATEGORY_ALREADY_EXISTS");
    }
    return error;
  }
};
