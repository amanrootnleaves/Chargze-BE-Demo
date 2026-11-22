/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.

/*
 * SIBLINGS
 */
import CompanyOfAccount from '../OfAccount'

/*
 * EXPORT
 */
export default async (__, { aggregate = [], mode = [], take = 10, skip = 0 }, Context) => {
  // Error handling.
  try {
    // Make sure that context is valid and exist.
    if (!Context?.isContext) return new Error('MISSING__CONTEXT')

    // Const assignment.
    const _functionName = 'Routes -> Company -> Aggregate'

    // Style guide.
    await Context.Debug({ 'message': 'Aggregating company data..' }, _functionName)

    // Local variable
    const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

    // Report failure if error is caught.
    if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
    if (_.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

    // Local variable.
    let finalQuery

    // Check if mode is NEW.
    if ('NEW' === mode) {
      // If current login is of admin.
      if (Context.Session.user.accountType === ACCOUNT_TYPE.ADMIN.value) {
        // Newest companies
        finalQuery = `
          SELECT c."id", c."displayName", c."createdAt"
          FROM "Company" c
          WHERE c."isDeleted" = FALSE
          ORDER BY c."createdAt" DESC
          OFFSET ${skip} LIMIT ${take};
        `
      } else {
        // Newest companies
        finalQuery = `
          SELECT c."id", c."displayName", c."createdAt"
          FROM "Company" c
          WHERE c."isDeleted" = FALSE AND c."id" != ${_CompanyOfAccount?.[0]?.id}
          ORDER BY c."createdAt" DESC
          OFFSET ${skip} LIMIT ${take};
        `
      }
    } else if ('TOP' === mode) {
      // If current login is of admin.
      if (Context.Session.user.accountType === ACCOUNT_TYPE.ADMIN.value) {
        // Top companies by project count
        finalQuery = `
          SELECT c."id", c."displayName", COUNT(p."id") AS "projectCount"
          FROM "Company" c
          LEFT JOIN "Project" p
            ON p."Company__fk__" = c."id"
           AND p."isDeleted" = FALSE
          WHERE c."isDeleted" = FALSE
          GROUP BY c."id"
          ORDER BY "projectCount" DESC
          OFFSET ${skip} LIMIT ${take};
        `
      } else {
        // Top companies by project count
        finalQuery = `
          SELECT c."id", c."displayName", COUNT(p."id") AS "projectCount"
          FROM "Company" c
          LEFT JOIN "Project" p
            ON p."Company__fk__" = c."id"
           AND p."isDeleted" = FALSE
          WHERE c."isDeleted" = FALSE
          AND c."id" = ${_CompanyOfAccount?.[0]?.id}
          GROUP BY c."id"
          ORDER BY "projectCount" DESC
          OFFSET ${skip} LIMIT ${take};
        `
      }
    } else {
      // Default aggregation mode (your earlier aggregate logic)
      const selectClauses = []
      const whereClauses = []

      // Loop over aggregate fields.
      for (const agg of aggregate || []) {
        // If aggregate field is not defined, skip it.
        if (!agg?.field) continue

        // Const assignment.
        const field = agg.field
        const operator = agg.operator?.toUpperCase?.() || 'COUNT'

        // Switch case for different operators.
        switch (operator) {
        case 'SUM':
        case 'AVG':
        case 'MIN':
        case 'MAX':
        case 'COUNT':
          selectClauses.push(`${operator}(c."${field}") AS "${field}__${operator.toLowerCase()}"`)

          break
        default:
          selectClauses.push(`COUNT(c."${field}") AS "${field}__count"`)
        }

        // Make sure aggregate exists.
        if (null !== agg.value) {
          // Check if value is an array.
          if (Array.isArray(agg.value)) {
            // Const assignment.
            const vals = agg.value.map(v => `'${v}'`).join(',')

            // Update where clause.
            whereClauses.push(`c."${field}" IN (${vals})`)
          } else {
            // Update where clause.
            whereClauses.push(`c."${field}" = '${agg.value}'`)
          }
        }
      }

      // Update where clause.
      if (0 === selectClauses.length) return new Error('EXPECTED_SELECT_CLAUSES')

      // Build final query.
      const finalWhere = _.compact([`c."isDeleted" = FALSE`, Context.Session.user.accountType === ACCOUNT_TYPE.ADMIN.value ? void 0 : `c."id" = ${_CompanyOfAccount?.[0]?.id}`, ...whereClauses]).join(' AND ')

      // Variable assignment.
      finalQuery = `
        SELECT ${selectClauses.join(', ')}
        FROM "Company" c
        WHERE ${finalWhere};
      `
    }

    // Execute query.
    const result = await Context.DataBase.$queryRawUnsafe(finalQuery)

    // If execution is safe then return result.
    if (!_.isEmpty(result) && !(result instanceof Error)) {
      // Report success.
      return {
        '_aggregate': result,
        'message': 'Successfully got company aggregate.',
        'status': 'READ_SUCCESSFUL'
      }
    }

    // Report failure if error is caught.
    return result instanceof Error ? result : new Error('FAILED_TO_AGGREGATE')
  } catch (error) {
    // Report failure.
    return error
  }
}
