/*
 * EXPORTS
 */
import _ from "underscore"; // NPM: Utility module.

/*
 * SIBLINGS
 */
import CompanyOfAccount from "../../../Company/__resolver__/OfAccount";

/*
 * EXPORTS
 */
export default async (
  __,
  { accountId, emailId, filter, sort, accountType, take, skip, search },
  Context,
) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = { isDeleted: false };
      const _functionName = "Routes -> Account -> Read";

      // Variable assignment.
      take = take ?? 10;
      skip = skip ?? 0;

      // Style guide.
      await Context.Debug(
        { message: "Searching account details.." },
        _functionName,
      );

      // Get company of logged in user if user is not admin.
      if (!["ADMIN", "COMPANY"]?.includes(Context.Session.user.accountType)) {
        // Get Company details.
        const _CompanyOfAccount = await CompanyOfAccount(
          __,
          { accountId: Context.Session.user.id },
          Context,
        );

        // Report failure if error is caught.
        if (_CompanyOfAccount instanceof Error) {
          // Style guide.
          await Context.Debug(
            {
              message:
                "Failed to get company details, continuing without company filter.",
            },
            _functionName,
          );
        }

        // Report failure if company is not found.
        if (
          !(_CompanyOfAccount instanceof Error) &&
          !_.isEmpty(_CompanyOfAccount)
        ) {
          // Get owner of this company.
          const _CompanyOwner = await Context.DataBase.Company.findUnique({
            where: { id: _CompanyOfAccount?.[0].id },
            select: {
              Account: { where: { isDeleted: false }, select: { id: true } },
            },
          });

          // Report failure if error is caught.
          if (_CompanyOwner instanceof Error) {
            // Style guide.
            await Context.Debug(
              {
                message: "Failed to get owner of company.",
                error: _CompanyOwner,
              },
              _functionName,
            );
          } else if (_CompanyOwner?.Account?.id) {
            // Update query.
            Object.assign(_whatToQuery, {
              ParentAccount: { id: _CompanyOwner.Account.id },
            });
          }
        }
      } else if (["COMPANY"]?.includes(Context.Session.user.accountType)) {
        // Update query.
        Object.assign(_whatToQuery, {
          ParentAccount: { id: Context.Session.user.id },
        });
      }

      // Conditional query based on args.
      if (!_.isEmpty(emailId)) Object.assign(_whatToQuery, { email: emailId });
      if (!_.isEmpty(accountType))
        Object.assign(_whatToQuery, { accountType: accountType });
      if (!_.isEmpty(accountId)) Object.assign(_whatToQuery, { id: accountId });
      if (!_.isEmpty(search))
        Object.assign(_whatToQuery, {
          OR: [
            { displayName: { startsWith: search, mode: "insensitive" } },
            { email: { startsWith: search, mode: "insensitive" } },
          ],
        });
      if (_.isEmpty(accountType))
        Object.assign(_whatToQuery, { accountType: { not: "ADMIN" } });
      if (
        Context.Session.user.accountType === ACCOUNT_TYPE.COMPANY.value &&
        _.isEmpty(accountId)
      )
        Object.assign(_whatToQuery, {
          AND: [
            { accountType: { not: "ADMIN" } },
            { accountType: { not: "COMPANY" } },
          ],
        });

      // Fetch count of account table.
      const _totalCount = await Context.DataBase.account.count({
        where: _whatToQuery,
      });

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: "Failed to get count of account details.",
            error: _totalCount,
          },
          _functionName,
        );

        // Report failure.
        return _totalCount;
      }

      // Const assignment.
      const _orderBy = {};

      /*
       * Loop over short if provided and update filters
       * accordingly else proceed with default sorting.
       */
      if (_.isEmpty(sort)) {
        // Update default filter.
        Object.assign(_orderBy, { updatedAt: "desc" });
      } else {
        // Loop over sort and push each sorting.
        for (const j of sort) {
          // Update _orderBy
          _orderBy[j.field] = j.sort || "desc";
        }
      }

      // Add filters to query if they are provided.
      if (!_.isEmpty(filter)) {
        // Update query with fields to filter.
        Object.assign(_whatToQuery, {
          [filter?.logicOperator?.toUpperCase?.()]: filter.items.map((r) =>
            Object.MuiToPrismaFilter(r.field, r.operator, r.value),
          ),
        });
      }

      // Fetch all account details from database.
      const _AccountFindMany = await Context.DataBase.account.findMany({
        where: _whatToQuery,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          isBlocked: true,
          displayName: true,
          thumbnailStoredAt: true,
          accountType: true,
          Role: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              displayName: true,
            },
            take: 100,
          },
          email: true,
          fullName: true,
          phoneNumber: true,
          Company: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
            },
          },
          Gst: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              displayName: true,
              description: true,
              country: true,
              state: true,
            },
            take: 100,
          },
          ProjectEmployee: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              Project: {
                where: {
                  isDeleted: false,
                },
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: _orderBy,
        take,
        skip,
      });

      /*
       * If getting account details contains error
       * than report failure
       */
      if (
        0 < _AccountFindMany?.length &&
        !(_AccountFindMany instanceof Error)
      ) {
        // Style guide.
        await Context.Debug(
          { message: "Successfully got given account details." },
          _functionName,
        );

        // Return account details.
        return _AccountFindMany?.map((j) => ({
          ...j,
          _totalCount,
          message: "Successfully read the accounts",
          status: "READ_SUCCESSFUL",
        }));
      }

      // Style guide.
      await Context.Debug(
        { message: `Failed to get account details.`, error: _AccountFindMany },
        _functionName,
      );

      // Report failure.
      return _AccountFindMany instanceof Error
        ? _AccountFindMany
        : new Error("FAILED_TO_FIND_ACCOUNT");
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
