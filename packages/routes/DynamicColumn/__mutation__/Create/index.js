/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


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
      const _functionName = 'Routes -> DynamicColumn -> Create'

      // If given user is admin then use account instead of company.
      if (ACCOUNT_TYPE.ADMIN.value === Context.Session.user.accountType) {
        // Make sure that given feature exists.
        const _FeatureFindUnique = await Context.DataBase.feature.findUnique({ 'where': { 'id': featureId } })

        // Report failure if error is caught.
        if (_FeatureFindUnique instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to find feature', 'error': _FeatureFindUnique }, _functionName)

          // Report failure.
          return _FeatureFindUnique
        }
        if (_.isEmpty(_FeatureFindUnique)) {
          // Const assignment.
          const _error = new Error('FEATURE_NOT_FOUND')

          // Style guide.
          await Context.Debug({ 'message': 'Failed to find feature', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Create subAccount under given main account.
        const _DynamicColumnCreate = await Context.DataBase.dynamicColumn.create({
          'data': {
            'Feature': {
              'connect': { 'id': _FeatureFindUnique?.id }
            },
            'Account': {
              'connect': { 'id': Context.Session?.user?.id }
            }
          }
        })

        // If creating dynamicColumn caught exception then report failure.
        if (_DynamicColumnCreate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to create dynamicColumn', 'error': _DynamicColumnCreate }, _functionName)

          // Report failure.
          return _DynamicColumnCreate
        }

        // Style guide.
        await Context.Debug({ 'message': `Successfully created the dynamicColumn` }, _functionName)

        // Return success.
        return {
          ..._DynamicColumnCreate,
          'message': 'Successfully created dynamicColumn.',
          'status': 'CREATE_SUCCESSFUL'
        }
      }

      // Get user company details.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (_.isEmpty(_CompanyOfAccount)) {
        // Const assignment.
        const _error = new Error('COMPANY_NOT_FOUND')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to find company', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Make sure that given feature exists.
      const _FeatureFindUnique = await Context.DataBase.feature.findUnique({ 'where': { 'id': featureId } })

      // Report failure if error is caught.
      if (_FeatureFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find feature', 'error': _FeatureFindUnique }, _functionName)

        // Report failure.
        return _FeatureFindUnique
      }
      if (_.isEmpty(_FeatureFindUnique)) {
        // Const assignment.
        const _error = new Error('FEATURE_NOT_FOUND')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to find feature', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Create subAccount under given main account.
      const _DynamicColumnCreate = await Context.DataBase.dynamicColumn.create({
        'data': {
          'Feature': {
            'connect': { 'id': _FeatureFindUnique?.id }
          },
          'Company': {
            'connect': { 'id': _CompanyOfAccount?.[0]?.id }
          },
          'Account': {
            'connect': { 'id': Context.Session.user.id }
          }
        }
      })

      // If creating dynamicColumn caught exception then report failure.
      if (_DynamicColumnCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create dynamicColumn', 'error': _DynamicColumnCreate }, _functionName)

        // Report failure.
        return _DynamicColumnCreate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the dynamicColumn` }, _functionName)

      // Return success.
      return {
        ..._DynamicColumnCreate,
        'message': 'Successfully created dynamicColumn.',
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
