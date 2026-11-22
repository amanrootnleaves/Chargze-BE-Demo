export default async (__, { cartId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Cart -> Read";
      const _accountId = Context.Session?.user?.id;
      if (!_accountId) return new Error("REQUIRE__LOGIN");

      let cart;
      if (cartId) {
        cart = await Context.DataBase.cart.findUnique({
          where: { id: cartId },
          include: { Items: { where: { isDeleted: false }, include: { Product: true, ElectricVehicle: true } } },
        });
      } else {
        const customerProfile =
          await Context.DataBase.customerProfile.findUnique({
            where: { Account__fk__: _accountId },
          });
        if (customerProfile) {
          cart = await Context.DataBase.cart.findUnique({
            where: { CustomerProfile__fk__: customerProfile.id },
            include: { Items: { where: { isDeleted: false }, include: { Product: true, ElectricVehicle: true } } },
          });
        }
      }

      await Context.Debug({ message: "Read cart" }, _functionName);
      if (!cart) {
        return {
          cart: null,
          message: "Cart is empty",
          statusMsg: "NOT_FOUND",
        };
      }
      return {
        message: "Successfully fetched cart",
        statusMsg: "SUCCESS",
        cart: {
          ...cart,
          Items: cart.Items?.map((i) => ({
            ...i,
            Product: i.Product
              ? {
                  ...i.Product,
                  mrp: i.Product.mrp ? Number(i.Product.mrp) : null,
                  taxPercent: i.Product.taxPercent
                    ? Number(i.Product.taxPercent)
                    : null,
                }
              : null,
            ElectricVehicle: i.ElectricVehicle
              ? {
                  ...i.ElectricVehicle,
                  exShowroomPrice: i.ElectricVehicle.exShowroomPrice ? Number(i.ElectricVehicle.exShowroomPrice) : null,
                  onRoadPrice: i.ElectricVehicle.onRoadPrice ? Number(i.ElectricVehicle.onRoadPrice) : null,
                  salePrice: i.ElectricVehicle.salePrice ? Number(i.ElectricVehicle.salePrice) : null,
                  discountPercent: i.ElectricVehicle.discountPercent ? Number(i.ElectricVehicle.discountPercent) : null,
                  motorPowerKW: i.ElectricVehicle.motorPowerKW ? Number(i.ElectricVehicle.motorPowerKW) : null,
                  motorTorqueNm: i.ElectricVehicle.motorTorqueNm ? Number(i.ElectricVehicle.motorTorqueNm) : null,
                }
              : null,
          })),
        },
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
