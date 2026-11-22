import _ from "underscore";

export default async (
  __,
  { productId, productName, brand, mainCategory, searchText, take, skip },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _whatToQuery = { isDeleted: false };

      const _functionName = "Routes -> Product -> Read";

      take = take ?? 10;
      skip = skip ?? 0;

      await Context.Debug(
        { message: "Searching product details.." },
        _functionName,
      );

      if (!_.isEmpty(productId)) Object.assign(_whatToQuery, { id: productId });
      if (!_.isEmpty(productName))
        Object.assign(_whatToQuery, {
          productName: { contains: productName, mode: "insensitive" },
        });
      if (!_.isEmpty(brand))
        Object.assign(_whatToQuery, {
          brand: { contains: brand, mode: "insensitive" },
        });
      if (!_.isEmpty(mainCategory))
        Object.assign(_whatToQuery, {
          mainCategory: { contains: mainCategory, mode: "insensitive" },
        });

      if (!_.isEmpty(searchText)) {
        Object.assign(_whatToQuery, {
          OR: [
            { productName: { contains: searchText, mode: "insensitive" } },
            { brand: { contains: searchText, mode: "insensitive" } },
            { model: { contains: searchText, mode: "insensitive" } },
            { mainCategory: { contains: searchText, mode: "insensitive" } },
            { subCategory: { contains: searchText, mode: "insensitive" } },
          ],
        });
      }

      const _totalCount = await Context.DataBase.product.count({
        where: _whatToQuery,
      });

      if (_totalCount instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to get count of product details.",
            error: _totalCount,
          },
          _functionName,
        );
        return _totalCount;
      }

      const _ProductFindMany = await Context.DataBase.product.findMany({
        where: _whatToQuery,
        orderBy: {
          createdAt: "desc",
        },
        take,
        skip,
      });

      if (
        0 < _ProductFindMany?.length &&
        !(_ProductFindMany instanceof Error)
      ) {
        await Context.Debug(
          { message: "Successfully got given product details." },
          _functionName,
        );
        console.log("PRISMA RESULT:", _ProductFindMany);
        return _ProductFindMany?.map((j) => {
          // console.log("MAPPED PRODUCT:", j);
          return {
            ...j,
            mrp: j.mrp ? Number(j.mrp) : null,
            taxPercent: j.taxPercent ? Number(j.taxPercent) : null,
            _totalCount,
            message: "Successfully read the products",
            statusMsg: "READ_SUCCESSFUL",
          };
        });
      }

      await Context.Debug(
        { message: `Failed to get product details.`, error: _ProductFindMany },
        _functionName,
      );
      return _ProductFindMany instanceof Error ? _ProductFindMany : [];
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
