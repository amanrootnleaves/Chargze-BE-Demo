
import _ from "underscore";


export default async (__, { phoneNumber, otp, publicKey }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Account -> VerifyOTP";

      await Context.Debug(
        { message: `Verifying OTP for phone number: ${phoneNumber}` },
        _functionName,
      );

      const _Account = await Context.DataBase.account.findFirst({
        where: { phoneNumber },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          isBlocked: true,
          displayName: true,
          thumbnailStoredAt: true,
          accountType: true,
          email: true,
          emailVerified: true,
          phoneNumber: true,
          password: true,
          verificationToken: true,
          verificationTokenExpiry: true,
          Company: {
            where: { isDeleted: false },
            select: { id: true },
          },
        },
      });

      if (!_Account) {
        return new Error("ACCOUNT_NOT_FOUND");
      }

      if (_Account.isBlocked) {
        return new Error("ACCOUNT_IS_BLOCKED");
      }

      if (!_Account.verificationToken || _Account.verificationToken !== otp) {
        return new Error("INVALID_OTP");
      }

      if (
        !_Account.verificationTokenExpiry ||
        new Date() > new Date(_Account.verificationTokenExpiry)
      ) {
        return new Error("EXPIRED_OTP");
      }

      await Context.DataBase.account.update({
        where: { id: _Account.id },
        data: {
          verificationToken: null,
          verificationTokenExpiry: null,
          isActive: true,
          emailVerified: true, 
          ...(publicKey && { publicKey }),
        },
      });

      try {
        let customerProfile = await Context.DataBase.customerProfile.findUnique({
          where: { Account__fk__: _Account.id },
        });

        if (!customerProfile) {
          await Context.Debug({ message: "Creating missing CustomerProfile for account" }, _functionName);
          customerProfile = await Context.DataBase.customerProfile.create({
            data: {
              Account: { connect: { id: _Account.id } },
              customerCode: `CUST_${_Account.id.substring(_Account.id.length - 6)}`,
              status: "ACTIVE",
            },
          });
        }
      } catch (cpError) {
        console.error("[AccountVerifyOTP] Failed to ensure CustomerProfile:", cpError);
      }

      const _SessionJwtSign = await Context.Session.JwtSign(_Account);

      if (!_.isEmpty(_SessionJwtSign) && !(_SessionJwtSign instanceof Error)) {
        return {
          message: `${phoneNumber} logged in successfully.`,
          token: _SessionJwtSign,
          status: "LOGIN_SUCCESSFUL",
          ..._.omit(
            _Account,
            "password",
            "verificationToken",
            "verificationTokenExpiry",
          ),
        };
      }

      return _SessionJwtSign instanceof Error
        ? _SessionJwtSign
        : new Error("REQUIRE_JWT");
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    console.error("[AccountVerifyOTP] Error:", error);
    return error;
  }
};
