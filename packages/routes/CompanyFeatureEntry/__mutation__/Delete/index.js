/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.

/*
 * EXPORTS
 */
export default async (__, { companyFeatureEntryId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> CompanyFeatureEntry -> Delete'

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature project details.' }, _functionName)

      /*
       * Check if given companyFeature exists else
       * report failure.
       */
      const _CompanyFeatureEntryFindMany = await Context.DataBase.companyFeatureEntry.findMany({
        'where': {
          'id': companyFeatureEntryId
        },
        'select': {
          'id': true,
          'Feature': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true
            }
          }
        }
      })

      /*
       * If _CompanyFeatureEntryFindMany caught exception
       * then report failure.
       */
      if (_CompanyFeatureEntryFindMany instanceof Error) return _CompanyFeatureEntryFindMany

      // If _CompanyFeatureEntryFindMany is empty then report failure.
      if (0 === _CompanyFeatureEntryFindMany.length) return new Error('COMPANY_FEATURE_ENTRY_NOT_FOUND')

      // // Const assignment.
      // Const _feature = _.compact(_.flatten(_.pluck(_CompanyFeatureEntryFindMany, 'Feature')))

      // // /*
      // //  * Make sure that given user has permission to create entry
      // //  * For given feature else report failure.
      // //  */
      // // Const _hasPermission = await Context.Role.hasPermission('DELETE', _.compact(_.flatten(_.pluck(_feature, 'id'))))

      // // // Report failure if error is caught.
      // // If (_hasPermission instanceof Error) return _hasPermission
      // // If (!_hasPermission) return new Error('PERMISSION__DENIED')

      // If _CompanyFeatureEntryFindMany is not empty then proceed.
      const _FeatureProjectDelete = await Context.DataBase.companyFeatureEntry.delete({
        'where': {
          'id': companyFeatureEntryId
        }
      })

      /*
       * If _FeatureProjectDelete caught exception
       * then report failure.
       */
      if (_FeatureProjectDelete instanceof Error) return _FeatureProjectDelete

      // Style guide.
      await Context.Debug({ 'message': 'Successfully deleted feature project details.' }, _functionName)

      // Return success.
      return {
        ..._FeatureProjectDelete,
        'message': 'Successfully deleted the entry of given feature.',
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
