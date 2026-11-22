/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { scopeId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Scope -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting scope with id: ${scopeId}.` }, _functionName)

      // Get scope details of given scope id.
      const _ScopeFindUnique = await Context.DataBase.scope.findUnique({
        'where': {
          'id': scopeId
        }
      })

      // If retrieving scope details encounters an exception, report failure.
      if (_.isEmpty(_ScopeFindUnique) || _ScopeFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find scope with id: ${scopeId}.`, 'error': _ScopeFindUnique }, _functionName)

        // Report failure.
        return _ScopeFindUnique instanceof Error ? _ScopeFindUnique : new Error('EXPECTED_SCOPE_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting scope with id: ${scopeId}.` }, _functionName)

      // Delete scope details of given scope id.
      await Context.DataBase.scope.update({ 'where': { 'id': scopeId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _ScopeFindUnique.id,
        'message': 'Successfully removed the scope.',
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
