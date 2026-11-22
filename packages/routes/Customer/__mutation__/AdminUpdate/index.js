// Validation helpers (same as your previous code)
function ValidateGSTIN(gstin) {
  if (!gstin) return new Error("GSTIN_REQUIRED");
  gstin = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/; //[cite: 10]
  if (!gstinRegex.test(gstin)) return new Error("INVALID_GSTIN_FORMAT"); //[cite: 10]
  return gstin;
}

function ValidateEmail(email) {
  if (!email) return new Error("EMAIL_REQUIRED");
  email = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //[cite: 11]
  if (!emailRegex.test(email)) return new Error("INVALID_EMAIL"); //[cite: 11]
  return email;
}

export default async (
  _root,
  args,
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Admin -> Customer -> AdminCustomerUpdate";
      
      await Context.Debug({ message: "Admin updating customer profile...", args }, _functionName);

      const {
        customerId,
        fullName,
        email,
        phoneNumber,
        gstin,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        status,
      } = args;

      let validateGSTIN = null;
      let validateEMAIL = null;

      // 1. Get accountId linked to this customer
      const existingCustomer = await Context.DataBase.customerProfile.findUnique({
        where: { id: customerId }
      });

      if (!existingCustomer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }
      const accountId = existingCustomer.Account__fk__;

      // 2. Validations & Duplicate Checks
      if (gstin) {
        validateGSTIN = ValidateGSTIN(gstin); //[cite: 12]
        if (validateGSTIN instanceof Error) throw validateGSTIN; //[cite: 12]
      }

      if (email) {
        validateEMAIL = ValidateEmail(email); //[cite: 12]
        if (validateEMAIL instanceof Error) throw validateEMAIL; //[cite: 12]
        
        // Check email duplicate excluding current account[cite: 12, 13]
        const existingEmail = await Context.DataBase.account.findFirst({
          where: {
            email: validateEMAIL, //[cite: 13]
            NOT: { id: accountId }, //[cite: 13]
          },
        });
        if (existingEmail) {
          throw new Error("EMAIL_ALREADY_EXISTS"); //[cite: 13]
        }
      }

      // 3. Update Account Model (Name, Email, Phone)
      const accountUpdateData = {};
      if (fullName !== undefined) accountUpdateData.fullName = fullName;
      if (email !== undefined) accountUpdateData.email = validateEMAIL;
      if (phoneNumber !== undefined) accountUpdateData.phoneNumber = phoneNumber;

      if (Object.keys(accountUpdateData).length > 0) {
        await Context.Debug({ message: "Updating account details..." }, _functionName); //[cite: 13]
        await Context.DataBase.account.update({
          where: { id: accountId }, //[cite: 14]
          data: accountUpdateData,
        });
      }

      // 4. Handle GST Table Update/Create (Retained your exact logic)
      if (validateGSTIN) {
        await Context.Debug({ message: `Processing GST update: ${validateGSTIN}` }, _functionName); //[cite: 14]
        
        const duplicateGST = await Context.DataBase.gst.findFirst({
          where: {
            gstin: validateGSTIN, //[cite: 14]
            isDeleted: false, //[cite: 14]
            NOT: { Account__fk__: accountId }, //[cite: 14]
          },
        });

        if (duplicateGST) {
          throw new Error("GSTIN_ALREADY_EXISTS"); //[cite: 15]
        }

        const existingGST = await Context.DataBase.gst.findFirst({
          where: {
            Account__fk__: accountId, //[cite: 15]
            isDeleted: false, //[cite: 15]
          },
        });

        if (existingGST) {
          await Context.DataBase.gst.update({
            where: { id: existingGST.id }, //[cite: 15]
            data: { gstin: validateGSTIN }, //[cite: 16]
          });
        } else {
          await Context.DataBase.gst.create({
            data: {
              gstin: validateGSTIN, //[cite: 16]
              Account__fk__: accountId, //[cite: 16]
            },
          });
        }
      }

      // 5. Update CustomerProfile Model (Addresses, Status, GSTIN mapping)
      const profileUpdateData = {};
      if (addressLine1 !== undefined) profileUpdateData.addressLine1 = addressLine1;
      if (addressLine2 !== undefined) profileUpdateData.addressLine2 = addressLine2;
      if (city !== undefined) profileUpdateData.city = city;
      if (state !== undefined) profileUpdateData.state = state;
      if (pincode !== undefined) profileUpdateData.pincode = pincode;
      if (status !== undefined) profileUpdateData.status = status;
      if (validateGSTIN !== null) profileUpdateData.gstin = validateGSTIN;

      await Context.Debug({ message: "Updating customer profile fields..." }, _functionName);
      const finalUpdatedCustomer = await Context.DataBase.customerProfile.update({
        where: { id: customerId },
        data: profileUpdateData,
        include: { Account: true }, // UI ke liye account detail wapas bhej rahe hain
      });

      await Context.Debug({ message: "Admin Customer profile updated successfully." }, _functionName);
      return finalUpdatedCustomer;
    }
    
    return new Error("MISSING_CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Error updating customer profile by admin.",
        error: error.message || error, //[cite: 17]
      },
      "Routes -> Admin -> Customer -> AdminCustomerUpdate" //[cite: 17]
    );
    throw error; //[cite: 17]
  }
};