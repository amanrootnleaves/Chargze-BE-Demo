/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.
import { isNil } from 'lodash' // Npm: Lodash library.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { featureId, aggregate, filter, startDate, endDate }, Context) => {
  try {
    if (Context && Context.isContext) {
      // Const assignment.
      const selectClauses = []
      const whereClauses = []
      const _functionName = 'Routes -> Feature -> Aggregate'

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature details..' }, _functionName)

      // Get Feature with given id.
      const _FeatureColumnTypeFindUnique = await Context.DataBase.feature.findUnique({ 'where': { 'id': featureId } })

      // Report failure if error is caught.
      if (_FeatureColumnTypeFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _FeatureColumnTypeFindUnique }, _functionName)

        // Report failure.
        return _FeatureColumnTypeFindUnique
      }
      if (_.isEmpty(_FeatureColumnTypeFindUnique)) {
        // Const assignment.
        const _error = new Error('FEATURE_NOT_FOUND')

        // Style guide.
        await Context.Debug({ 'message': 'Feature not found.', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Map data types translation to postgresql types.
      const _mapDType = column => {
        // Const assignment.
        const dType = column.dType.dType

        // Map data types.
        switch (dType) {
        case 'CHECK_BOX': return 'boolean'
        case 'NUMBER': return 'numeric'
        case 'AMOUNT': return 'amount'
        default: return 'text'
        }
      }

      // Loop over fields.
      for (const field of _FeatureColumnTypeFindUnique?.fields) {
        // Look for aggregate operations.
        for (const x of (_.isArray(aggregate) ? aggregate : [aggregate])) {
          // If the field is not empty and the field name matches the aggregate field name.
          if (!_.isEmpty(x) && !_.isEmpty(field) && (field.name?.toUpperCase?.() === x.field?.toUpperCase?.())) {
            // Const assignment.
            const _Operator = __operator => {
              // Const assignment.
              const _userAggregator = __operator?.toUpperCase?.()
              const _gType = _mapDType(field)

              // Report failure if error is caught.
              if (_.isEmpty(_gType) || _gType instanceof Error) {
                // Const assignment.
                const _error = new Error('FAILED_TO_GENERATE_TYPE')

                // Style guide.
                Context.Debug({ 'message': 'Failed to guess the type of field.', 'error': _gType || _error }, _functionName)

                // Report failure.
                return _gType || _error
              }

              // Build query based on types.
              if (['numeric', 'amount'].includes(_gType)) {
                // If aggregation is on numeric fields.
                if ([
                  'SUM',
                  'AVG',
                  'MIN',
                  'MAX',
                  'COUNT'
                ].includes(_userAggregator)) {
                  // Build query.
                  selectClauses.push(`${_userAggregator}(
                        CASE
                          WHEN (cfe.data->>'${field.name}') ~ '^-?[0-9]+(\\.[0-9]+)?$'
                          THEN (cfe.data->>'${field.name}')::numeric
                        END
                      ) AS "${field.name}"`)
                }
              } else if ('boolean' === _gType) {
                // Push count query.
                selectClauses.push(`COUNT(cfe.data->>'${field.name}') AS "${field.name}"`)
              } else if ('text' === _gType) {
                // Push count query.
                selectClauses.push(`COUNT(cfe.data->>'${field.name}') AS "${field.name}"`)
              } else {
                // Push count query.
                selectClauses.push(`COUNT(cfe.data->>'${field.name}') AS "${field.name}"`)
              }

              // If value is nil.
              if (!isNil(x.value)) {
                // Check for type if is numeric or amount.
                if (['numeric', 'amount'].includes(_gType)) {
                  // If value is array.
                  if (_.isArray(x.value)) {
                    // Const assignment.
                    const values = x.value.map(v => Number(v)).filter(v => !isNaN(v))

                    // Push where clause.
                    if (0 < values.length) whereClauses.push(`(cfe.data->>'${field.name}')::numeric IN (${values.join(',')})`)
                  } else {
                    // Const assignment.
                    const numVal = Number(x.value)

                    // Push where clause.
                    if (!isNaN(numVal)) whereClauses.push(`(cfe.data->>'${field.name}')::numeric = ${numVal}`)
                  }
                } else if ('boolean' === _gType) {
                  // Check if value is array.
                  if (_.isArray(x.value)) {
                    // Const assignment.
                    const vals = x.value.map(v => (v ? 'TRUE' : 'FALSE')).join(',')

                    // Push where clause.
                    whereClauses.push(`(cfe.data->>'${field.name}')::boolean IN (${vals})`)
                  } else {
                    whereClauses.push(`(cfe.data->>'${field.name}')::boolean = ${x.value ? 'TRUE' : 'FALSE'}`)
                  }
                } else if ('text' === _gType) {
                  // If value is array.
                  if (_.isArray(x.value)) {
                    // Const assignment.
                    const vals = x.value.map(v => `'${v}'`).join(',')

                    // Push where clause.
                    whereClauses.push(`(cfe.data->>'${field.name}') IN (${vals})`)
                  } else {
                    // Push where clause.
                    whereClauses.push(`(cfe.data->>'${field.name}') = '${x.value}'`)
                  }
                }
              }

              // Report void.
              return new Error('UNEXPECTED_QUERY_BUILD_FAILED')
            }

            // If Operator exist then build it as well.
            if (_.isArray(x.operator)) {
              // Build each operator.
              _.forEach(x.operator, _Operator)
            } else {
              // Build operator.
              _Operator(x.operator || 'COUNT')
            }
          }
        }
      }

      // If no select clause exist then report failure.
      if (0 === selectClauses.length) return new Error('EXPECTED_SELECT_CLAUSES')

      // Const assignment.
      const finalWhere = _.compact([
        `cfe."Feature__fk__" = '${featureId}'`,
        `cfe."isDeleted" = false`,
        `cfe.data IS NOT NULL`,
        startDate ? `cfe."updatedAt" >= '${startDate?.toISOString()}'` : null,
        endDate ? `cfe."updatedAt" <= '${endDate?.toISOString()}'` : null,
        ...whereClauses
      ])

      // Get company of logged in user if user is not admin.
      if ('ADMIN' !== Context.Session.user.accountType) {
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
        if (_.isEmpty(_CompanyOfAccount)) {
          // Style guide.
          await Context.Debug({ 'message': 'Company not found.' }, _functionName)

          // Report failure.
          return new Error('COMPANY_NOT_FOUND')
        }

        // Update final query with company id.
        finalWhere.push(`cfe."Company__fk__" = '${_CompanyOfAccount?.[0]?.id}'`)
      }

      // Add filters to query if they are provided.
      if (!_.isEmpty(filter) && !_.isEmpty(filter.items)) {
        // Update query with fields to filter.
        finalWhere.push(Object.MuiToPrismaRawQueryFilter(filter, _FeatureColumnTypeFindUnique?.fields))
      }

      // Const assignment.
      const finalQuery = `
        SELECT ${selectClauses.join(', ')}
        FROM "CompanyFeatureEntry" cfe
        WHERE ${finalWhere.join(' AND ')};
      `

      // Execute prisma query.
      const _FeatureAggregateMany = await Context.DataBase.$queryRawUnsafe(finalQuery)

      // Return data if response is successful.
      if (!_.isEmpty(_FeatureAggregateMany) && !(_FeatureAggregateMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given feature details.' }, _functionName)

        // Report success.
        return {
          '_aggregate': _FeatureAggregateMany,
          'message': 'Successfully got given feature details.',
          'status': 'READ_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _FeatureAggregateMany }, _functionName)

      // Report failure.
      return _FeatureAggregateMany instanceof Error ? _FeatureAggregateMany : new Error('FAILED_TO_AGGREGATE')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
