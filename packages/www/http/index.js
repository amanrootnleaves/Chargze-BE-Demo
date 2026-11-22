
import Express from "express"; 
import Helmet from "helmet"; 
import Graceful from "@ladjs/graceful";
import _RedisClient from "../../dyna_modules/Cache/redisClient.js" 
import StatsD from "hot-shots"; 
import BasicAuth from "express-basic-auth";
import Bree from "bree"; 
import Path from "path"; 
import _ from "underscore"; 
import { useLiveQuery } from "@envelop/live-query";
import { mw } from "request-ip"; 
import { createYoga } from "graphql-yoga"; 
import { createFetch } from "@whatwg-node/fetch"; 
import { useAPQ } from "@graphql-yoga/plugin-apq"; 
import { useDisableIntrospection } from "@graphql-yoga/plugin-disable-introspection"; 
import { blockFieldSuggestionsPlugin } from "@escape.tech/graphql-armor-block-field-suggestions"; 
import { useGraphQLMiddleware } from "@envelop/graphql-middleware"; 
import { useRateLimiter } from "@envelop/rate-limiter"; 
import { EnvelopArmor } from "@escape.tech/graphql-armor"; 
import { renderGraphiQL } from "@graphql-yoga/render-graphiql"; 
import { envelop } from "@envelop/core"; 
import { useResponseCache } from "@envelop/response-cache"; 
import { createRedisCache } from "@envelop/response-cache-redis"; 
import { useGraphQlJit } from "@envelop/graphql-jit"; 
import { useStatsD } from "@envelop/statsd"; 
import { useSignatureVerification } from "../../middleware/signature";


import Router from "../../routes";
import Context, { context, LiveStore } from "../../context";
import Middleware from "../../middleware";
import CronJobs from "../../cron";


import Hook from "./hooks";


let _ExpressListener;


const _Express = Express();
const _StatsD = new StatsD({
  port: 8020,
  globalTags: { env: WORKING_ENV.PRODUCTION.value === CONFIG_RC.env },
});
const _Cache = createRedisCache({ redis: _RedisClient });
const _Server = createYoga({
  port: CONFIG_RC.graphqlPort,
  cors:
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env
      ? {
          origin: "*.rezune.in",
          credentials: true,
          methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
        }
      : void 0,
  renderGraphiQL,
  maskedErrors: false,
  batching: WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  context: Context,
  graphqlEndpoint: "/v1/graphql",
  graphiql: {
    subscriptionsProtocol: "GRAPHQL_SSE",
  },
  schema: Router,
  landingPage: WORKING_ENV.PRODUCTION.value !== CONFIG_RC.env,
  fetchAPI: createFetch({
    formDataLimits: {
      fileSize: 1e7,
      files: 10,
      fieldSize: 1000000,
      headerSize: 1000000,
    },
  }),
  parserCache: WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  validationCache: WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  plugins: [
    useLiveQuery({ liveQueryStore: LiveStore }),
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env
      ? useDisableIntrospection()
      : void 0,
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env
      ? void 0
      : blockFieldSuggestionsPlugin(),
    useAPQ({
      responseConfig: {
        forceStatusCodeOk: true,
      },
    }),
    useSignatureVerification(),
    useGraphQLMiddleware(Middleware),
    envelop({
      plugins: [
        useResponseCache({
          cache: _Cache,
          ttl: 60 * 1000 * 60,
          ttlPerType: {
            Stock: 500,
          },
          ignoredTypes: ["token"],
        }),
        useGraphQlJit(),
        useStatsD({
          client: _StatsD,
          prefix: "graphql",
          skipIntrospection: false,
        }),
      ],
    }),
    useRateLimiter({
      identifyFn: (r) => r?.Session?.user?.id,
    }),
    ...new EnvelopArmor({ maxDepth: { n: 10 } }).protect().plugins,
  ],
});


_Express.use(
  Helmet({
    contentSecurityPolicy: "production" === process.env.NODE_ENV ? true : false,
  }),
);


_Express.get("/verify-email", (req, res) => {
  const token = req.query.token;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Rezune</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 90%;
        }
        h1 {
          color: #003366; /* Dark Blue */
          margin-bottom: 20px;
        }
        p {
          color: #333333;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .btn {
          display: inline-block;
          background-color: #003366; /* Dark Blue */
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        .btn:hover {
          background-color: #002244;
        }
        .status-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        #loading { display: block; }
        #success-message { display: none; }
        #error-message { display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="loading">
          <div class="status-icon"></div>
          <h1>Verifying your email...</h1>
          <p>Please wait while we verify your email address.</p>
        </div>
        
        <div id="success-message">
          <div class="status-icon success"></div>
          <h1>Email Verified!</h1>
          <p>Thank you for registering with us. Your email has been successfully verified.</p>
          <p>You can login now.</p>
          <!-- Assuming the main app is at root or user knows where to login -->
          <a href="/" class="btn">Go to Login</a>
        </div>

        <div id="error-message">
          <div class="status-icon error"></div>
          <h1>Verification Failed</h1>
          <p id="error-text">We could not verify your email. The link may be invalid or expired.</p>
          <a href="/" class="btn">Go Home</a>
        </div>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', async () => {
          const token = "${token}";
          
          if (!token) {
            showError("Invalid verification link.");
            return;
          }

          try {
            const query = \`
              mutation VerifyEmail($token: String!) {
                AccountVerifyEmail(token: $token) {
                  id
                  email
                  emailVerified
                }
              }
            \`;

            const response = await fetch('/v1/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                query,
                variables: { token }
              })
            });

            const result = await response.json();

            if (result.errors) {
              console.error('GraphQL Errors:', result.errors);
              showError(result.errors[0].message || "Verification failed.");
            } else if (result.data && result.data.AccountVerifyEmail) {
              showSuccess();
            } else {
              showError("Unexpected response from server.");
            }
          } catch (error) {
            console.error('Network Error:', error);
            showError("A network error occurred. Please try again later.");
          }
        });

        function showSuccess() {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('success-message').style.display = 'block';
          document.getElementById('error-message').style.display = 'none';
        }

        function showError(message) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('success-message').style.display = 'none';
          document.getElementById('error-message').style.display = 'block';
          document.getElementById('error-text').innerText = message;
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

_Express.get("/", (req, res) => {
  res.redirect("/v1/graphql");
});

_Express.use(mw());
_Express.use(_Server.graphqlEndpoint, _Server);
_Express.use(Express.json({ 
  verify: (req, res, buf) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

_Express.use(
  BasicAuth({
    users: {

      [CONFIG_RC.osUsername]: CONFIG_RC.secret,
      "ashutoshadhikari@outlook.com": "123123",
    },
    challenge: true,
  }),
);


_Express.get("/v1/playground", (req, res) => {
  
  res.redirect("/v1/graphql");
});


_Express.disable("x-powered-by");


const _Async = async () => {
  let _Bree_;

  await Hook("preStart", Context);

  const jobs = [];

  for (const job of CronJobs)
    jobs.push({
      name: job.name,
      path: job,
      cron: job.time,
      interval: job.interval,
    });

  if (!_.isEmpty(jobs)) {
    _Bree_ = new Bree({
      jobs,
      root: Path.join(__dirname, "../../cron"),
      ErrorHandler(error, workerMetadata) {
        const _functionName = "Bree -> errorHandler";

        context.Debug(
          {
            message: `An error occurred in worker ${workerMetadata.name}:\n${error.stack}`,
            error,
          },
          _functionName,
        );
      },
      workerMessageHandler(message) {
        const _functionName = "Bree -> workerMessageHandler";

        context.Debug({ message }, _functionName);
      },
    });

    await _Bree_.start();
  }

  console.log("DEBUG: Attempting to start server on port:", CONFIG_RC.httpPort)
  _ExpressListener = _Express.listen(CONFIG_RC.httpPort, () => {
    const _functionName = "Www -> Http";

    context.Debug(
      { message: `Server running on ${CONFIG_RC.httpPort}` },
      _functionName,
    );

    return Hook("postStart", Context);
  });

  _ExpressListener.setTimeout(30 * 60 * 1000);

const _Graceful_ = new Graceful({
  ...(!_.isEmpty(jobs) && _Bree_ && { brees: [_Bree_] }),
  servers: [_ExpressListener],
  redisClients: [_RedisClient],
  customHandlers: [
    async () => {
      const _functionName = "Graceful -> customHandlers";

      context.Debug(
        { message: "Graceful shutdown requested." },
        _functionName,
      );

      await Hook("preStop", Context);

      _ExpressListener?.close?.(async () => {
        const _functionNameAgain = "Graceful -> customHandlers";

        context.Debug(
          { message: "Shutting down express server." },
          _functionNameAgain,
        );

        await Hook("postStop", Context);
      });
    },
  ],
});

  _Graceful_.listen();
};


module.exports = _Async;


