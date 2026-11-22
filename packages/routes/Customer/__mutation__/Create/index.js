import _ from "underscore";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export default async (
  _root,
  {
    fullName,
    email,
    phoneNumber,
    password,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    gstin,
    walletBalance,
    address,
    customerCode,
    status,
    thumbnailStoredAt,
  },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Customer -> Mutation -> Create";

      await Context.Debug(
        { message: "Creating new customer profile.." },
        _functionName,
      );

      if (!email || !fullName) {
        return new Error("MISSING_REQUIRED_FIELDS");
      }

      const existingAccount = await Context.DataBase.account.findUnique({
        where: { email },
      });

      if (existingAccount) {
        return new Error("ACCOUNT_ALREADY_EXISTS");
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      const result = await Context.DataBase.$transaction(async (prisma) => {
        const lastCustomer = await prisma.customerProfile.findFirst({
          where: { customerCode: { not: null } },
          orderBy: { createdAt: "desc" },
          select: { customerCode: true },
        });

        let nextCustomerNum = 1;
        if (lastCustomer && lastCustomer.customerCode) {
          const parsed = parseInt(lastCustomer.customerCode, 10);
          if (!isNaN(parsed)) nextCustomerNum = parsed + 1;
        }
        const finalCustomerCode = String(nextCustomerNum).padStart(3, "0");

        const newAccount = await prisma.account.create({
          data: {
            email,
            fullName,
            phoneNumber,
            address,
            password: hashedPassword,
            isActive: true,
            accountType: "CUSTOMER",
            thumbnailStoredAt,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
          },
        });

        const newCustomerProfile = await prisma.customerProfile.create({
          data: {
            customerCode: finalCustomerCode,
            status: status || "ACTIVE",
            totalOrders: 0,
            totalSpend: 0,
            gstin: gstin || null,
            walletBalance: walletBalance || 0,
            addressLine1: addressLine1 || null,
            addressLine2: addressLine2 || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
            Account: {
              connect: { id: newAccount.id },
            },

            ...(Context.Session?.user?.Company__fk__
              ? {
                  Company: {
                    connect: { id: Context.Session.user.Company__fk__ },
                  },
                }
              : {}),
          },
          include: {
            Account: true,
            Company: true,
          },
        });

        const _SessionJwtSign = await Context.Session.JwtSign(newAccount);

        if (_SessionJwtSign && !(_SessionJwtSign instanceof Error)) {
          newCustomerProfile.Account.token = _SessionJwtSign;
        }

        return newCustomerProfile;
      });

      if (result) {
        await Context.Debug(
          { message: "Successfully created customer profile." },
          _functionName,
        );
        return {
          ...result,
          message: "Successfully created customer",
          statusMsg: "CREATE_SUCCESSFUL",
        };
      }

      return new Error("FAILED_TO_CREATE_CUSTOMER");
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      { message: "Error creating customer.", error },
      "Routes -> Customer -> Mutation -> Create",
    );
    return error;
  }
};
