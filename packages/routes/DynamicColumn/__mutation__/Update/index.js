/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { dynamicColumnId, fields }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> DynamicColumn -> Update'

      // Create subAccount under given main account.
      const _DynamicColumnUpdate = await Context.DataBase.dynamicColumn.update({
        'where': { 'id': dynamicColumnId },
        'data': {
          'fields': fields
        }
      })

      // If creating dynamicColumn caught exception then report failure.
      if (_DynamicColumnUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to update the column', 'error': _DynamicColumnUpdate }, _functionName)

        // Report failure.
        return _DynamicColumnUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated the column` }, _functionName)

      // Return success.
      return {
        ..._DynamicColumnUpdate,
        'message': 'Successfully updated the column.',
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
