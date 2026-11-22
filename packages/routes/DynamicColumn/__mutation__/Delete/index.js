/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { dynamicColumnId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> DynamicColumn -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting dynamicColumn with id: ${dynamicColumnId}` }, _functionName)

      // Get dynamicColumn details of given dynamicColumn id.
      const _DynamicColumnFindUnique = await Context.DataBase.dynamicColumn.findUnique({
        'where': {
          'id': dynamicColumnId
        }
      })

      // If retrieving dynamicColumn details encounters an exception, report failure.
      if (_.isEmpty(_DynamicColumnFindUnique) || _DynamicColumnFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find dynamicColumn with id: ${dynamicColumnId}`, 'error': _DynamicColumnFindUnique }, _functionName)

        // Report failure.
        return _DynamicColumnFindUnique instanceof Error ? _DynamicColumnFindUnique : new Error('EXPECTED_DYNAMIC_COLUMN_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting dynamicColumn with id: ${dynamicColumnId}` }, _functionName)

      // Delete dynamicColumn details of given dynamicColumn id.
      await Context.DataBase.dynamicColumn.update({ 'where': { 'id': dynamicColumnId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _DynamicColumnFindUnique.id,
        'message': 'Successfully removed the dynamicColumn.',
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
