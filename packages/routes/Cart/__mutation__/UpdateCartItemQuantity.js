export default async (__, { cartItemId, action }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Cart -> UpdateCartItemQuantity";
      const _accountId = Context.Session?.user?.id;
      if (!_accountId) return new Error("REQUIRE__LOGIN");

      const item = await Context.DataBase.cartItem.findUnique({
        where: { id: cartItemId },
      });
      if (!item || item.isDeleted) return new Error("CART_ITEM_NOT_FOUND");

      let updatedCart;

      if (action === "INCREASE") {
        await Context.DataBase.cartItem.update({
          where: { id: cartItemId },
          data: { quantity: item.quantity + 1 },
        });
        
        await Context.Debug({ message: "Increased item quantity in cart" }, _functionName);
      } else if (action === "DECREASE") {
        if (item.quantity > 1) {
          await Context.DataBase.cartItem.update({
            where: { id: cartItemId },
            data: { quantity: item.quantity - 1 },
          });
          await Context.Debug({ message: "Decreased item quantity in cart" }, _functionName);
        } else {
          await Context.DataBase.cartItem.delete({
            where: { id: cartItemId },
          });
          await Context.Debug({ message: "Removed item from cart (quantity reached 0)" }, _functionName);
        }
      } else {
         return new Error("INVALID_ACTION");
      }

      await Context.DataBase.cart.update({
        where: { id: item.Cart__fk__ },
        data: { updatedAt: new Date() }
      });

      updatedCart = await Context.DataBase.cart.findUnique({
        where: { id: item.Cart__fk__ },
        include: { Items: { where: { isDeleted: false }, include: { Product: true } } },
      });

      return {
        ...updatedCart,
        Items: updatedCart?.Items?.map((i) => ({
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
        })),
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
