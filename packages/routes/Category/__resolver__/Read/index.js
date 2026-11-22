import _ from "underscore";

export default async (_root, _args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Category -> Read";

      await Context.Debug(
        { message: "Reading categories.." },
        _functionName,
      );

      const { categoryId, search, isActive, take, skip } = _args;

      const whereQuery = {
        isDeleted: false,
      };

      if (categoryId) {
        whereQuery.id = categoryId;
      }

      if (isActive !== undefined) {
        whereQuery.isActive = isActive;
      }

      if (search) {
        whereQuery.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      // Filter by Company if user is scoped
      if (Context.user && Context.user.companyId) {
        whereQuery.Company__fk__ = Context.user.companyId;
      }

      const __take = take || 100;
      const __skip = skip || 0;

      const [categories, totalCount] = await Promise.all([
        Context.DataBase.partsCategory.findMany({
          where: whereQuery,
          take: __take,
          skip: __skip,
          orderBy: { sortOrder: 'asc' } 
        }),
        Context.DataBase.partsCategory.count({ where: whereQuery }),
      ]);

      return categories.map(cat => ({
        ...cat,
        _totalCount: totalCount
      }));
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
