
/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { projectId, featureId, data }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> CompanyFeatureEntry -> Create'

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature project details.' }, _functionName)

      // Get Company details.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get company details.' }, _functionName)

        // Report failure.
        return _CompanyOfAccount
      }

      // Report failure if company is not found.
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) {
        // Style guide.
        await Context.Debug({ 'message': 'Company not found.' }, _functionName)

        // Report failure.
        return new Error('COMPANY_NOT_FOUND')
      }

      // Make sure that given permission exists.
      const _FeatureFindMany = await Context.DataBase.feature.findMany({
        'where': {
          'id': featureId
        }
      })

      /*
       * If _FeatureFindMany caught exception
       * then report failure.
       */
      if (_FeatureFindMany instanceof Error) {
        // Report failure.
        return _FeatureFindMany
      }

      // If _FeatureFindMany is empty then report failure.
      if (0 === _FeatureFindMany.length) return new Error('FEATURE_NOT_FOUND')

      // /*
      //  * Make sure that given user has permission to create entry
      //  * For given feature else report failure.
      //  */
      // Const _hasPermission = await Context.Role.hasPermission('CREATE', [featureId])

      // // Report failure if error is caught.
      // If (_hasPermission instanceof Error) return _hasPermission
      // If (!_hasPermission) return new Error('PERMISSION__DENIED')

      // Create database entry for given request.
      const _CompanyFeatureEntryCreate = await Context.DataBase.companyFeatureEntry.create({
        'data': {
          'data': data,
          'Company': {
            'connect': {
              'id': _.first(_CompanyOfAccount)?.id
            }
          },
          'Feature': {
            'connect': {
              'id': featureId
            }
          },
          'Project': {
            'connect': {
              'id': projectId
            }
          },
          'Account': {
            'connect': {
              'id': Context.Session.user.id
            }
          }
        }
      })

      /*
       * If _CompanyFeatureEntryCreate caught exception
       * then report failure.
       */
      if (_CompanyFeatureEntryCreate instanceof Error) return _CompanyFeatureEntryCreate

      // Style guide.
      await Context.Debug({ 'message': 'Successfully created the entry of given feature.' }, _functionName)

      // Return success.
      return {
        ..._CompanyFeatureEntryCreate,
        'message': 'Successfully created the entry of given feature.',
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
