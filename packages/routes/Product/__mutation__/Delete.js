export default async (_, { productIds }, Context) => {
  try {
    if (Context && Context.isContext) {
      console.log("Delete mutation received for productIds:", productIds);
      if (!productIds || productIds.length === 0) {
        return new Error("Product IDs are required");
      }
      
      await Context.DataBase.product.updateMany({
        where: {
          id: { in: productIds }
        },
        data: {
          isDeleted: true
        }
      });
      
      return {
        message: "Products deleted successfully",
        statusMsg: "SUCCESS"
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
