/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  workflowStepId,
  nodeColor,
  role,
  conditions
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
      const _functionName = 'Routes -> WorkflowStep -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating workflowStep with id: ${workflowStepId}.` }, _functionName)

      // Get workflowStep details of given workflowStep id.
      const _WorkflowFindUnique = await Context.DataBase.workflowStep.findUnique({ 'where': { 'id': workflowStepId } })

      // If retrieving workflowStep details encounters an exception, report failure.
      if (_.isEmpty(_WorkflowFindUnique) || _WorkflowFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find workflowStep with id: ${workflowStepId}.`, 'error': _WorkflowFindUnique }, _functionName)

        // Report failure.
        return _WorkflowFindUnique instanceof Error ? _WorkflowFindUnique : new Error('EXPECTED_WORKFLOW_STEPS_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating workflowStep with id: ${workflowStepId}.` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(conditions)) Object.assign(_whatToQuery, { conditions })
      if (!_.isEmpty(nodeColor)) Object.assign(_whatToQuery, { nodeColor })
      if (!_.isEmpty(conditions)) Object.assign(_whatToQuery, { conditions })
      if (!_.isEmpty(role)) {
        // Connect given role to workflowStep.
        await Context.DataBase.workflowStep.update({
          'where': { 'id': workflowStepId },
          'data': {
            'role': {
              'set': []
            },
            'Role': {
              'disconnect': true
            }
          }
        })

        // Connect new role to workflowStep.
        await Context.DataBase.workflowStep.update({
          'where': { 'id': workflowStepId },
          'data': {
            'role': role,
            'Role': {
              'connect': {
                'id': role?.value
              }
            }
          }
        })
      }

      // Update workflowStep details.
      const _WorkflowUpdate = await Context.DataBase.workflowStep.update({
        'where': {
          'id': _WorkflowFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating workflowStep caught exception
       * then report failure.
       */
      if (_WorkflowUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update workflowStep with id: ${workflowStepId}.`, 'error': _WorkflowUpdate }, _functionName)

        // Report failure.
        return _WorkflowUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated workflowStep with id: ${workflowStepId}.` }, _functionName)

      // Return success.
      return {
        ..._WorkflowUpdate,
        'message': 'Successfully updated the node in workflow.',
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
