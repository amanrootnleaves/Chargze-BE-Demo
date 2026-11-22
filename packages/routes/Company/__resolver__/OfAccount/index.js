/*
 * IMPORTS
 */
import _ from "underscore"; // NPM: Utility module.

/*
 * EXPORTS
 */
export default async (__, { accountId, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = "Routes -> Company -> OfAccount";

      // Variable assignment.
      take = take ?? 10;
      skip = skip ?? 0;

      // If logged in user is admin then return as is.
      if (Context.Session.user.accountType === ACCOUNT_TYPE.ADMIN.value)
        return { message: "Found admin, ignoring check", status: "ADMIN_USER" };

      // Style guide.
      await Context.Debug(
        { message: "Searching company details.." },
        _functionName,
      );

      // Get company of given accountId.
      const _CompanyRead = await Context.DataBase.company.findMany({
        where: {
          Account: { id: accountId || Context.Session.user.id },
          isDeleted: false,
        },
        take: take,
        skip: skip,
      });

      // Report failure if error is caught.
      if (_CompanyRead instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: "Company not found for given accountId.",
            error: _CompanyRead,
          },
          _functionName,
        );

        // Report failure.
        return _CompanyRead;
      }
      if (_.isEmpty(_CompanyRead)) {
        // Style guide.
        await Context.Debug(
          {
            message: "Company not found for given accountId.",
            error: _CompanyRead,
          },
          _functionName,
        );

        // Get account details of given accountId.
        const _AccountRead = await Context.DataBase.account.findUnique({
          where: { id: accountId },
          select: { ParentAccount: true },
        });

        // Report failure if error is caught.
        if (_AccountRead instanceof Error) {
          // Style guide.
          await Context.Debug(
            {
              message: "Account not found for given accountId.",
              error: _AccountRead,
            },
            _functionName,
          );

          // Report failure.
          return _AccountRead;
        }
        if (_.isEmpty(_AccountRead)) {
          // Style guide.
          await Context.Debug(
            {
              message: "Account not found for given accountId.",
              error: _AccountRead,
            },
            _functionName,
          );

          // Report failure.
          return new Error("ACCOUNT_NOT_FOUND");
        }
        if (_.isEmpty(_AccountRead?.ParentAccount)) {
          // Style guide.
          await Context.Debug(
            {
              message: "Parent account not found for given accountId.",
              error: _AccountRead,
            },
            _functionName,
          );

          // In some environments, test employees won't have a parent account. Return a safe fallback rather than crashing the ScopeRead operation.
          return [];
        }

        // Get company of parent account.
        const _ParentAccountCompanyRead =
          await Context.DataBase.company.findMany({
            where: {
              Account__fk__: _AccountRead?.ParentAccount?.id,
              isDeleted: false,
            },
            skip,
            take,
          });

        // Report failure if company is not found or error is caught.
        if (_ParentAccountCompanyRead instanceof Error) {
          // Style guide.
          await Context.Debug(
            {
              message: "Parent account not found for given accountId.",
              error: _AccountRead,
            },
            _functionName,
          );

          // Report failure.
          return _ParentAccountCompanyRead;
        }
        if (_.isEmpty(_ParentAccountCompanyRead)) {
          // Style guide.
          await Context.Debug(
            {
              message: "Parent account not found for given accountId.",
              error: _AccountRead,
            },
            _functionName,
          );

          // Report failure.
          return new Error("COMPANY_NOT_FOUND");
        }

        // Return company id.
        return _ParentAccountCompanyRead?.map?.((r) => ({
          ...r,
          message: "Successfully returned the company.",
          status: "READ_SUCCESSFUL",
        }));
      }

      // Report failure.
      return _CompanyRead?.map?.((r) => ({
        ...r,
        message: "Successfully returned the company.",
        status: "READ_SUCCESSFUL",
      }));
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
