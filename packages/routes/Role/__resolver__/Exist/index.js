/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { role }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Role -> Exist'

      // Style guide.
      await Context.Debug({ 'message': 'Searching role details.' }, _functionName)

      // Fetch all role details from database.
      const _RoleFindMany = await Context.DataBase.role.findMany({
        'where': {
          'isDeleted': false,
          'OR': _.compact(role.map(r => ({ 'displayName': r })))
        },
        'select': {
          'id': true,
          'displayName': true
        },
        'orderBy': {
          'updatedAt': 'desc'
        }
      })

      /*
       * If getting role details contains error
       * than report failure
       */
      if (0 < _RoleFindMany?.length && !(_RoleFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given role details.' }, _functionName)

        // Return role details.
        return _RoleFindMany?.map(j => ({ ...j, '_totalCount': _RoleFindMany?.length, 'message': 'Successfully read the role.', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get role details.', 'error': _RoleFindMany }, _functionName)

      // Report failure.
      return _RoleFindMany instanceof Error ? _RoleFindMany : new Error('FAILED_TO_ROLES')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
