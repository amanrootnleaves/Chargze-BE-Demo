/*
 * IMPORTS
 */
import os from 'os' // NPM: Module for calculating the system information.


/*
 * EXPORTS
 */
export default (__, ___, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Return system information.
      return {
        'operatingSystem': os?.platform(),
        'release': os?.release(),
        'cpuArchitecture': os?.arch(),
        'totalMemory': os?.totalmem(),
        'freeMemory': os?.freemem(),
        'cpuCores': os?.cpus().length,
        'user': os?.userInfo(),
        'uptime': os?.uptime(),
        'message': 'Successfully fetched system information.',
        'status': 'READ_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
