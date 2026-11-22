/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.

/*
 * SIBLINGS
 */
import FeatureUpload from '../Upload'

/*
 * EXPORTS
 */
export default async (__, {
  featureId,
  displayName,
  description,
  thumbnailStoredAt,
  fields
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
      const _functionName = 'Routes -> Feature -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating feature with id: ${featureId}` }, _functionName)

      // Get feature details of given feature id.
      const _FeatureFindUnique = await Context.DataBase.feature.findUnique({ 'where': { 'id': featureId } })

      // If retrieving feature details encounters an exception, report failure.
      if (_.isEmpty(_FeatureFindUnique) || _FeatureFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find feature with id: ${featureId}`, 'error': _FeatureFindUnique }, _functionName)

        // Report failure.
        return _FeatureFindUnique instanceof Error ? _FeatureFindUnique : new Error('EXPECTED_FEATURE_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating feature with id: ${featureId}` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(fields)) Object.assign(_whatToQuery, { fields })

      // If image is available then add it.
      if (thumbnailStoredAt && thumbnailStoredAt.then) {
        // Execution mutation for handling image.
        const _FeatureUpload = await FeatureUpload(__, { 'featureId': _FeatureFindUnique?.id, thumbnailStoredAt }, Context)

        // Report failure if error is caught.
        if (_FeatureUpload instanceof Error) {
          // Report failure.
          return _FeatureUpload
        }

        // Assign thumbnailStoredAt to _whatToQuery.
        Object.assign(_whatToQuery, { 'thumbnailStoredAt': _FeatureUpload?.thumbnailStoredAt })
      }

      // Update feature details.
      const _FeatureUpdate = await Context.DataBase.feature.update({
        'where': {
          'id': _FeatureFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating feature caught exception
       * then report failure.
       */
      if (_FeatureUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update feature with id: ${featureId}`, 'error': _FeatureUpdate }, _functionName)

        // Report failure.
        return _FeatureUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated feature with id: ${featureId}` }, _functionName)

      // Return success.
      return {
        ..._FeatureUpdate,
        'message': 'Successfully updated the feature.',
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
