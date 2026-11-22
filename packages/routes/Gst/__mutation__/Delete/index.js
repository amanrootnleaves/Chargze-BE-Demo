/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { gstId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Gst -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting gst with id: ${gstId}` }, _functionName)

      // Get gst details of given gst id.
      const _GstFindUnique = await Context.DataBase.gst.findUnique({
        'where': {
          'id': gstId
        }
      })

      // If retrieving gst details encounters an exception, report failure.
      if (_.isEmpty(_GstFindUnique) || _GstFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find gst with id: ${gstId}`, 'error': _GstFindUnique }, _functionName)

        // Report failure.
        return _GstFindUnique instanceof Error ? _GstFindUnique : new Error('EXPECTED_GST_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting gst with id: ${gstId}` }, _functionName)

      // Delete gst details of given gst id.
      await Context.DataBase.gst.update({ 'where': { 'id': gstId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _GstFindUnique.id,
        'message': 'Successfully removed the gst.',
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
