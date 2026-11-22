/*
 * IMPORTS
 */
import _ from "underscore"; // Npm: utility module.

/*
 * EXPORTS
 */
export default async (__, { token }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = "Routes -> Account -> VerifyEmail";

      // Style guide.
      await Context.Debug(
        { message: `Verifying email with token: ${token}` },
        _functionName,
      );

      // Find account with given token.
      const _AccountFindFirst = await Context.DataBase.account.findFirst({
        where: {
          verificationToken: token,
        },
      });

      /*
       * If account with given token doesn't exists
       * then return error raising this issue.
       */
      if (_AccountFindFirst instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: `Failed to find account with token: ${token}`,
            error: _AccountFindFirst,
          },
          _functionName,
        );

        // Report failure.
        return _AccountFindFirst;
      } else if (_.isEmpty(_AccountFindFirst)) {
        // Style guide.
        await Context.Debug(
          { message: `Account with token: ${token} not found.` },
          _functionName,
        );

        // Return error
        return new Error("INVALID_TOKEN");
      }

      // Update account status.
      const _AccountUpdate = await Context.DataBase.account.update({
        where: {
          id: _AccountFindFirst.id,
        },
        data: {
          emailVerified: true,
          isActive: true,
          verificationToken: null,
        },
      });

      // If updating account caught exception than report failure.
      if (_.isEmpty(_AccountUpdate) || _AccountUpdate instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: `Failed to verify account with token: ${token}`,
            error: _AccountUpdate,
          },
          _functionName,
        );

        // Report failure.
        return _AccountUpdate instanceof Error
          ? _AccountUpdate
          : new Error("FAILED_TO_VERIFY_ACCOUNT");
      }

      // Style guide.
      await Context.Debug(
        { message: `Account verified with token: ${token}` },
        _functionName,
      );

      // Return success.
      return {
        message: `Email verified successfully.`,
        status: "UPDATE_SUCCESSFUL",
        ..._AccountUpdate,
      };
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
