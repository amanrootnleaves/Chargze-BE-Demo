/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.

/*
 * EXPORTS
 */
export default async (__, { companyFeatureEntryId, data }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> CompanyFeatureEntry -> Update'

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature entry by given company.' }, _functionName)

      /*
       * Check if given companyFeature exists else
       * report failure.
       */
      const _CompanyFeatureEntryFindMany = await Context.DataBase.CompanyFeatureEntry.findMany({
        'where': {
          'id': companyFeatureEntryId
        },
        'select': {
          'id': true,
          'data': true,
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

      /*
       * Const assignment.
       * const _feature = _.compact(_.flatten(_.pluck(_CompanyFeatureEntryFindMany, 'Feature')))
       */


      // /*
      //  * Make sure that given user has permission to create entry
      //  * For given feature else report failure.
      //  */
      // Const _hasPermission = await Context.Role.hasPermission('UPDATE', _.compact(_.flatten(_.pluck(_feature, 'id'))))

      // // Report failure if error is caught.
      // If (_hasPermission instanceof Error) return _hasPermission
      // If (!_hasPermission) return new Error('PERMISSION__DENIED')

      // Before updating the entry create history stamp for given entry.
      const _CompanyFeatureEntryHistoryCreate = await Context.DataBase.CompanyFeatureEntryHistory.create({
        'data': {
          'fromData': _.first(_.compact(_.flatten(_.pluck(_CompanyFeatureEntryFindMany, 'data')))),
          'toData': data,
          'ChangedByAccount': {
            'connect': {
              'id': Context.Session.user.id
            }
          },
          'CompanyFeatureEntry': {
            'connect': {
              'id': companyFeatureEntryId
            }
          }
        }
      })

      // If creating company entry caught exception then report failure.
      if (_CompanyFeatureEntryHistoryCreate instanceof Error) return _CompanyFeatureEntryHistoryCreate

      // If _CompanyFeatureEntryFindMany is not empty then proceed.
      const _FeatureProjectDelete = await Context.DataBase.CompanyFeatureEntry.update({
        'where': {
          'id': companyFeatureEntryId
        },
        'data': {
          'data': data
        }
      })

      /*
       * If _FeatureProjectDelete caught exception
       * then report failure.
       */
      if (_FeatureProjectDelete instanceof Error) return _FeatureProjectDelete

      // Style guide.
      await Context.Debug({ 'message': 'Successfully updated feature entry details.' }, _functionName)

      // Return success.
      return {
        ..._FeatureProjectDelete,
        'message': 'Successfully updated the entry of given feature.',
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
