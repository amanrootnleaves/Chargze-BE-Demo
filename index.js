/*
 * IMPORTS
 */
const __Debug = require("debug"); // Npm: debug library.

require("./packages/iife");
require("enum").register();
require("app-root-path").setPath("./");
require("graphql-import-node/register");


const _Server = async () => {
  const _Debug = __Debug("Boot");

  try {
    const _home = require("path").resolve("./");

    require("dotenv").config({ path: `${_home}/.env` });

    const _globalsToExport = {
      CONFIG_RC: {
        httpPort: parseInt(process.env.APP_PORT) || 4000,
        filemanager: {
          endpoint: "https://blr1.digitaloceanspaces.com",
          bucketname: "rootandleaves",
          key: "DO801P3MKUP4DB9X26NL",
          secret: "8efkaeQukTemyV7BfeHEKmBpePdpZGlxYjNp/nMVJU0",
          region: "blr1",
          acl: "public-read",
          responseContentDisposition: "attachment",
          name: "digitalocean",
        },
        debug: {
          dsn: "https://fff2836eb95449d9a8c4a591cfc17008@o4506946981920768.ingest.us.sentry.io/4506946985852928",
        },
        secret: "U8dtV12W/|K]",
        osUsername: "rezune",
        osPassword: "1Singleshot",
        env: "DEVELOPMENT",
        postgresDBReadUrl: process.env.DATABASE_POSTGRES_READ_URL,
        postgresDBWriteUrl: process.env.DATABASE_POSTGRES_WRITE_URL,
      },
      WORKING_ENV: new Enum({
        DEVELOPMENT: "DEVELOPMENT",
        PRODUCTION: "PRODUCTION",
        STAGING: "STAGING",
      }),
      ACCOUNT_TYPE: new Enum({
        ADMIN: "ADMIN",
        VENDOR: "VENDOR",
        EMPLOYEE: "EMPLOYEE",
        COMPANY: "COMPANY",
      }),
    };

    for (const j in _globalsToExport) {
   
      if (global && global[j]) continue;

      global[j] = _globalsToExport[j];
    }

    const _WWW = require("./packages/www/http/index.js");

    await (_WWW.default ? _WWW.default() : _WWW());

    return void 0;
  } catch (error) {
    _Debug(error);

    return error;
  }
};


_Server().catch((e) =>
  __Debug("Boot")(`Something went wrong. found error: ${e}`),
);


setInterval(() => {
}, 1000 * 60 * 60);