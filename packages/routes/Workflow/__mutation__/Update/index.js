/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.

/*
 * SIBLINGS
 */
import WorkflowUpload from '../Upload'

/*
 * EXPORTS
 */
export default async (__, {
  workflowId,
  projectId,
  featureId,
  displayName,
  description,
  thumbnailStoredAt,
  isRequired,
  edges
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
      const _functionName = 'Routes -> Workflow -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating workflow with id: ${workflowId}.` }, _functionName)

      // Get workflow details of given workflow id.
      const _WorkflowFindUnique = await Context.DataBase.workflow.findUnique({ 'where': { 'id': workflowId } })

      // If retrieving workflow details encounters an exception, report failure.
      if (_.isEmpty(_WorkflowFindUnique) || _WorkflowFindUnique instanceof Error) {
        // Const assignment.
        const _error = _WorkflowFindUnique instanceof Error ? _WorkflowFindUnique : new Error('EXPECTED_WORK_FLOW_DETAILS')

        // Style guide.
        await Context.Debug({ 'message': `Failed to find workflow with id: ${workflowId}.`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating workflow with id: ${workflowId}.` }, _functionName)

      // Update displayName and description.
      Object.assign(_whatToQuery, { isRequired })
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(edges)) Object.assign(_whatToQuery, { edges })
      if (!_.isEmpty(projectId)) {
        // Check if given project actually exists.
        const _Project = await Context.DataBase.project.findUnique({
          'where': { 'id': projectId?.value }
        })

        // If project exists, connect it to the workflow.
        if (_Project instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to find project.', 'error': _Project }, _functionName)

          // Report failure.
          return _Project
        }
        if (_.isEmpty(_Project)) {
          // Const assignment.
          const _error = new Error('PROJECT_NOT_FOUND')

          // Style guide.
          await Context.Debug({ 'message': 'Failed to find project.', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Update query.
        Object.assign(_whatToQuery, { 'Project': { 'connect': { 'id': projectId?.value } }, 'project': projectId })
      }
      if (!_.isEmpty(featureId)) {
        // Check if feature exists.
        const _Feature = await Context.DataBase.feature.findUnique({
          'where': { 'id': featureId?.value }
        })

        // If feature exists, connect it to the workflow.
        if (_Feature instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to find feature.', 'error': _Feature }, _functionName)

          // Report failure.
          return _Feature
        }
        if (_.isEmpty(_Feature)) {
          // Const assignment.
          const _error = new Error('FEATURE_NOT_FOUND')

          // Style guide.
          await Context.Debug({ 'message': 'Failed to find feature.', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Update query.
        Object.assign(_whatToQuery, { 'Feature': { 'connect': { 'id': featureId?.value } }, 'feature': featureId })
      }

      // If image is available then add it.
      if (thumbnailStoredAt && thumbnailStoredAt.then) {
        // Execution mutation for handling image.
        const _WorkflowUpload = await WorkflowUpload(__, { 'workflowId': _WorkflowFindUnique?.id, thumbnailStoredAt }, Context)

        // Report failure if error is caught.
        if (_WorkflowUpload instanceof Error) {
          // Report failure.
          return _WorkflowUpload
        }

        // Assign thumbnailStoredAt to _whatToQuery.
        Object.assign(_whatToQuery, { 'thumbnailStoredAt': _WorkflowUpload?.thumbnailStoredAt })
      }

      // Update workflow details.
      const _WorkflowUpdate = await Context.DataBase.workflow.update({
        'where': {
          'id': _WorkflowFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating workflow caught exception
       * then report failure.
       */
      if (_WorkflowUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update workflow with id: ${workflowId}`, 'error': _WorkflowUpdate }, _functionName)

        // Report failure.
        return _WorkflowUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated workflow with id: ${workflowId}` }, _functionName)

      // Return success.
      return {
        ..._WorkflowUpdate,
        'message': 'Successfully updated the workflow.',
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
