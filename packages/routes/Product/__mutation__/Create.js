import _ from "underscore";

export default async (
  __,
  {
    productName,
    mainCategory,
    subCategory,
    childCategory,
    vehicleType,
    fuelType,
    brand,
    model,
    partCode,
    hsnCode,
    oemPartCode,
    mrp,
    taxPercent,
    quantity,
    b2cSale,
    b2cRecommended,
    b2cTrending,
    b2bSale,
    b2bRecommended,
    b2bTrending,
    compactable,
    images,
    companyId,
  },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Product -> Mutation -> Create";

      await Context.Debug({ message: "Creating new product.." }, _functionName);

      if (!productName) {
        return new Error("Product name is required.");
      }

      const _data = {
        productName,
        mrp,
        quantity,
      };

      if (mainCategory !== undefined) _data.mainCategory = mainCategory;
      if (subCategory !== undefined) _data.subCategory = subCategory;
      if (childCategory !== undefined) _data.childCategory = childCategory;
      if (vehicleType !== undefined) _data.vehicleType = vehicleType;
      if (fuelType !== undefined) _data.fuelType = fuelType;
      if (brand !== undefined) _data.brand = brand;
      if (model !== undefined) _data.model = model;
      if (partCode !== undefined) _data.partCode = partCode;
      if (hsnCode !== undefined) _data.hsnCode = hsnCode;
      if (oemPartCode !== undefined) _data.oemPartCode = oemPartCode;
      if (taxPercent !== undefined) _data.taxPercent = taxPercent;
      if (b2cSale !== undefined) _data.b2cSale = b2cSale;
      if (b2cRecommended !== undefined) _data.b2cRecommended = b2cRecommended;
      if (b2cTrending !== undefined) _data.b2cTrending = b2cTrending;
      if (b2bSale !== undefined) _data.b2bSale = b2bSale;
      if (b2bRecommended !== undefined) _data.b2bRecommended = b2bRecommended;
      if (b2bTrending !== undefined) _data.b2bTrending = b2bTrending;
      if (compactable !== undefined) _data.compactable = compactable;
      if (images !== undefined) _data.images = images;

      if (companyId) {
        _data.Company = {
          connect: { id: companyId },
        };
      }

      const _ProductCreate = await Context.DataBase.product.create({
        data: _data,
      });

      if (_ProductCreate instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to create product.",
            error: _ProductCreate,
          },
          _functionName,
        );
        return _ProductCreate;
      }

      await Context.Debug(
        { message: "Successfully created product." },
        _functionName,
      );
  
    console.log(_ProductCreate);
      return {
        ..._ProductCreate,
        message: "Successfully created the product",
        statusMsg: "CREATE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
