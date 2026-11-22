/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.

/*
 * SIBLINGS
 */
import WorkflowUpload from '../Upload'
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'

/*
 * EXPORTS
 */
export default async (__, { projectId, featureId, displayName, description, thumbnailStoredAt, isRequired }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Workflow -> Create'

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      /*
       * Check if workflow already exists with
       * given projectId and featureId.
       */
      const _WorkflowExists = await Context.DataBase.workflow.findMany({
        'where': {
          'Project__fk__': projectId?.value,
          'Feature__fk__': featureId?.value
        }
      })

      // If workflow already exists, report failure.
      if (!_.isEmpty(_WorkflowExists)) return new Error('WORKFLOW_ALREADY_EXISTS')

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(projectId) && _.isObject(projectId)) {
        // Check if given project actually exists.
        const _Project = await Context.DataBase.project.findUnique({
          'where': { 'id': projectId?.value }
        })

        // If project exists, connect it to the workflow.
        if (_Project instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to find project', 'error': _Project }, _functionName)

          // Report failure.
          return _Project
        }
        if (_.isEmpty(_Project)) {
          // Const assignment.
          const _error = new Error('PROJECT_NOT_FOUND')

          // Style guide.
          await Context.Debug({ 'message': 'Failed to find project', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Update query.
        Object.assign(_whatToQuery, { 'Project': { 'connect': { 'id': projectId?.value } }, 'project': projectId?.value })
      }
      if (!_.isEmpty(featureId) && _.isObject(featureId)) {
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
        Object.assign(_whatToQuery, { 'Feature': { 'connect': { 'id': featureId?.value } }, 'feature': featureId?.value })
      }

      // Update query.
      Object.assign(_whatToQuery, { 'Account': { 'connect': { 'id': Context.Session.user.id } } })
      Object.assign(_whatToQuery, { 'Company': { 'connect': { 'id': _.first(_CompanyOfAccount).id } } })
      Object.assign(_whatToQuery, { isRequired })

      // Create subAccount under given main account.
      const _WorkflowCreate = await Context.DataBase.workflow.create({
        'data': _whatToQuery
      })

      // If creating workflow caught exception then report failure.
      if (_WorkflowCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create workflow.', 'error': _WorkflowCreate }, _functionName)

        // Report failure.
        return _WorkflowCreate
      }

      // If image is available then add it.
      if (!_.isEmpty(thumbnailStoredAt)) {
        // Execution mutation for handling image.
        const _WorkflowUpload = await WorkflowUpload(__, { 'workflowId': _WorkflowCreate.id, thumbnailStoredAt }, Context)

        // Report failure if error is caught.
        if (_WorkflowUpload instanceof Error) {
          // Report failure.
          return _WorkflowUpload
        }

        // Assign thumbnailStoredAt to _whatToQuery.
        Object.assign(_whatToQuery, _WorkflowUpload)
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the workflow.` }, _functionName)

      // Return success.
      return {
        ..._WorkflowCreate,
        'message': 'Successfully created workflow.',
        'status': 'CREATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
