
import _ from "underscore"; 
import Argon2 from "argon2"; 


export default async (__, { email, password }, Context) => {
  try {
 
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Account -> Login -> WithEmail";

      let _SessionJwtSign;

      await Context.Debug(
        { message: `Logging in account with email: ${email}` },
        _functionName,
      );

      const _AccountFindUnique = await Context.DataBase.account.findUnique({
        where: { email },
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
          password: true,
          Company: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
            },
          },
        },
      });


      if (_AccountFindUnique instanceof Error) {
        await Context.Debug(
          {
            message: `Failed to find account with email: ${email}`,
            error: _AccountFindUnique,
          },
          _functionName,
        );

        return _AccountFindUnique;
      } else if (_.isEmpty(_AccountFindUnique)) {
        await Context.Debug(
          { message: `Account with email: ${email} not found.` },
          _functionName,
        );

        return new Error("ACCOUNT_WITH_EMAIL_NOT_FOUND");
      } else if (_AccountFindUnique?.isBlocked) {
        await Context.Debug(
          { message: `Account with email: ${email} is blocked.` },
          _functionName,
        );

        return new Error("ACCOUNT_IS_BLOCKED");
      } else if (!_AccountFindUnique?.emailVerified) {
        await Context.Debug(
          { message: `Account with email: ${email} is not verified.` },
          _functionName,
        );

        return new Error("ACCOUNT_NOT_VERIFIED");
      }

      await Context.Debug(
        { message: `Verifying password for account with email: ${email}` },
        _functionName,
      );

      const _Argon2Verify = await Argon2.verify(
        _AccountFindUnique.password,
        password,
      );

      if (_Argon2Verify) {
        await Context.Debug(
          { message: `Password verified for account with email: ${email}` },
          _functionName,
        );
        await Context.Debug(
          { message: `Logging in account with email: ${email}` },
          _functionName,
        );

        _SessionJwtSign = await Context.Session.JwtSign(_AccountFindUnique);

        if (
          !_.isEmpty(_SessionJwtSign) &&
          !(_SessionJwtSign instanceof Error)
        ) {
          await Context.Debug({
            message: `Login successful returning token: ${_SessionJwtSign}`,
          });

          return {
            message: `${email} logged in successful.`,
            token: _SessionJwtSign,
            status: "READ_SUCCESSFUL",
            ..._.omit(_AccountFindUnique, "password"),
          };
        }

        await Context.Debug(
          {
            message: `Failed to login account with email: ${email}`,
            error: _SessionJwtSign,
          },
          _functionName,
        );

        return _SessionJwtSign instanceof Error
          ? _SessionJwtSign
          : new Error("REQUIRE_JWT");
      }

      await Context.Debug(
        {
          message: `Failed to verify password for account with email: ${email}`,
        },
        _functionName,
      );

      return new Error("INVALID_CREDENTIALS");
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
