function ValidateGSTIN(gstin) {
  if (!gstin) {
    return new Error("GSTIN_REQUIRED");
  }

  gstin = gstin.trim().toUpperCase();

  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinRegex.test(gstin)) {
    return new Error("INVALID_GSTIN_FORMAT");
  }

  return gstin;
}

function ValidateEmail(email) {
  if (!email) {
    return new Error("EMAIL_REQUIRED");
  }

  email = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return new Error("INVALID_EMAIL");
  }

  return email;
}

export default async (
  _root,
  { fullName, email, phoneNumber, gstin },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Customer -> Update";
      let validateGSTIN = null;
      let validateEMAIL = null;
      await Context.Debug(
        { message: "Updating customer profile..." },
        _functionName,
      );

      const accountId = Context.Session.user.id;

      if (!accountId) {
        await Context.Debug(
          { message: "Unauthorized request. Account ID not found." },
          _functionName,
        );

        throw new Error("UNAUTHORIZED");
      }

      //validation_of_gstin
      if (gstin) {
        validateGSTIN = ValidateGSTIN(gstin);
        if (validateGSTIN instanceof Error) {
          throw validateGSTIN;
        }
      }

     validateEMAIL = ValidateEmail(email)
     if(validateEMAIL instanceof Error)
     {
      throw validateEMAIL
     }

      // Check email duplicate
      await Context.Debug(
        { message: `Checking email availability: ${validateEMAIL}` },
        _functionName,
      );
      const existingEmail = await Context.DataBase.account.findFirst({
        where: {
          email:validateEMAIL,
          NOT: {
            id: accountId,
          },
        },
      });

      if (existingEmail) {
        await Context.Debug(
          { message: `Email already exists: ${validateEMAIL}` },
          _functionName,
        );

        throw new Error("EMAIL_ALREADY_EXISTS");
      }
      // Update Account
      await Context.Debug(
        { message: "Updating account details..." },
        _functionName,
      );
      await Context.DataBase.account.update({
        where: {
          id: accountId,
        },
        data: {
          fullName,
          email:validateEMAIL,
          phoneNumber,
        },
      });

      await Context.Debug(
        { message: "Account updated successfully." },
        _functionName,
      );

      // Update/Create GST
      if (validateGSTIN) {
        await Context.Debug(
          { message: `Processing GST update: ${validateGSTIN}` },
          _functionName,
        );

        const duplicateGST = await Context.DataBase.gst.findFirst({
          where: {
            gstin: validateGSTIN,
            isDeleted: false,
            NOT: {
              Account__fk__: accountId,
            },
          },
        });

        if (duplicateGST) {
          await Context.Debug(
            { message: `GST already exists: ${validateGSTIN}` },
            _functionName,
          );

          throw new Error("GSTIN_ALREADY_EXISTS");
        }

        const existingGST = await Context.DataBase.gst.findFirst({
          where: {
            Account__fk__: accountId,
            isDeleted: false,
          },
        });

        if (existingGST) {
          await Context.Debug(
            { message: "Existing GST found. Updating GST." },
            _functionName,
          );

          await Context.DataBase.gst.update({
            where: {
              id: existingGST.id,
            },
            data: {
              gstin: validateGSTIN,
            },
          });

          await Context.Debug(
            { message: "GST updated successfully." },
            _functionName,
          );
        } else {
          await Context.Debug(
            { message: "GST not found. Creating new GST." },
            _functionName,
          );

          await Context.DataBase.gst.create({
            data: {
              gstin: validateGSTIN,
              Account__fk__: accountId,
            },
          });

          await Context.Debug(
            { message: "GST created successfully." },
            _functionName,
          );
        }
      }

      await Context.Debug(
        { message: "Customer profile updated successfully." },
        _functionName,
      );
      const updatedCustomer = {};

      if (fullName) updatedCustomer.fullName = fullName;
      if (validateEMAIL) updatedCustomer.email = validateEMAIL;
      if (phoneNumber) updatedCustomer.phoneNumber = phoneNumber;
      if (validateGSTIN) updatedCustomer.gstin = validateGSTIN;

      return updatedCustomer;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Error updating customer profile.",
        error: error.message || error,
      },
      "Routes -> Customer -> Update",
    );

    throw error;
  }
};

