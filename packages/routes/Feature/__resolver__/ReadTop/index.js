/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { startDate, endDate, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Const assignment.
      const _whatToQuery = { 'isDeleted': false }
      const _functionName = 'Routes -> Feature -> ReadTop'

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature details.' }, _functionName)

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

      // Update company id.
      Object.assign(_whatToQuery, ({ 'Company': { 'id': { 'equals': _CompanyOfAccount?.[0]?.id } } }))

      // Update query if date is passed.
      if (startDate && endDate) Object.assign(_whatToQuery, ({ 'createdAt': { 'gte': startDate, 'lte': endDate } }))

      // Find all features.
      const _FeatureGroupBy = await Context.DataBase.companyFeatureEntry.groupBy({
        'by': ['Feature__fk__'],
        'where': _whatToQuery,
        '_count': { 'Feature__fk__': true },
        'orderBy': { '_count': { 'Feature__fk__': 'desc' } },
        skip,
        take
      })

      /*
       * If getting feature details contains error
       * than report failure
       */
      if (!_.isEmpty(_FeatureGroupBy) && !(_FeatureGroupBy instanceof Error)) {
        // Enrich with feature details
        const featureIds = _.compact(_FeatureGroupBy.map(f => f.Feature__fk__))

        // Find all matching features.
        const _FeatureFindMany = await Context.DataBase.feature.findMany({
          'where': { 'id': { 'in': featureIds }, 'isDeleted': false },
          'select': {
            'id': true,
            'displayName': true
          }
        })

        // If features is not find then report failure.
        if (_.isEmpty(_FeatureFindMany)) {
          // Const assignment.
          const _error = new Error('FAILED_TO_FIND_FEATURES')

          // Style guide.
          Context.Debug({ 'message': 'Failed to find feature.', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Merge counts with feature info
        const result = _.compact(_FeatureGroupBy.map(tf => {
          // Find given feature.
          const feature = _FeatureFindMany.find(f => f.id === tf.Feature__fk__)

          // If feature is empty then return empty object.
          if (!feature) return void 0

          // Return feature.
          return {
            'displayName': feature.displayName,
            'count': tf._count.Feature__fk__,
            ...feature
          }
        }))

        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given feature details.' }, _functionName)

        // Return feature details.
        return {
          '_analytics': result,
          'message': 'Successfully got given feature details.',
          'status': 'READ_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _FeatureGroupBy }, _functionName)

      // Report failure.
      return _FeatureGroupBy instanceof Error ? _FeatureGroupBy : new Error('FAILED_TO_AGGREGATE')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
