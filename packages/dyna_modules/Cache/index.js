
import Graceful from '@ladjs/graceful'
import Lo from 'lodash' 
import redis from './redisClient.js'
import CircularFix from 'circular-json-es6' 
import Ms from 'ms'
import _ from 'underscore' 
import { promisify } from 'util' 

const Client = redis
const GetAsync = Client.get.bind(Client)
const Hset = promisify(Client.hset).bind(Client)
const Zadd = promisify(Client.zadd).bind(Client)
const Zrange = promisify(Client.zrange).bind(Client)
const Zrevrangebyscore = promisify(Client.zrevrangebyscore).bind(Client)


export default function Cache({ id, whatToCache, cb }, $options) {
  try {
    if (this instanceof Cache) {
      this.name = Cache.prototype.name
      this.Pubsub = Client
      this.HSET = Hset
      this.ZADD = Zadd
      this.ZRANGE = Zrange
      this.ZREVRANGEBYSCORE = Zrevrangebyscore

      this.configuration = {
        'merge': $options?.merge ?? false,
        'expireIn': $options?.expireIn ?? void 0,
        'upsert': $options?.upsert ?? false,
        'assign': $options?.assign ?? false,
        'changeTo': $options?.changeTo ?? void 0,
        'delete': $options?.delete ?? false,
        'hm': {
          'count': $options?.count ?? 10,
          'delete': $options?.delete ?? false,
          'keys': $options?.keys ?? true
        }
      }

      if ($options?.instance) return this

      if (id && id.includes('*')) {
        return this.hm({ id, cb })
      } else if (whatToCache) {
        return this.set({ id, whatToCache })
      } else if (id && this.configuration.delete) {
        return Client.del(id)
      }

      return this.get(id)
    }
    return new Error('NOT__CONSTRUCTOR')
  } catch (error) {
    return error
  }
}

Cache.prototype = {
  'name': 'Cache',

  async set({ id, whatToCache }, $options = {}) {
    try {
      let _Cache, _dataContainer, _oldData
      if (!_.isEmpty(id) && _.isString(id)) {
        _oldData = await this.get(id)
        if (_oldData) {
          if (_.isArray(this.configuration.changeTo) || ($options.configuration && _.isArray($options.configuration.changeTo))) {
            if (!_.isArray(_oldData)) {
              _oldData = [_oldData, whatToCache]
            } else if (_.isArray(_oldData)) { _oldData.push(whatToCache) }
            _dataContainer = _oldData

            if (this.configuration && this.configuration.expireIn) {
              await Client.pexpire(id, Ms(this.configuration.expireIn))
            }
          } else if (this.configuration.merge || ($options.configuration && $options.configuration.merge)) {
            if (_.isObject(_oldData) && _.isObject(whatToCache)) {
              _dataContainer = Lo.merge(_oldData, whatToCache)

            } else { return new Error('DIFFERENT_MERGE_TYPE(SET)') }
          } else if (this.configuration.upsert || ($options.configuration && $options.upsert.merge)) {
            return _oldData

          } else if (this.configuration.assign || ($options.configuration && $options.assign.merge)) {
            if (_.isObject(_oldData) && _.isObject(whatToCache)) {
              _dataContainer = Object.assign(_oldData, whatToCache)

            } else { return new Error('DIFFERENT_MERGE_TYPE(SET)') }

          } else { _dataContainer = whatToCache }
        } else { _dataContainer = _.isArray(this.configuration.changeTo) || ($options.configuration && _.isArray($options.configuration.changeTo)) ? _.flatten([whatToCache]) : _.flatten(whatToCache) }
        if (_.isEmpty(_dataContainer)) return new Error('EMPTY_DATA_CONTAINER(SET)')
        _Cache = await Client.set(id, CircularFix.stringify(_dataContainer))
        if (!(_.isArray(this.configuration.changeTo) || (($options.configuration && _.isArray($options.configuration.changeTo)))) && this.configuration.expireIn) await Client.pexpire(id, Ms(this.configuration.expireIn))
        if ($options.expireIn) await Client.pexpire(id, Ms($options.expireIn))
        if (!(_Cache instanceof Error)) {
          const _getStoredData = await this.get(id)
          if (_getStoredData instanceof Error) return _getStoredData
          return _getStoredData
        }
        return _Cache
      }
      return new Error('REQUIRE_ID(SET)')
    } catch (error) {
      return error
    }
  },

  async get(id) {
    try {
      if (!_.isEmpty(id)) {
        const _getDetails = await GetAsync(id)

        if (_getDetails instanceof Error) return _getDetails
        if (typeof _getDetails === typeof 'String' && !(_getDetails.startsWith('{') || _getDetails.startsWith('['))) return _getDetails
        return CircularFix.parse(_getDetails)
      }
      return new Error('REQUIRE_ID(GET)')
    } catch (error) {
      return error
    }
  },


hm({ id, count, skip, take }) {
    try {
      if (_.isEmpty(id)) return new Error('REQUIRE_ID(HM)');

      const _this_ = this;
      let _allKeys = [];

      return new Promise((resolve, reject) => {
        const stream = Client.scanStream({
          match: id,
          count: count ?? _this_.configuration.hm.count ?? 100,
        });

        stream.on('data', (resultKeys) => {
          _allKeys.push(...resultKeys);
        });

        stream.on('error', (err) => reject(err));

        stream.on('end', async () => {
          const keysToProcess = _allKeys.slice(skip ?? 0, (skip ?? 0) + (take ?? _allKeys.length));

          if (_this_.configuration.hm.keys) {
            return resolve(keysToProcess);
          }

          if (_.isEmpty(keysToProcess)) {
            return resolve([]);
          }

          const batch = Client.pipeline();
          keysToProcess.forEach(key => {
            _this_.configuration.hm.delete ? batch.del(key) : batch.get(key);
          });

          const results = await batch.exec();
          
          const formatted = results
            .map(([err, val]) => {
              if (err || !val) return null;
              try {
                return JSON.parse(val);
              } catch {
                return val;
              }
            })
            .filter(Boolean);

          resolve(formatted);
        });
      });
    } catch (error) {
      return error;
    }
  },


  async delete(id) {
    try {

      if (!_.isEmpty(id)) {
        const _Cache = await Client.del(id)
        return _Cache
      }
      return new Error('REQUIRE_ID(DELETE)')
    } catch (error) {
      return error
    }
  }
}



const _Graceful_ = new Graceful({ 'redisClients': [redis] })
