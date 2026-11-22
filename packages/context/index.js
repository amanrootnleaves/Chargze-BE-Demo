
import Graceful from '@ladjs/graceful' 
import redis from "../dyna_modules/Cache/redisClient.js"
import _ from 'underscore' 
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store' 
import { createPubSub } from 'graphql-yoga' 
import { execute, parse } from 'graphql' 
import { PrismaClient } from '@prisma/client' 
import { createPrismaRedisCache } from 'prisma-redis-middleware' 



import Cache from 'servercache'
import Router from '../routes'

import Debug from './Debug'
import Session from './Session'

const _RedisClient = redis
const _Debug = new Debug({ 'watch': ['packages/routes/', 'packages/dyna_modules/', 'packages/middleware/'], 'showLog': WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env })
const _CreatePubsub = createPubSub()
const _CacheMiddleware = createPrismaRedisCache({
  'storage': { 'type': 'redis', 'options': { 'client': _RedisClient, 'invalidation': true, 'log': false } },
  'cacheTime': 7
})
const _PrismaPostgresClient = new PrismaClient({
  'omit': {
    'account': {
      'password': true
    }
  },
  'log': [
    {
      'emit': 'event',
      'level': 'query'
    },
    {
      'emit': 'stdout',
      'level': 'error'
    },
    {
      'emit': 'stdout',
      'level': 'info'
    },
    {
      'emit': 'stdout',
      'level': 'warn'
    }
  ]
})

_PrismaPostgresClient[Symbol.for('nodejs.util.inspect.custom')] = 'PrismaClient'
_PrismaPostgresClient.$use(_CacheMiddleware)
_PrismaPostgresClient.$use((__params, __next) => {
  if ('delete' === __params.action && 'Account' !== __params.model) {
    __params.action = 'update'
    __params.args.data = { 'isDeleted': true }
  }
  if ('deleteMany' === __params.action && 'Account' !== __params.model) {
    __params.action = 'updateMany'
    if (_.isEmpty(__params.args.data)) {
      __params.args.data = { 'isDeleted': true }
    } else {
      __params.args.data.isDeleted = true
    }
  }

  return __next(__params)
})

const _LiveQueryStore = new InMemoryLiveQueryStore()
const _Cache = new Cache({}, { 'instance': true })
const ExecuteGraph = (__query, __variables, __context) => execute({ 'schema': Router, 'document': parse(__query), 'contextValue': __context, 'variableValues': __variables })
const $baseProperties = {
  'isContext': true,
  'host': CONFIG_RC.host,
  'Debug': _.extend(_Debug.Main, _.omit(_Debug, 'Main')),
  'Pubsub': _CreatePubsub,
  'DataBase': _PrismaPostgresClient,
  'LiveStore': _LiveQueryStore,
  'Cache': _Cache,
  'ExecuteGraph': ExecuteGraph
}
const context = {
  ...$baseProperties
}


/**
 * @param {Object} options
 * @param {Object} options.request
 * @returns {Promise<Object>}
 */
const Context = async ({ request, req, params }) => {
  const actualRequest = request || req || { headers: {} };
  const _Session_ = await new Session({ 'request': actualRequest })


  if (_Session_ && ('TokenExpiredError' === _Session_.name || _Session_ instanceof Error)) throw _Session_
  else {
     let safeBody = null;
     try {
       safeBody = actualRequest?.rawBody || (params ? JSON.stringify(params) : (actualRequest?.body ? JSON.stringify(actualRequest.body) : null));
     } catch (e) {
       console.error("Failed to stringify body for signature context", e);
     }
     
     const reqHeaders = {};
     const expressHeaders = req?.headers || actualRequest?.headers || {};
     if (typeof expressHeaders.forEach === 'function') {
         expressHeaders.forEach((v, k) => reqHeaders[String(k).toLowerCase()] = String(v));
     } else {
         for (const [k, v] of Object.entries(expressHeaders)) {
             reqHeaders[String(k).toLowerCase()] = String(v);
         }
     }
     _Session_.rawBody = safeBody;

     return { ...context, request: actualRequest, 'Session': _Session_, params, reqHeaders };
  }
}



const _Graceful_ = new Graceful({
  'customHandlers': [
    () => {
      context.Debug({ 'message': 'Disconnecting all of the connections of context.' })

      _PrismaPostgresClient.$disconnect()

      context.Debug({ 'message': 'Successfully disconnected the context from everything.' })
    }
  ]
})



export { context, ExecuteGraph }
export default Context
export const LiveStore = _LiveQueryStore
