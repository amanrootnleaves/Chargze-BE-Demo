/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { roleId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Role -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting role with id: ${roleId}` }, _functionName)

      // Get role details of given role id.
      const _RoleFindUnique = await Context.DataBase.role.findUnique({
        'where': {
          'id': roleId
        }
      })

      // If retrieving role details encounters an exception, report failure.
      if (_.isEmpty(_RoleFindUnique) || _RoleFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find role with id: ${roleId}`, 'error': _RoleFindUnique }, _functionName)

        // Report failure.
        return _RoleFindUnique instanceof Error ? _RoleFindUnique : new Error('EXPECTED_ROLES_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting role with id: ${roleId}` }, _functionName)

      // Delete role details of given role id.
      await Context.DataBase.role.update({ 'where': { 'id': roleId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _RoleFindUnique.id,
        'message': 'Successfully removed the role.',
        'status': 'DELETE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
