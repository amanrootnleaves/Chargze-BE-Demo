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
export default async (__, { roleId, sort, filter, displayNameToSearch, take, skip }, Context) => {
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
      const _functionName = 'Routes -> Role -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching role details..' }, _functionName)


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
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value) Object.assign(_whatToQuery, { 'Company': { 'id': { 'in': _.pluck(_CompanyOfAccount, 'id') } } })

      // Conditional query based on args.
      if (!_.isEmpty(roleId)) Object.assign(_whatToQuery, ({ 'id': { 'equals': roleId } }))
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'displayName': { 'contains': displayNameToSearch, 'mode': 'insensitive' } }))

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

      // Fetch count of role table.
      const _totalCount = await Context.DataBase.role.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of role details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all role details from database.
      const _RoleFindMany = await Context.DataBase.role.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'displayName': true,
          'description': true,
          'role': true,
          'createdAt': true,
          'updatedAt': true,
          'Company': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true
            }
          },
          'Account': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true
            }
          }
        },
        'orderBy': _orderBy,
        take,
        skip
      })

      /*
       * If getting role details contains error
       * than report failure
       */
      if (0 < _RoleFindMany?.length && !(_RoleFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given role details.' }, _functionName)

        // Return role details.
        return _RoleFindMany?.map(j => ({ ...j, 'Account': j?.Account?.map(r => ({ ...r, '_totalCount': j?.Account?.length })), _totalCount, 'message': 'Successfully read the role.', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get role details.', 'error': _RoleFindMany }, _functionName)

      // Report failure.
      return _RoleFindMany instanceof Error ? _RoleFindMany : new Error('FAILED_TO_FIND_ROLE')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
