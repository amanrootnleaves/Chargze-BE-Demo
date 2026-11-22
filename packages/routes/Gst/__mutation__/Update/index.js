/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  gstId,
  displayName,
  description,
  country,
  state
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
      const _functionName = 'Routes -> Gst -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating gst with id: ${gstId}` }, _functionName)

      // Get gst details of given gst id.
      const _GstFindUnique = await Context.DataBase.gst.findUnique({ 'where': { 'id': gstId } })

      // If retrieving gst details encounters an exception, report failure.
      if (_.isEmpty(_GstFindUnique) || _GstFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find gst with id: ${gstId}`, 'error': _GstFindUnique }, _functionName)

        // Report failure.
        return _GstFindUnique instanceof Error ? _GstFindUnique : new Error('EXPECTED_GST_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating gst with id: ${gstId}` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(country) && _.isObject(country)) Object.assign(_whatToQuery, { 'country': JSON.stringify(country) })
      if (!_.isEmpty(state) && _.isObject(state)) Object.assign(_whatToQuery, { 'state': JSON.stringify(state) })

      // Update gst details.
      const _GstUpdate = await Context.DataBase.gst.update({
        'where': {
          'id': _GstFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating gst caught exception
       * then report failure.
       */
      if (_GstUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update gst with id: ${gstId}`, 'error': _GstUpdate }, _functionName)

        // Report failure.
        return _GstUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated gst with id: ${gstId}` }, _functionName)

      // Return success.
      return {
        ..._GstUpdate,
        'message': 'Successfully updated the gst.',
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
