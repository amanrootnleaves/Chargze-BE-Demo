/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { workflowId, workflowStepId }, Context) => {
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
      const _functionName = 'Routes -> WorkflowStep -> Read'

      // Style guide.
      await Context.Debug({ 'message': 'Searching workflows steps details.' }, _functionName)

      // Conditional query based on args.
      if (!_.isEmpty(workflowStepId)) { Object.assign(_whatToQuery, ({ 'id': workflowStepId })) }
      if (!_.isEmpty(workflowId)) { Object.assign(_whatToQuery, ({ 'Workflow': { 'is': { 'id': workflowId } } })) }

      // Fetch count of workflowStep table.
      const _totalCount = await Context.DataBase.workflowStep.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of workflowStep details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all workflowStep details from database.
      const _WorkflowFindMany = await Context.DataBase.workflowStep.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'position': true,
          'data': true,
          'style': true,
          'thumbnailStoredAt': true,
          'conditions': true,
          'role': true,
          'nodeColor': true
        },
        'orderBy': {
          'updatedAt': 'desc'
        },
        'take': 2000
      })

      /*
       * If getting workflowStep details contains error
       * than report failure
       */
      if (0 < _WorkflowFindMany?.length && !(_WorkflowFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given workflowStep details.' }, _functionName)

        // Return workflowStep details.
        return _WorkflowFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the workflows', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get workflowStep details.', 'error': _WorkflowFindMany }, _functionName)

      // Report failure.
      return _WorkflowFindMany instanceof Error ? _WorkflowFindMany : new Error('FAILED_TO_FIND_WORKFLOW_STEPS')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
