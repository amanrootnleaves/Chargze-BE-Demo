export default async (__, { cartItemId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Cart -> RemoveFromCart";
      const _accountId = Context.Session?.user?.id;
      if (!_accountId) return new Error("REQUIRE__LOGIN");

      const item = await Context.DataBase.cartItem.findUnique({
        where: { id: cartItemId },
      });
      if (!item) return new Error("CART_ITEM_NOT_FOUND");

      await Context.DataBase.cartItem.delete({
        where: { id: cartItemId },
      });

      await Context.DataBase.cart.update({
        where: { id: item.Cart__fk__ },
        data: { updatedAt: new Date() }
      });

      const updatedCart = await Context.DataBase.cart.findUnique({
        where: { id: item.Cart__fk__ },
        include: { Items: { where: { isDeleted: false }, include: { Product: true } } },
      });

      await Context.Debug({ message: "Removed item from cart" }, _functionName);
      return {
        ...updatedCart,
        message: "Item removed from cart",
        statusMsg: "SUCCESS",
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
