/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


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
      const _functionName = 'Routes -> Feature -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting feature with id: ${featureId}` }, _functionName)

      // Get feature details of given feature id.
      const _FeatureFindUnique = await Context.DataBase.feature.findUnique({
        'where': {
          'id': featureId
        }
      })

      // If retrieving feature details encounters an exception, report failure.
      if (_.isEmpty(_FeatureFindUnique) || _FeatureFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find feature with id: ${featureId}`, 'error': _FeatureFindUnique }, _functionName)

        // Report failure.
        return _FeatureFindUnique instanceof Error ? _FeatureFindUnique : new Error('EXPECTED_FEATURE_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting feature with id: ${featureId}` }, _functionName)

      // Delete feature details of given feature id.
      await Context.DataBase.feature.update({ 'where': { 'id': featureId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _FeatureFindUnique.id,
        'message': 'Successfully removed the feature.',
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
