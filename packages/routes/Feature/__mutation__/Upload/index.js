/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import DeepLoop from 'deep-iterator' // Npm: deep loop Maps for iterating over every object key


/*
 * PACKAGES
 */
import FileManager from 'filemanager'


/*
 * EXPORTS
 */
export default async (__, { featureId, dimensionsToChopIn, ...__files }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Feature -> Upload'

      // Style guide.
      await Context.Debug({ 'message': `Checking if upload contains any files.` }, _functionName)

      /*
       * If any update is empty than report
       * failure else continue.
       */
      if (!_.isEmpty(__files)) {
        // Style guide.
        await Context.Debug({ 'message': `Uploading files to feature request with id: ${featureId}` }, _functionName)

        // Local variable.
        let _FileManager_

        /*
         * Deep loop over __files and await each
         * file if available as promise.
         */
        for await (const { parent, key, value } of DeepLoop(__files)) {
          // If parent and key is not empty.
          if (!_.isEmpty(await parent) && !_.isEmpty(await value)) parent[key] = await value
        }

        // Loop over files and update each one.
        for await (const file of Object.entries(await __files)) {
          // Only process uploads if upload files are provided.
          if (file) {
            // Style guide.
            await Context.Debug({ 'message': `Uploading file to feature with id: ${featureId}` }, _functionName)

            // Upload given file to file manager.
            _FileManager_ = await new FileManager({ 'file': file[1].file, 'path': `feature/${file[0]}/${featureId}/${Date.now()}/` }, { dimensionsToChopIn })

            // If uploading contains error than report failure.
            if (!_.isEmpty(_FileManager_) && !(_FileManager_ instanceof Error)) {
              // Style guide.
              await Context.Debug({ 'message': `Successfully uploaded file to feature with id: ${featureId}` }, _functionName)
              await Context.Debug({ 'message': `Saving file to cache for feature with id: ${featureId}` }, _functionName)

              // Update files to the database.
              const _FeatureUpdate = await Context.DataBase.feature.update({
                'where': { 'id': featureId },
                'data': {
                  [file[0]]: _FileManager_
                }
              })

              // If updating caught exception than report failure.
              if (_FeatureUpdate instanceof Error) {
                // Style guide.
                await Context.Debug({ 'message': `Failed to update file to database for feature with id: ${featureId}`, 'error': _FeatureUpdate }, _functionName)

                // Report failure.
                return _FeatureUpdate
              }

              // Style guide.
              await Context.Debug({ 'message': `Successfully updated file to database for feature with id: ${featureId}` }, _functionName)

              // Assign return object.
              const _return = {
                [file[0]]: _FileManager_,
                'message': 'Upload Successful..',
                'status': 'UPDATE_SUCCESSFUL'
              }

              // Return successful.
              return _return
            }

            // Style guide.
            await Context.Debug({ 'message': `Failed to upload file to feature with id: ${featureId}`, 'error': _FileManager_ }, _functionName)

            // Report failure.
            return _FileManager_ instanceof Error ? _FileManager_ : new Error('UPLOAD_FAILED')
          }
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Upload missing files reporting failure.` }, _functionName)

      // Report failure.
      return new Error('UPLOAD_MISSING')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
