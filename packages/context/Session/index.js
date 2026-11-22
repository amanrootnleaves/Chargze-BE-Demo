
import JsonWebToken from 'jsonwebtoken' 
import _ from 'underscore'



import { context } from '../'
import Tag from 'tag'

export default async function Session({ name, request }) {
  try {
    if (this instanceof Session) {
      const _functionName = 'Context -> Session'

      this.name = name ? name.toCapitalize() : Session.prototype.name
      this.user = null
      this.token = null
      this.runtimeCleanupPeriod = 2000
      this.ip = request?.headers?.['x-forwarded-for'] || request?.socket?.remoteAddress
      this.isLoggedIn = false
      
      const plainHeaders = {};
      try {
        if (request?.headers?.entries) {
          for (const [key, value] of request.headers.entries()) {
            plainHeaders[key.toLowerCase()] = value;
          }
        } else if (request?.headers) {
           Object.assign(plainHeaders, request.headers);
           if (request?.headers?.headersInit) Object.assign(plainHeaders, request.headers.headersInit);
        }
      } catch (e) {
        console.error("[Session] Error parsing headers", e);
      }
      this.headers = plainHeaders;
      console.log("[Session] RECEIVED HEADERS:", JSON.stringify(this.headers, null, 2));

      if (this.headers['x-signature']) {
        console.log("--- SIGNATURE HEADERS RECEIVED ---");
        console.log("x-signature:", this.headers['x-signature']);
        console.log("x-timestamp:", this.headers['x-timestamp']);
        console.log("x-nonce:", this.headers['x-nonce']);
        console.log("----------------------------------");
      }

      if (!context || (context && !context.isContext)) return new Error('MISSING__CONTEXT')

      if (this.headers && _.isEmpty(this.headers['s-authorization']) && !_.isEmpty(this.headers['l-authorization']) && 'undefined' !== this.headers['l-authorization']) {
        context.Debug({ 'message': 'Found l-authorization header. Verifying token.' }, _functionName)
        const _JwtVerify = await this.JwtVerify(this.headers['l-authorization'])
        if (_JwtVerify && _JwtVerify instanceof Error) {
          context.Debug({ 'message': `Token verification failed: ${_JwtVerify.message}` }, _functionName)
          console.error(`[Session] JWT VERIFICATION FAILED: ${_JwtVerify.message}`, {
             header: (this.headers['l-authorization'] || "").substring(0, 20) + "..."
          });
          return _JwtVerify
        }

        context.Debug({ 'message': 'Token verification successful.' }, _functionName)

        this.user = _JwtVerify
        this.token = this.headers['l-authorization']
        this.isLoggedIn = true
        this.isSystem = false
      }
      if (this.headers && !_.isEmpty(this.headers['s-authorization']) && _.isEmpty(this.headers['l-authorization']) && 'undefined' !== this.headers['s-authorization']) {
        context.Debug({ 'message': 'Found s-authorization header. Verifying token.' }, _functionName)
        const _JwtVerify = await this.JwtVerify(this.headers['s-authorization'], true)
        if (_JwtVerify && _JwtVerify instanceof Error) {
          context.Debug({ 'message': 'Token verification failed.' }, _functionName)
          return _JwtVerify
        }
        context.Debug({ 'message': 'Token verification successful.' }, _functionName)
        this.user = _JwtVerify
        this.token = this.headers['g-authorization']
        this.isSystem = true
        this.isLoggedIn = true
      }
      return this
    }

    return new Error('NOT__CONSTRUCTOR')
  } catch (error) {
    return error
  }
}

Session.prototype = {
  'name': 'Session',
  'configuration': {
    'expireIn': '6 day',
    'expireInProto': { 'day': 6, 'type': 'day' },
    'secret': CONFIG_RC.secret ?? '1Singleshot'
  },


  'Kill': async function Kill(__param) {
    try {

      if (!_.isEmpty(__param)) {
        let _Cache
        const _functionName = 'Context -> Session -> Kill'

        context.Debug({ 'message': 'Removing token from cache.' }, _functionName)

        _Cache = await this.Cache({ 'id': __param })
   
        if (_.isArray(_Cache) && _Cache.includes(this.token)) {
          context.Debug({ 'message': 'Token found in cache. Removing token.' }, _functionName)
          _Cache = _.without(_Cache, this.token)
          context.Debug({ 'message': 'Token removed from cache.' }, _functionName)

        } else if (_.isString(_Cache)) {
          _Cache = []

          context.Debug({ 'message': 'Token found in cache. Removing token.' }, _functionName)
        } else {
          context.Debug({ 'message': 'Token not found in cache.' }, _functionName)

          return new Error('REQUIRE__LOGIN')
        }

        context.Debug({ 'message': 'Updating cache.' }, _functionName)

     
        const _CacheUpdate = await this.Cache({ 'id': __param, 'whatToCache': _Cache }, { 'save': true })

  
        if (!(_CacheUpdate instanceof Error)) {
          this.isLoggedIn = false

          context.Debug({ 'message': 'Cache update failed.' }, _functionName)

          return true
        }

        context.Debug({ 'message': 'Cache updated.' }, _functionName)

        return _CacheUpdate
      }

      return new Error('EXPECTED_PARAM(KILL)')
    } catch (error) {
      return error
    }
  },


  async JwtSign(__param) {
    try {

      if (!_.isEmpty(__param)) {
        const _functionName = 'Context -> Session -> JwtSign'
        context.Debug({ 'message': 'Signing token.' }, _functionName)

        const _JwtSign = JsonWebToken.sign(__param, Session.prototype.configuration.secret, {
          'expiresIn': Session.prototype.configuration.expireIn
        })

        if (_JwtSign && _JwtSign instanceof Error) {
          context.Debug({ 'message': 'Token signing failed.' }, _functionName)
          return _JwtSign
        }
        context.Debug({ 'message': 'Token signing successful.' }, _functionName)
        const _Cache = await Session.prototype.Cache(
          {
            'id': __param.id,
            'whatToCache': _JwtSign
          },
          {
            'changeTo': [],
            'expireIn': Session.prototype.configuration.expireIn,
            'save': true
          }
        )

        if (_.isEmpty(_Cache) || (_Cache instanceof Error)) {
          context.Debug({ 'message': 'Token caching failed.' }, _functionName)
          return _Cache instanceof Error ? _Cache : new Error('EXPECTED_CACHE(SIGN)')
        }
        console.log("TOKEN GENERATED (JWT):", _JwtSign);
        console.log("CACHE SAVED FOR USER ID:", __param.id);
        context.Debug({ 'message': 'Token caching successful.' }, _functionName)
        return _JwtSign
      }

      return new Error('EXPECTED_PARAM(SIGN)')
    } catch (error) {
      return error
    }
  },
  async JwtVerify(__param, __skipCacheVerify = false) {
    try {

      if (!_.isEmpty(__param)) {
        const _functionName = 'Context -> Session -> JwtVerify'
        const _this_ = this

        context.Debug({ 'message': 'Verifying token.' }, _functionName)

        const _JwtVerify = await JsonWebToken.verify(__param, Session.prototype.configuration.secret)

 
        if (!_.isEmpty(_JwtVerify) && !(_JwtVerify instanceof Error) && !__skipCacheVerify) {
          context.Debug({ 'message': 'Token verification successful.' }, _functionName)
          context.Debug({ 'message': 'Verifying token from cache.' }, _functionName)

          const _Cache = await _this_.Cache({ 'id': _JwtVerify.id })

          console.log("TOKEN RECEIVED FROM HEADER:", __param);
          console.log("JWT DECODED PAYLOAD:", _JwtVerify);
          console.log("CACHE VALUE:", _Cache);          
          if (_Cache && _Cache instanceof Error) {
            context.Debug({ 'message': 'Token verification failed.' }, _functionName)

            return _Cache
          }

            console.log("COMPARISON:", {
            tokenFromHeader: __param,
            tokenInCache: _Cache,
            match:
              (_.isArray(_Cache) && _Cache.includes(String(__param))) ||
              (_.isString(_Cache) && _Cache === __param)
          });

          if (_.isArray(_Cache) && _Cache.includes(String(__param))) {
            context.Debug({ 'message': 'Token verification successful.' }, _functionName)

            return _JwtVerify

          } else if (_.isString(_Cache) && _Cache === __param) {
            context.Debug({ 'message': 'Token verification successful.' }, _functionName)

            return _JwtVerify
          }

      
          if (WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env || WORKING_ENV.TEST.value === CONFIG_RC.env) {
            console.log("DEVELOPMENT BYPASS: Valid JWT provided but missing from cache.");
            return _JwtVerify;
          }

          context.Debug({ 'message': 'Token verification failed.' }, _functionName)

          return new Error('NOT_FOUND(VERIFY)')
        }

        if (__skipCacheVerify) return _JwtVerify

        context.Debug({ 'message': 'Token verification failed.' }, _functionName)

        return _JwtVerify instanceof Error ? _JwtVerify : new Error('EXPECTED_JWT(VERIFY)')
      }

      return new Error('EXPECTED_PARAM(VERIFY)')
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.error(`[JwtVerify] JWT EXPIRED. Server Time: ${new Date().toISOString()}. Token: ${__param.substring(0, 20)}...`);
        const decoded = JsonWebToken.decode(__param);
        if (decoded) {
           console.error(`[JwtVerify] Token Exp: ${new Date(decoded.exp * 1000).toISOString()}`);
        }
      } else {
        console.error("[JwtVerify] Unexpected Error:", error);
      }
      return error
    }
  },

        'Cache': async function({ id, whatToCache }, $options) {
          if ($options && $options.save) {
            console.log("SAVING TO CACHE:", {
              id: Tag.Session.cache(id),
              token: whatToCache
            });
            console.log("CACHE SET CALLED");
            return await context.Cache.set(
              { 'id': Tag.Session.cache(id), whatToCache },
              $options ? { 'configuration': $options } : void 0
            );
          }

          let value = await context.Cache.get(Tag.Session.cache(id));

            if (value instanceof Promise) {
              value = await value;
            }
          console.log("FETCHING FROM CACHE:", {
            id: Tag.Session.cache(id),
            value
          });

          return value;
        }
}
