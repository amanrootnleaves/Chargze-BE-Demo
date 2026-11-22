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
export default async (__, { gstId, ofVendorId, displayNameToSearch, sort, filter, startDate, endDate, take, skip }, Context) => {
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
      const _functionName = 'Routes -> Gst -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching gst details..' }, _functionName)

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

      // Const assignment.
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value) Object.assign(_whatToQuery, { 'Company': { 'id': { 'in': _.pluck(_CompanyOfAccount, 'id') } } })

      // Conditional query based on args.
      if (!_.isEmpty(gstId)) Object.assign(_whatToQuery, ({ 'id': { 'equals': gstId } }))
      if (!_.isEmpty(ofVendorId)) Object.assign(_whatToQuery, ({ 'Account': { 'id': { 'equals': ofVendorId } } }))
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'displayName': { 'contains': displayNameToSearch, 'mode': 'insensitive' } }))
      if (startDate && endDate) Object.assign(_whatToQuery, ({ 'updatedAt': { 'gte': startDate, 'lte': endDate } }))

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

      // Fetch count of gst table.
      const _totalCount = await Context.DataBase.gst.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of gst details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all gst details from database.
      const _GstFindMany = await Context.DataBase.gst.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'displayName': true,
          'description': true,
          'createdAt': true,
          'updatedAt': true,
          'country': true,
          'state': true,
          'Company': {
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
       * If getting gst details contains error
       * than report failure
       */
      if (0 < _GstFindMany?.length && !(_GstFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given gst details.' }, _functionName)

        // Return gst details.
        return _GstFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the gsts', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get gst details.', 'error': _GstFindMany }, _functionName)

      // Report failure.
      return _GstFindMany instanceof Error ? _GstFindMany : new Error('FAILED_TO_FIND_GST')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
