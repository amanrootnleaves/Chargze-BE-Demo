/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility library.


/*
 * EXPORTS
 */
export default async (__, { accountId, accountIds, role, dontRemoveOldRole = false }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Role'

      // If both accountIds and accountId are not provided.
      if (_.isEmpty(accountId) && _.isEmpty(accountIds)) return Error('REQUIRE_ACCOUNT_ID_OR_ACCOUNT_IDS')

      // Style guide.
      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Object assignment.
      return await Context.DataBase.$transaction(async __database => {
        // Variable declaration.
        let _dataToReturn

        // Variable assignment.
        _dataToReturn = []

        // Object assignment.
        const _AddRole = async __accountId => {
          // Fetch account with given accountId or current user id.
          const _AccountFindUnique = await __database.account.findUnique({ 'where': { 'id': __accountId } })

          /*
           * If getting account caught exception
           * than report failure.
           */
          if (_AccountFindUnique && _AccountFindUnique instanceof Error) {
            // Style guide.
            await Context.Debug({ 'message': `Failed to find account with id: ${__accountId}`, 'error': _AccountFindUnique }, _functionName)

            // Report failure.
            return _AccountFindUnique
          }

          /*
           * Only proceed if given account exist
           * else report failure.
           */
          if (_AccountFindUnique && _AccountFindUnique.id) {
            // Validate role provided.
            const _RoleExists = await Context.ExecuteGraph(`
              query RoleExistQuery($role: [String]!) {
                RoleExist(role: $role) {
                  id,
                  displayName,
                  status,
                  message
                }
              }
            `, { role }, { ...Context, 'noAuth': true })

            // If Checking scope caught exception.
            if (_RoleExists instanceof Error) {
              // Style guide.
              await Context.Debug({ 'message': `Failed to validate role for account with id: ${__accountId}`, 'error': _RoleExists }, _functionName)

              // Report failure.
              return _RoleExists
            }
            if (0 < _RoleExists?.errors?.length) {
              // Style guide.
              await Context.Debug({ 'message': `Failed to validate role for account with id: ${__accountId}`, 'error': _RoleExists }, _functionName)

              // Report failure.
              return _RoleExists?.errors?.[0]
            }
            if (_.isEmpty(_RoleExists?.data)) {
              // Style guide.
              await Context.Debug({ 'message': `Failed to validate role for account with id: ${__accountId}`, 'error': _RoleExists }, _functionName)

              // Report failure.
              return new Error('EXPECTED_ROLE_TO_EXIST')
            }
            if (_.isEmpty(_RoleExists?.data?.RoleExist)) {
              // Style guide.
              await Context.Debug({ 'message': `Failed to validate role for account with id: ${__accountId}`, 'error': _RoleExists }, _functionName)

              // Report failure.
              return new Error('EXPECTED_ROLE_TO_EXIST')
            }

            // Style guide.
            await Context.Debug({ 'message': `Updating account with id: ${__accountId}` }, _functionName)

            // Don't remove old role if requested.
            if (!dontRemoveOldRole) {
              // Update account detail in database.
              const _AccountDisconnect = await __database.account.update({
                'where': {
                  'id': __accountId
                },
                'data': {
                  'Role': {
                    'set': []
                  }
                }
              })

              /*
               * If disconnecting account caught exception than report
               * failure.
               */
              if (_AccountDisconnect && _AccountDisconnect instanceof Error) {
                // Style guide.
                await Context.Debug({ 'message': `Failed to disconnect scopes with accountId: ${accountId ?? Context.Session.user.id}`, 'error': _AccountDisconnect }, _functionName)

                // Report failure.
                return _AccountDisconnect
              }
            }

            // Const assignment.
            const _ScopesAccountUpdate = []

            // Object assignment.
            const _ConnectAccount = async (___accountId, __scopeId) => {
              // Update account detail in database.
              const _AccountUpdate = await __database.account.update({
                'where': {
                  'id': ___accountId
                },
                'data': {
                  'Role': {
                    'connect': {
                      'id': __scopeId
                    }
                  }
                }
              })

              /*
               * If updating account caught exception than report
               * failure.
               */
              if (_AccountUpdate && _AccountUpdate instanceof Error) {
                // Style guide.
                await Context.Debug({ 'message': `Failed to update account with id: ${___accountId ?? Context.Session.user.id}`, 'error': _AccountUpdate }, _functionName)

                // Report failure.
                return _AccountUpdate
              }

              // Style guide.
              await Context.Debug({ 'message': `Successfully updated account with id: ${___accountId ?? Context.Session.user.id}` }, _functionName)

              // Report done.
              return ({ ..._AccountUpdate, 'message': 'Successfully updated the message', 'status': 'READ_SUCCESSFUL' })
            }

            // Loop over scopes and connect them to the account.
            for (const scope of _RoleExists?.data?.RoleExist ?? []) {
              // Push the promise to the array.
              _ScopesAccountUpdate.push(_ConnectAccount(__accountId, scope.id))
            }

            // Return updates.
            return Promise.all(_ScopesAccountUpdate)
          }

          // Style guide.
          await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

          // Report failure.
          return new Error('FAILED_TO_FIND_ACCOUNT')
        }

        // If accountId is provided then provided
        if (accountId) _dataToReturn.push(_AddRole(accountId))
        if (!_.isEmpty(accountIds)) _dataToReturn = accountIds?.map(r => _AddRole(r))

        //  Await for all.
        await Promise.all(_dataToReturn)

        // Return promise.
        return {
          'message': 'Account role updated successfully',
          'status': 'UPDATE_SUCCESSFUL'
        }
      }, {
        'timeout': 300000
      })
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
