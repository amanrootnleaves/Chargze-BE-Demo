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
  { scopeId, sort, filter, companyId, displayNameToSearch, take, skip },
  Context,
) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = { isDeleted: false };

      // Const assignment.
      const _functionName = "Routes -> Scope -> Read";

      // Variable assignment.
      take = take ?? 10;
      skip = skip ?? 0;

      // Style guide.
      await Context.Debug(
        { message: "Searching scope details.." },
        _functionName,
      );

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
          { message: "Failed to get company details." },
          _functionName,
        );

        // Report failure.
        return _CompanyOfAccount;
      }

      // Report failure if company is not found.
      if (
        Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value &&
        Context.Session.user.accountType !== ACCOUNT_TYPE.EMPLOYEE.value &&
        _.isEmpty(_CompanyOfAccount)
      ) {
        // Style guide.
        await Context.Debug({ message: "Company not found." }, _functionName);

        // Report failure.
        return new Error("COMPANY_NOT_FOUND");
      }

      // Update _whatToQuery with company id
      if (
        Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value &&
        !_.isEmpty(_CompanyOfAccount) &&
        _.isEmpty(companyId)
      )
        Object.assign(_whatToQuery, {
          Company: { id: { in: _.pluck(_CompanyOfAccount, "id") } },
        });

      // Conditional query based on args.
      if (!_.isEmpty(scopeId))
        Object.assign(_whatToQuery, { id: { equals: scopeId } });
      if (!_.isEmpty(companyId))
        Object.assign(_whatToQuery, { Company: { id: { equals: companyId } } });
      if (!_.isEmpty(displayNameToSearch))
        Object.assign(_whatToQuery, {
          displayName: { contains: displayNameToSearch, mode: "insensitive" },
        });

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

      // Fetch count of scope table.
      const _totalCount = await Context.DataBase.scope.count({
        where: _whatToQuery,
      });

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: "Failed to get count of scope details.",
            error: _totalCount,
          },
          _functionName,
        );

        // Report failure.
        return _totalCount;
      }

      // Fetch all scope details from database.
      const _ScopeFindMany = await Context.DataBase.scope.findMany({
        where: _whatToQuery,
        select: {
          id: true,
          displayName: true,
          description: true,
          role: true,
          feature: true,
          isAllowedToCreate: true,
          isAllowedToUpdate: true,
          isAllowedToDelete: true,
          isAllowedToRead: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: _orderBy,
        take,
        skip,
      });

      if (Array.isArray(_ScopeFindMany)) {
        // Style guide.
        await Context.Debug(
          { message: "Successfully got given scope details." },
          _functionName,
        );

        // Return scope details.
        return _ScopeFindMany?.map((j) => ({
          ...j,
          Account: j?.Account?.map((r) => ({
            ...r,
            _totalCount: j?.Account?.length,
          })),
          _totalCount,
          message: "Successfully read the scopes",
          status: "READ_SUCCESSFUL",
        }));
      }

      // Style guide.
      await Context.Debug(
        { message: "Failed to get scope details.", error: _ScopeFindMany },
        _functionName,
      );

      // Report failure.
      return _ScopeFindMany instanceof Error
        ? _ScopeFindMany
        : new Error("FAILED_TO_FIND_SCOPE");
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
