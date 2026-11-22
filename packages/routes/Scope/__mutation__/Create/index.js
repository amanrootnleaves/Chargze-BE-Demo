/*
 * IMPORTS
 */
import _ from "underscore"; // Npm: utility module.

/*
 * SIBLINGS
 */
import CompanyOfAccount from "../../../Company/__resolver__/OfAccount";

/*
 * EXPORTS
 */
export default async (
  __,
  {
    displayName,
    description,
    role,
    feature,
    isAllowedToCreate,
    isAllowedToUpdate,
    isAllowedToDelete,
    isAllowedToRead,
  },
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
      const _whatToQuery = {};
      const _functionName = "Routes -> Scope -> Create";

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName });
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description });
      if (!_.isEmpty(feature)) Object.assign(_whatToQuery, { feature });
      if (!_.isEmpty(role)) Object.assign(_whatToQuery, { role });

      // Update permissions.
      Object.assign(_whatToQuery, { isAllowedToCreate });
      Object.assign(_whatToQuery, { isAllowedToUpdate });
      Object.assign(_whatToQuery, { isAllowedToDelete });
      Object.assign(_whatToQuery, { isAllowedToRead });

      // Local variable
      const _CompanyOfAccount = await CompanyOfAccount(
        __,
        { accountId: Context.Session.user.id },
        Context,
      );

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount;

      if (!_.isEmpty(_CompanyOfAccount)) {
        Object.assign(_whatToQuery, {
          Company: { connect: { id: _CompanyOfAccount?.[0]?.id } },
        });
      }

      // Create subAccount under given main account.
      const _ScopeCreate = await Context.DataBase.scope.create({
        data: _whatToQuery,
      });

      // If creating scope caught exception then report failure.
      if (_ScopeCreate instanceof Error) {
        // Style guide.
        await Context.Debug(
          { message: "Failed to create scope", error: _ScopeCreate },
          _functionName,
        );

        // Report failure.
        return _ScopeCreate;
      }

      // Connect connection to feature and scope.
      if (!_.isEmpty(feature)) {
        // Loop over features to connect.
        await Context.DataBase.$transaction(
          async (__tx) => {
            // Const assignment.
            const _promiseToResolve = [];
            const _featureToConnect = _.compact(
              _.flatten(_.pluck(feature, "value")),
            );

            // Loop over feature to connect.
            for (const pack of _featureToConnect) {
              // Push promise.
              _promiseToResolve.push(
                __tx.scope.update({
                  where: {
                    id: _ScopeCreate?.id,
                  },
                  data: {
                    Feature: {
                      connect: {
                        id: pack,
                      },
                    },
                  },
                }),
              );
            }

            // Resolve all promises.
            await Promise.all(_promiseToResolve);
          },
          {
            timeout: 10000,
            minWait: 10000,
          },
        );
      }
      if (!_.isEmpty(role)) {
        // Loop over features to connect.
        await Context.DataBase.$transaction(
          async (__tx) => {
            // Const assignment.
            const _promiseToResolve = [];
            const _roleToConnect = _.compact(_.flatten(_.pluck(role, "value")));

            // Loop over feature to connect.
            for (const pack of _roleToConnect) {
              // Push promise.
              _promiseToResolve.push(
                __tx.scope.update({
                  where: {
                    id: _ScopeCreate?.id,
                  },
                  data: {
                    Role: {
                      connect: {
                        id: pack,
                      },
                    },
                  },
                }),
              );
            }

            // Resolve all promises.
            await Promise.all(_promiseToResolve);
          },
          {
            timeout: 10000,
            minWait: 10000,
          },
        );
      }

      // Style guide.
      await Context.Debug(
        { message: `Successfully created the scope` },
        _functionName,
      );

      // Return success.
      return {
        ..._ScopeCreate,
        message: "Successfully created scope.",
        status: "CREATE_SUCCESSFUL",
      };
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
