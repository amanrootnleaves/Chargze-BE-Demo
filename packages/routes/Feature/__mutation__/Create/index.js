/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.

/*
 * SIBLINGS
 */
import FeatureUpload from '../Upload'

/*
 * EXPORTS
 */
export default async (__, { displayName, description, thumbnailStoredAt }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Feature -> Create'

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })

      // Connect user creating the feature.
      Object.assign(_whatToQuery, { 'Account': { 'connect': { 'id': Context.Session.user.id } } })

      // Create subAccount under given main account.
      const _FeatureCreate = await Context.DataBase.feature.create({
        'data': _whatToQuery
      })

      // If creating feature caught exception then report failure.
      if (_FeatureCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create feature.', 'error': _FeatureCreate }, _functionName)

        // Report failure.
        return _FeatureCreate
      }

      // If image is available then add it.
      if (!_.isEmpty(thumbnailStoredAt)) {
        // Execution mutation for handling image.
        const _FeatureUpload = await FeatureUpload(__, { 'featureId': _FeatureCreate.id, thumbnailStoredAt }, Context)

        // Report failure if error is caught.
        if (_FeatureUpload instanceof Error) {
          // Report failure.
          return _FeatureUpload
        }

        // Assign thumbnailStoredAt to _whatToQuery.
        Object.assign(_whatToQuery, _FeatureUpload)
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the feature` }, _functionName)

      // Return success.
      return {
        ..._FeatureCreate,
        'message': 'Successfully created feature.',
        'status': 'CREATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
