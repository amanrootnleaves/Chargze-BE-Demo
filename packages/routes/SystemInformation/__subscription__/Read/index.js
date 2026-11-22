/*
 * SIBLINGS
 */
import SystemInformation from 'systeminformation'


/*
 * PACKAGES
 */
import Tag from 'tag'


/*
 * GLOBALS
 */
let _interval


/*
 * EXPORTS
 */
export default {
  'subscribe': (__, ___, Context) => {
    // Make sure context is defined.
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> SystemInformation -> Read'

      // Style guide.
      Context.Debug({ 'message': 'Subscribing to system information.' }, _functionName)

      // Interval for system information.
      !_interval && (_interval = SystemInformation.observe({
        'mem': '*',
        'currentLoad': '*',
        'fsSize': '*'
      }, 1000, j => Context.Pubsub.publish(Tag.SystemInformation.SysInfo(), { ...j, 'memory': j.mem })))

      // Subscribe to system information.
      return Context.Pubsub.subscribe(Tag.SystemInformation.SysInfo())
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  },
  'resolve': __data => __data
}
