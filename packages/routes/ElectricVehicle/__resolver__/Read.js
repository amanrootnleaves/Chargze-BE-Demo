import _ from "underscore";

export default async (
  __,
  { vehicleId, vehicleName, brand, vehicleType, searchText, take, skip },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _whatToQuery = { isDeleted: false };
      const _functionName = "Routes -> ElectricVehicle -> Read";

      take = take ?? 10;
      skip = skip ?? 0;

      await Context.Debug(
        { message: "Searching electric vehicle details.." },
        _functionName,
      );

      if (!_.isEmpty(vehicleId)) Object.assign(_whatToQuery, { id: vehicleId });
      if (!_.isEmpty(vehicleName))
        Object.assign(_whatToQuery, {
          vehicleName: { contains: vehicleName, mode: "insensitive" },
        });
      if (!_.isEmpty(brand))
        Object.assign(_whatToQuery, {
          brand: { contains: brand, mode: "insensitive" },
        });
      if (!_.isEmpty(vehicleType))
        Object.assign(_whatToQuery, {
          vehicleType: { contains: vehicleType, mode: "insensitive" },
        });

      if (!_.isEmpty(searchText)) {
        Object.assign(_whatToQuery, {
          OR: [
            { vehicleName: { contains: searchText, mode: "insensitive" } },
            { brand: { contains: searchText, mode: "insensitive" } },
            { model: { contains: searchText, mode: "insensitive" } },
            { vehicleType: { contains: searchText, mode: "insensitive" } },
            { category: { contains: searchText, mode: "insensitive" } },
          ],
        });
      }

      const _totalCount = await Context.DataBase.electricVehicle.count({
        where: _whatToQuery,
      });

      if (_totalCount instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to get count of electric vehicles.",
            error: _totalCount,
          },
          _functionName,
        );
        return _totalCount;
      }

      const _EVFindMany = await Context.DataBase.electricVehicle.findMany({
        where: _whatToQuery,
        orderBy: {
          createdAt: "desc",
        },
        take,
        skip,
      });

      if (
        0 < _EVFindMany?.length &&
        !(_EVFindMany instanceof Error)
      ) {
        await Context.Debug(
          { message: "Successfully got electric vehicle details." },
          _functionName,
        );
        return _EVFindMany?.map((j) => {
          return {
            ...j,
            exShowroomPrice: j.exShowroomPrice ? Number(j.exShowroomPrice) : null,
            onRoadPrice: j.onRoadPrice ? Number(j.onRoadPrice) : null,
            salePrice: j.salePrice ? Number(j.salePrice) : null,
            discountPercent: j.discountPercent ? Number(j.discountPercent) : null,
            motorPowerKW: j.motorPowerKW ? Number(j.motorPowerKW) : null,
            motorTorqueNm: j.motorTorqueNm ? Number(j.motorTorqueNm) : null,
            _totalCount,
            message: "Successfully read the electric vehicles",
            statusMsg: "READ_SUCCESSFUL",
          };
        });
      }

      await Context.Debug(
        { message: `Failed to get electric vehicle details.`, error: _EVFindMany },
        _functionName,
      );
      return _EVFindMany instanceof Error ? _EVFindMany : [];
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
