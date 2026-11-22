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
export default async (__, { companyId, projectId, sort, filter, displayNameToSearch, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Local variable.
      let _ProjectFindMany

      // Variable assignment.
      const _whatToQuery = { 'isDeleted': false }

      // Const assignment.
      const _functionName = 'Routes -> Project -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching project details..' }, _functionName)

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

      // Update _whatToQuery with company id
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(companyId)) Object.assign(_whatToQuery, { 'Company': { 'id': { 'in': _.pluck(_CompanyOfAccount, 'id') } } })

      // Conditional query based on args.
      if (!_.isEmpty(projectId)) Object.assign(_whatToQuery, ({ 'id': { 'equals': projectId } }))
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'OR': [{ 'displayName': { 'startsWith': displayNameToSearch, 'mode': 'insensitive' } }] }))
      if (!_.isEmpty(companyId)) Object.assign(_whatToQuery, ({ 'Company__fk__': { 'equals': companyId } }))
      Object.assign(_whatToQuery, { 'isDeleted': false })

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

      // Fetch count of project table.
      const _totalCount = await Context.DataBase.project.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of project details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      /*
       * If given login accountType is employee then only show
       * assigned projects.
       */
      if (Context.Session.user.accountType === ACCOUNT_TYPE.EMPLOYEE.value) {
        // Fetch all project details from database.
        _ProjectFindMany = await Context.DataBase.Project.findMany({
          'where': {
            'ProjectEmployee': {
              'some': {
                'Account': {
                  'some': {
                    'id': Context.Session.user.id
                  }
                }
              }
            },
            ..._whatToQuery
          },
          'select': {
            'id': true,
            'displayName': true,
            'description': true,
            'createdAt': true,
            'updatedAt': true,
            'account': true
          },
          'orderBy': _orderBy,
          take,
          skip
        })
      } else {
        // Fetch all project details from database.
        _ProjectFindMany = await Context.DataBase.project.findMany({
          'where': _whatToQuery,
          'select': {
            'id': true,
            'displayName': true,
            'description': true,
            'createdAt': true,
            'updatedAt': true,
            'account': true
          },
          'orderBy': {
            'updatedAt': 'desc'
          },
          take,
          skip
        })
      }

      /*
       * If getting project details contains error
       * than report failure
       */
      if (0 < _ProjectFindMany?.length && !(_ProjectFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given project details.' }, _functionName)

        // Return project details.
        return _ProjectFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the projects', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get project details.', 'error': _ProjectFindMany }, _functionName)

      // Report failure.
      return _ProjectFindMany instanceof Error ? _ProjectFindMany : new Error('FAILED_TO_FIND_PROJECT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
