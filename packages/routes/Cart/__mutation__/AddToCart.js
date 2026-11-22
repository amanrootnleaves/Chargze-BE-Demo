import _ from "underscore";

export default async (__, { productId, quantity }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Cart -> AddToCart";
      const _accountId = Context.Session?.user?.id;
      if (!_accountId) return new Error("REQUIRE__LOGIN");

      const account = await Context.DataBase.account.findUnique({
        where: { id: _accountId },
      });
      if (!account) return new Error("ACCOUNT_NOT_FOUND");

      let customerProfile = await Context.DataBase.customerProfile.findUnique({
        where: { Account__fk__: _accountId },
      });

      if (!customerProfile) {
        customerProfile = await Context.DataBase.customerProfile.create({
          data: {
            Account__fk__: _accountId,
            customerCode: "CUST-" + Date.now(),
          },
        });
      }

      let cart = await Context.DataBase.cart.findUnique({
        where: { CustomerProfile__fk__: customerProfile.id },
      });

      if (!cart) {
        cart = await Context.DataBase.cart.create({
          data: {
            CustomerProfile__fk__: customerProfile.id,
          },
        });
      }

      let product = await Context.DataBase.product.findUnique({
        where: { id: productId },
      });
      let vehicle = null;
      if (!product) {
        vehicle = await Context.DataBase.electricVehicle.findUnique({
          where: { id: productId },
        });
      }
      if (!product && !vehicle) return new Error("PRODUCT_NOT_FOUND");

      let existingCartItem = await Context.DataBase.cartItem.findFirst({
        where: {
          Cart__fk__: cart.id,
          OR: [
            { Product__fk__: productId },
            { ElectricVehicle__fk__: productId },
          ],
        },
      });

      if (existingCartItem) {
        if (existingCartItem.isDeleted) {
          await Context.DataBase.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: quantity || 1, isDeleted: false },
          });
        } else {
          await Context.DataBase.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: existingCartItem.quantity + quantity },
          });
        }
      } else {
        await Context.DataBase.cartItem.create({
          data: {
            Cart__fk__: cart.id,
            Product__fk__: product ? productId : null,
            ElectricVehicle__fk__: vehicle ? productId : null,
            quantity: quantity || 1,
          },
        });
      }

      await Context.DataBase.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      });

      const updatedCart = await Context.DataBase.cart.findUnique({
        where: { id: cart.id },
        include: {
          Items: {
            where: { isDeleted: false },
            include: { Product: true, ElectricVehicle: true },
          },
        },
      });

      await Context.Debug({ message: "Added item to cart" }, _functionName);
      return {
        ...updatedCart,
        message: "Item added successfully",
        statusMsg: "SUCCESS",
        Items: updatedCart?.Items
          ? updatedCart.Items.map((item) => ({
              ...item,
              Product: item.Product
                ? {
                    ...item.Product,
                    mrp: item.Product.mrp ? Number(item.Product.mrp) : null,
                    taxPercent: item.Product.taxPercent
                      ? Number(item.Product.taxPercent)
                      : null,
                  }
                : null,
              ElectricVehicle: item.ElectricVehicle
                ? {
                    ...item.ElectricVehicle,
                    exShowroomPrice: item.ElectricVehicle.exShowroomPrice ? Number(item.ElectricVehicle.exShowroomPrice) : null,
                  }
                : null,
            }))
          : [],
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
