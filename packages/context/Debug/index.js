
import __debug from 'debug' 
import AppRoot from 'app-root-path' 
import Event from 'events' 
import _ from 'underscore'
import * as Sentry from '@sentry/node'



const Emitter = new Event.EventEmitter()



import Middleware from 'debuggermiddleware'
import { errorHandlers } from 'debbugererrors'



export default function Debug($options) {
  try {
    if (this instanceof Debug) {
    
      this.Logger = function Logger({ error, message, state }, $optionss) {
        try {
          if ($optionss && $optionss.showLog && 'ERROR' === state?.toUpperCase()) console.error(error)
          if (WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env) {
            if (message) {
              let debug
              const _field = this.field.split('->')
              debug = __debug(_field[0])

              _.isArray(_field) && 1 < _field.length && _field.forEach(f => f === _field[0] ? void 0 : debug = debug.extend(`${f} `))

              debug = debug.extend(` ${state ?? 'executing'} --> `)

              debug(message)
            }

            return void 0
          }


       
          if (error instanceof Error) {
            return {
              'message': error.message ?? 'Expected Error handling to be done. but it seems that no handler is present to handle this error. Check logs for error details.'
            }
          }

          return void 0
        } catch (errorr) {
          return errorr
        }
      }


      this.QUEUE = [...errorHandlers, this.Logger]

      if (!this.sentry.initialized) {

        (async function IIFE(__Super__) {
          __Super__.sentry.initialized = true

          const _sentryInitialization = await Sentry.init(__Super__.sentry.configuration)

    
          if (_.propertyOf(_sentryInitialization)('Error')) throw _sentryInitialization.Error
        })(this)
      }


      this.Main = async ({
        error,
        root,
        args,
        context,
        info,
        message,
        state
      }, __field) => {
        try {
          const _state = error instanceof Error ? 'Error' : state ?? 'Executing'

          this.field = __field ?? this.field

          this.Logger({ error, 'state': _state, message }, $options)

          if (error instanceof Error) {
   
            const _ErrorHandling = await this.Error({ error, info, context, root, args })


            if (_ErrorHandling instanceof Error) Sentry.captureException(_ErrorHandling)

            this.Logger({ error, 'state': _state, 'message': _ErrorHandling?.message }, $options)

            return _ErrorHandling
          }

          return { message }
        } catch (errorr) {
          return errorr
        }
      }

      /*
       * Create new middleware instance
       * if caught error than report failure
       */
      const _Middleware = new Middleware(
        { 'Debug': this.Main },
        {
          'middlewares': this.QUEUE && this.QUEUE[this.field] ? this.QUEUE[this.field] : this.QUEUE
        },
        {
          ...$options,
          'projectRoot': this.projectRoot
        }
      )

      /*
       * If middleware caught error than
       * report failure.
       */
      if (_Middleware instanceof Error) return _Middleware

      // Update properties to instance.
      this.Middleware = _Middleware
      this.Emit = (__channel, __message) => Emitter.emit(__channel, __message)

      // Events
      Emitter.on('error', error => this.Main({ error }))

      // Return instance.
      return this
    }

    // Report failure.
    return new Error('NOT__CONSTRUCTOR')
  } catch (error) {
    // Report failure.
    return error
  }
}

/*
 * PROTOTYPE.
 */
Debug.prototype = {
  // Properties
  'name': 'Debug',
  'field': 'Debugger',
  'projectRoot': AppRoot.path,
  'sentry': {
    'initialized': false,
    'configuration': {
      'dsn': CONFIG_RC.debug?.dsn,
      'attachStacktrace': true,
      'debug': WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env,
      'tracesSampleRate': 1.0,
      'profilesSampleRate': 1.0,
      'integrations': [new Sentry.Integrations.Http({ 'tracing': true })]
    }
  },

  /*
   * Middleware for running method's
   * associated to fields
   */
  'Error': function({ root, args, context, info, error }) { return this.Middleware.Main(root, args, context, info, error) }
}
