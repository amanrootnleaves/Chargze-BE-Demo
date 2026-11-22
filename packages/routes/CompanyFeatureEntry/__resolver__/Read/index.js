/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS.
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'
import WorkflowStepCondition from '../../../WorkflowStep/__resolver__/Condition'
import ScopePermission from '../../../Scope/__resolver__/Permission'


/*
 * EXPORTS
 */
export default async (__, { projectId, featureId, companyFeatureEntryId, startDate, filter, sort, endDate, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = [`"isDeleted" = false`]

      // Const assignment.
      const _functionName = 'Routes -> CompanyFeatureEntry -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature project details.' }, _functionName)

      // Check if given feature presents.
      const _FeatureFindUnique = await Context.DataBase.feature.findUnique({ 'where': { 'id': featureId } })

      /*
       * Report failure if finding iAmRole caught
       * exception else continue.
       */
      if (_FeatureFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find iAmRole', 'error': _FeatureFindUnique })

        // Report failure.
        return _FeatureFindUnique
      }

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      // If given account is Employee or Vendor.
      if ([ACCOUNT_TYPE.EMPLOYEE.value, ACCOUNT_TYPE.VENDOR.value]?.includes(Context.Session.user.accountType)) {
        // Local variable.
        let _WorkflowStep

        // Get workflow steps for given feature entry.
        _WorkflowStep = await Context.DataBase.workflow.findMany({
          'where': {
            'isDeleted': false,
            'Feature__fk__': _FeatureFindUnique.id,
            'Company__fk__': _.first(_CompanyOfAccount)?.id,
            'Project__fk__': projectId
          },
          'select': {
            'id': true,
            'displayName': true,
            'isRequired': true
          },
          'orderBy': {
            'updatedAt': 'desc'
          }
        })
        _WorkflowStep = _.first(_WorkflowStep)

        // Get conditions for given user.
        const _WorkflowStepCondition = await WorkflowStepCondition(__, { 'workflowId': _WorkflowStep?.id, 'accountId': Context.Session.user.id }, Context)

        // If conditions is not empty then push it.
        if (!_.isEmpty(_WorkflowStepCondition)) _whatToQuery.push(Object.MuiToPrismaRawQueryFilter({ 'items': _WorkflowStepCondition }, _FeatureFindUnique?.fields))
        if (_.isEmpty(_WorkflowStepCondition) && _WorkflowStep?.isRequired) return new Error('PERMISSION__DENIED')

        // Get user scope.
        const _UserScope = await ScopePermission(__, { 'featureId': _FeatureFindUnique?.id }, Context)

        // If error is caught then report failure.
        if (_UserScope instanceof Error && !(_WorkflowStep?.isRequired)) return _UserScope
        if (_.isEmpty(_UserScope) && _WorkflowStep?.isRequired) return new Error('PERMISSION__DENIED')

        // If user is not allowed to read then report failure.
        if (!_UserScope?.isAllowedToRead && _WorkflowStep?.isRequired) return new Error('PERMISSION__DENIED')
      }

      // Conditional query based on args.
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value) _whatToQuery.push(`"Company__fk__" IN ('${_CompanyOfAccount?.map?.(r => r.id)?.join(', ')}')`)
      if (!_.isEmpty(featureId)) _whatToQuery.push(`"Feature__fk__" = '${featureId}'`)
      if (!_.isEmpty(companyFeatureEntryId)) _whatToQuery.push(`"id" = '${companyFeatureEntryId}'`)
      if (startDate && endDate) {
        // Add filter to the query.
        _whatToQuery.push(`"updatedAt" >= '${startDate.toISOString()}'::timestamptz`)
        _whatToQuery.push(`"updatedAt" <= '${endDate.toISOString()}'::timestamptz`)
      }

      // Const assignment.
      const _orderBy = []

      /*
       * Loop over short if provided and update filters
       * accordingly else proceed with default sorting.
       */
      if (_.isEmpty(sort)) {
        // Update default filter.
        _orderBy.push(`"updatedAt" DESC`)
      } else {
        // Loop over sort and push each sorting.
        for (const j of sort) {
          // Update _orderBy
          _orderBy.push(`(data->>'${j.field}') ${j.sort || 'desc'}`)
        }
      }

      // Add filters to query if they are provided.
      if (!_.isEmpty(filter) && !_.isEmpty(filter.items)) {
        // Update query with fields to filter.
        _whatToQuery.push(Object.MuiToPrismaRawQueryFilter(filter, _FeatureFindUnique?.fields))
      }

      // Fetch count of feature project table.
      const _totalCount = await Context.DataBase.$queryRawUnsafe(`
        SELECT COUNT(*)::int AS total
        FROM "CompanyFeatureEntry"
        WHERE ${_whatToQuery.join(' AND ')}
      `)

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of feature project details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all feature project details from database.
      const _CompanyFeatureEntryFindMany = await Context.DataBase.$queryRawUnsafe(`
        SELECT *
        FROM "CompanyFeatureEntry"
        WHERE ${_whatToQuery.join(' AND ')}
        ORDER BY ${_orderBy.join(', ')}
        LIMIT ${take} OFFSET ${skip}
      `)

      // If error is caught then report failure.
      if (_CompanyFeatureEntryFindMany instanceof Error) return _CompanyFeatureEntryFindMany

      /*
       * If getting feature details contains error
       * than report failure
       */
      if (0 < _CompanyFeatureEntryFindMany?.length) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given feature details.' }, _functionName)

        // Return feature details.
        return _CompanyFeatureEntryFindMany?.map(j => ({ ...j,
          '_totalCount': _totalCount?.[0]?.total,
          '_fields': _FeatureFindUnique?.fields,
          'message': 'Successfully read the feature project',
          'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _CompanyFeatureEntryFindMany }, _functionName)

      // Report failure.
      return [{ 'status': 'NO_ENTRY_FOUND', 'message': 'Failed to find project feature', '_fields': _FeatureFindUnique?.fields }]
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
