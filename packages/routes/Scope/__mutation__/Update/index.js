/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  scopeId,
  displayName,
  description,
  role,
  feature,
  isAllowedToCreate,
  isAllowedToUpdate,
  isAllowedToDelete,
  isAllowedToRead
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Scope -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating scope with id: ${scopeId}` }, _functionName)

      // Get scope details of given scope id.
      const _ScopeFindUnique = await Context.DataBase.scope.findUnique({ 'where': { 'id': scopeId } })

      // If retrieving scope details encounters an exception, report failure.
      if (_.isEmpty(_ScopeFindUnique) || _ScopeFindUnique instanceof Error) {
        // Const assignment.
        const _error = _ScopeFindUnique instanceof Error ? _ScopeFindUnique : new Error('EXPECTED_SCOPE_DETAILS')

        // Style guide.
        await Context.Debug({ 'message': `Failed to find scope with id: ${scopeId}`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating scope with id: ${scopeId}` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(feature)) {
        // Disconnect previous feature.
        await Context.DataBase.scope.update({
          'where': {
            'id': scopeId
          },
          'data': {
            'Feature': {
              'set': []
            }
          }
        })


        // Loop over features to connect.
        await Context.DataBase.$transaction(async __tx => {
          // Const assignment.
          const _promiseToResolve = []
          const _featureToConnect = _.compact(_.flatten(_.pluck(feature, 'value')))

          // Loop over feature to connect.
          for (const pack of _featureToConnect) {
            // Push promise.
            _promiseToResolve.push(__tx.scope.update({
              'where': {
                'id': scopeId
              },
              'data': {
                'Feature': {
                  'connect': {
                    'id': pack
                  }
                }
              }
            }))
          }

          // Resolve all promises.
          await Promise.all(_promiseToResolve)
        }, {
          'timeout': 10000,
          'minWait': 10000
        })


        // Update query.
        Object.assign(_whatToQuery, { feature })
      }
      if (!_.isEmpty(role)) {
        // Disconnect previous feature.
        await Context.DataBase.scope.update({
          'where': {
            'id': scopeId
          },
          'data': {
            'Role': {
              'set': []
            }
          }
        })

        // Loop over features to connect.
        await Context.DataBase.$transaction(async __tx => {
          // Const assignment.
          const _promiseToResolve = []
          const _RoleToConnect = _.compact(_.flatten(_.pluck(role, 'value')))

          // Loop over feature to connect.
          for (const pack of _RoleToConnect) {
            // Push promise.
            _promiseToResolve.push(__tx.scope.update({
              'where': {
                'id': scopeId
              },
              'data': {
                'Role': {
                  'connect': {
                    'id': pack
                  }
                }
              }
            }))
          }

          // Resolve all promises.
          await Promise.all(_promiseToResolve)
        }, {
          'timeout': 10000,
          'minWait': 10000
        })

        // Update query.
        Object.assign(_whatToQuery, { role })
      }

      // Update permissions.
      Object.assign(_whatToQuery, { isAllowedToCreate })
      Object.assign(_whatToQuery, { isAllowedToUpdate })
      Object.assign(_whatToQuery, { isAllowedToDelete })
      Object.assign(_whatToQuery, { isAllowedToRead })

      // Update scope details.
      const _ScopeUpdate = await Context.DataBase.scope.update({
        'where': {
          'id': _ScopeFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating scope caught exception
       * then report failure.
       */
      if (_ScopeUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update scope with id: ${scopeId}`, 'error': _ScopeUpdate }, _functionName)

        // Report failure.
        return _ScopeUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated scope with id: ${scopeId}` }, _functionName)

      // Return success.
      return {
        ..._ScopeUpdate,
        'message': 'Successfully updated the scope.',
        'status': 'UPDATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
