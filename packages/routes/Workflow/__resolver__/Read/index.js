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
export default async (__, { workflowId, companyId, displayNameToSearch, filter, sort, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = { 'isDeleted': false }

      // Const assignment.
      const _functionName = 'Routes -> Workflow -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      // Style guide.
      await Context.Debug({ 'message': 'Searching workflows details.' }, _functionName)

      // Conditional query based on args.
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'OR': [{ 'displayName': { 'startsWith': displayNameToSearch, 'mode': 'insensitive' } }] }))
      if (!_.isEmpty(workflowId)) { Object.assign(_whatToQuery, ({ 'id': workflowId })) }

      // Only fetch workflows belonging to the company.
      if (!_.isEmpty(_CompanyOfAccount)) Object.assign(_whatToQuery, ({ 'Company__fk__': _.first(_CompanyOfAccount).id }))

      // Const assignment.
      const _orderBy = {}

      /*
       * Loop over short if provided and update filters
       * accordingly else proceed with default sorting.
       */
      if (_.isEmpty(sort)) {
        // Update default filter.
        Object.assign(_orderBy, { 'updatedAt': 'desc' })
      } else {
        // Loop over sort and push each sorting.
        for (const j of sort) {
          // Update _orderBy
          _orderBy[j.field] = j.sort || 'desc'
        }
      }

      // Add filters to query if they are provided.
      if (!_.isEmpty(filter)) {
        // Update query with fields to filter.
        Object.assign(_whatToQuery, {
          [filter?.logicOperator?.toUpperCase?.()]: filter.items.map(r => Object.MuiToPrismaFilter(r.field, r.operator, r.value))
        })
      }

      // Fetch count of workflow table.
      const _totalCount = await Context.DataBase.workflow.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of workflow details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all workflow details from database.
      const _WorkflowFindMany = await Context.DataBase.workflow.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'displayName': true,
          'description': true,
          'createdAt': true,
          'updatedAt': true,
          'project': true,
          'feature': true,
          'thumbnailStoredAt': true,
          'isRequired': true,
          'edges': true,
          'Project': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true
            }
          },
          'Feature': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true
            }
          }
        },
        'orderBy': _orderBy,
        take,
        skip
      })

      /*
       * If getting workflow details contains error
       * than report failure
       */
      if (0 < _WorkflowFindMany?.length && !(_WorkflowFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given workflow details.' }, _functionName)

        // Promise to hold.
        const promise = _WorkflowFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the workflows.', 'status': 'READ_SUCCESSFUL' }))

        // Return workflow details.
        return Promise.all(promise)
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get workflow details.', 'error': _WorkflowFindMany }, _functionName)

      // Report failure.
      return _WorkflowFindMany instanceof Error ? _WorkflowFindMany : new Error('FAILED_TO_FIND_WORKFLOW')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
