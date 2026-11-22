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

      // Disconnect all users from this role.
      await Context.DataBase.role.update({
        'where': { 'id': roleId },
        'data': { 'Account': { 'set': [] } }
      })

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
