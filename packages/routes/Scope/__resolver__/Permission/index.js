/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { featureId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Scope -> Permission'

      // Style guide.
      await Context.Debug({ 'message': 'Checking if user has permission.' }, _functionName)

      // If logged user is admin or company then return all permission.
      if ('ADMIN' === Context.Session.user.accountType || 'COMPANY' === Context.Session.user.accountType) {
        // Return all permission.
        return {
          'isAllowedToCreate': true,
          'isAllowedToUpdate': true,
          'isAllowedToDelete': true,
          'isAllowedToRead': true,
          'message': 'Successfully found scope.',
          'status': 'READ_SUCCESSFUL'
        }
      }

      // Check if any scope exists which contains the feature.
      const _ScopeFindMany = await Context.DataBase.scope.findMany({
        'where': {
          'isDeleted': false,
          'Feature': {
            'every': {
              'id': featureId
            }
          },
          'Role': {
            'some': {
              'Account': {
                'some': {
                  'id': Context.Session.user.id
                }
              }
            }
          }
        }
      })

      // If ScopeFindMany is an instance of Error, throw it.
      if (_ScopeFindMany instanceof Error) throw _ScopeFindMany

      // If ScopeFindMany is not an instance of Error, throw a new Error.
      if (!_ScopeFindMany.length) {
        // Report disabled permission.
        return {
          'isAllowedToCreate': false,
          'isAllowedToUpdate': false,
          'isAllowedToDelete': false,
          'isAllowedToRead': false,
          'message': 'Permission disabled.',
          'status': 'READ_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully found scope.', 'error': _ScopeFindMany }, _functionName)

      // Report failure.
      return {
        ..._.first(_ScopeFindMany),
        'message': 'Successfully found scope.',
        'status': 'READ_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
