/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS
 */
import RoleOfAccount from '../OfAccount'
import AccountReadIds from '../../../Account/__resolver__/ReadIds'


/*
 * EXPORTS
 */
export default async (__, {
  roleId,
  displayName,
  description,
  role
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Role -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating role with id: ${roleId}` }, _functionName)

      // Get role details of given role id.
      const _RoleFindUnique = await Context.DataBase.role.findUnique({ 'where': { 'id': roleId } })

      // If retrieving role details encounters an exception, report failure.
      if (_.isEmpty(_RoleFindUnique) || _RoleFindUnique instanceof Error) {
        // Const assignment.
        const _error = _RoleFindUnique || new Error('EXPECTED_ROLE_TO_EXIST')

        // Style guide.
        await Context.Debug({ 'message': `Failed to find role with id: ${roleId}`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Update these scopes for users.
      if (!_.isEmpty(_RoleFindUnique.role) && _.isEmpty(role)) {
        // Disconnect all users from this role.
        await Context.DataBase.role.update({
          'where': { 'id': roleId },
          'data': { 'Account': { 'set': [] } }
        })
      } else if (!_.isEmpty(_RoleFindUnique.role) && !_.isEmpty(role)) {
        // Local variable.
        let _removedDifferences

        // Variable assignment.
        _removedDifferences = []

        // Get old role and new and check the difference.
        const _oldRole = _.compact(_.flatten(_.pluck(_RoleFindUnique.role, 'value')))
        const _newRole = _.compact(_.flatten(_.pluck(role, 'value')))
        const _differences = _.difference(_newRole, _oldRole)

        // If there are differences then remove them.
        if (_.isEmpty(_differences)) {
          // Variable assignment.
          _removedDifferences = _newRole
        } else {
          // Const assignment.
          const _removedDiffPromises = []

          // Object assignment.
          const _RemoveLinks = async __accountId => {
            // Get account from given id.
            const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': __accountId } })

            // Report failure if error is caught.
            if (_AccountFindUnique instanceof Error) return _AccountFindUnique
            if (_.isEmpty(_AccountFindUnique)) return new Error('EXPECTED_ACCOUNT')

            // Remove all accounts with given scope.
            return Context.DataBase.Role.update({
              'where': {
                'id': roleId
              },
              'data': {
                'Account': {
                  'disconnect': {
                    'id': _AccountFindUnique?.id
                  }
                }
              }
            })
          }

          // Loop over the differences and remove link.
          for (const r of _differences) _removedDiffPromises.push(_RemoveLinks(r))

          // Await all differences.
          await Promise.all(_removedDiffPromises)

          // Variable assignment.
          _removedDifferences = _.without(_oldRole, ..._differences)
        }

        /*
         * If there are no differences and ye length differ
         * then merge incoming updates.
         */
        if (!_.isEmpty(_RoleFindUnique.role) && _RoleFindUnique?.role?.length !== role?.length) {
          // Filter out duplicates.
          _removedDifferences = _newRole
        }

        // Get ids of users.
        const _userIds = await AccountReadIds(__, { 'idsToLookup': _removedDifferences }, Context)

        // Report failure if error is caught.
        if (_userIds instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _userIds }, _functionName)

          // Report failure.
          return _userIds
        }

        // Loop through each entry and create role.
        const _RoleOfAccount = await RoleOfAccount(__, { 'accountIds': _userIds, 'role': [displayName] }, Context)

        // If Checking scope caught exception.
        if (_RoleOfAccount instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _RoleOfAccount }, _functionName)

          // Report failure.
          return _RoleOfAccount
        }
        if (_.isEmpty(_RoleOfAccount)) {
          // Const assignment.
          const _error = new Error('EXPECTED_ROLE_TO_EXIST')

          // Style guide.
          await Context.Debug({ 'message': `Failed to create iAmRole for account.`, 'error': _error }, _functionName)

          // Report failure.
          return _error
        }
      } else if (_.isEmpty(_RoleFindUnique.role) && !_.isEmpty(role)) {
        // Const assignment.
        const _newRole = _.compact(_.flatten(_.pluck(role, 'value')))

        // Get ids of users.
        const _userIds = await AccountReadIds(__, { 'idsToLookup': _newRole }, Context)

        // Report failure if error is caught.
        if (_userIds instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _userIds }, _functionName)

          // Report failure.
          return _userIds
        }

        // Loop through each entry and create role.
        const _RoleOfAccount = await RoleOfAccount(__, { 'accountIds': _userIds, 'role': [displayName], 'dontRemoveOldRole': true }, Context)

        // If Checking scope caught exception.
        if (_RoleOfAccount instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _RoleOfAccount }, _functionName)

          // Report failure.
          return _RoleOfAccount
        }
        if (_.isEmpty(_RoleOfAccount)) {
          // Const assignment.
          const _error = new Error('EXPECTED_ROLE_TO_EXIST')

          // Style guide.
          await Context.Debug({ 'message': `Failed to create iAmRole for account.`, 'error': _error }, _functionName)

          // Report failure.
          return _error
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating role with id: ${roleId}` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      Object.assign(_whatToQuery, { 'role': role })

      // Update role details.
      const _RoleUpdate = await Context.DataBase.role.update({
        'where': {
          'id': _RoleFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating role caught exception
       * then report failure.
       */
      if (_RoleUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update role with id: ${roleId}`, 'error': _RoleUpdate }, _functionName)

        // Report failure.
        return _RoleUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated role with id: ${roleId}` }, _functionName)

      // Return success.
      return {
        ..._RoleUpdate,
        'message': 'Successfully updated the role.',
        'status': 'UPDATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
