/*
 * JS
 */
(() => {
  // Import necessary modules
  const _ = require("underscore");

  // Array prototype extends
  Array.groupObjectBy = (__array, __groupBy) =>
    __array.reduce((__ac, a) => {
      // Const assignment.
      const _acFind = __ac.find((x) => x[__groupBy] === a[__groupBy]);

      // If key is found.
      if (_acFind) {
        // Push data.
        _acFind.LIST.push(a);
      } else {
        // Push new object to accumulator.
        __ac.push({ ...a, LIST: [a] });
      }

      // Return grouped version.
      return __ac;
    }, []);
  Array.indexestr = (__arr, __val) => {
    // Local variable.
    let _i;

    // Const assignment.
    const _indexes = [];

    // Variable assignment.
    _i = -1;

    /*
     * Consider doing only if __arr is arrays
     * nothing else.
     */
    if (__arr.constructor !== Array) return __arr;

    // While indexes count
    while (-1 !== (_i = __arr.indexOf(__val, _i + 1))) {
      // Push index
      _indexes.push(_i);
    }

    // Return indexes
    return _indexes;
  };

  // Object prototype extends
  Object.dot = (__object) => ({
    get: (__path, __defaultValue) =>
      __path.split(".").reduce((o, p) => (o ? o[p] : __defaultValue), __object),
    set: (__path, __value) =>
      __path
        .split(".")
        .reduce(
          (o, p, i) =>
            (o[p] = (__path.split(".").length += i) ? __value : o[p] || {}),
          __object,
        ),
  });
  Object.depthOf = (__object) => {
    // Local variable.
    let _jamaica, _level;

    // Variable assignment.
    _level = 1;

    // Loop over object properties.
    for (_jamaica in __object) {
      // HasOwnProperty check.
      if (!__object.hasOwnProperty(_jamaica)) continue;

      /*
       * Only continue if given object value
       * is typeof object.
       */
      if ("object" === typeof __object[_jamaica]) {
        // Const assignment.
        const depthBy = 1;
        const _depth = Object.depthOf(__object[_jamaica]) + depthBy;

        // Variable assignment.
        _level = Math.max(_depth, _level);
      }
    }

    // Return depth.
    return _level;
  };
  Object.filterOut = Object.filterOut = (list, key) => {
    const seen = new Set();

    return list.filter((item) => {
      const val = item[key];
      if (seen.has(val)) {
        return false;
      }
      seen.add(val);

      return true;
    });
  };
  Object.MuiToPrismaFilter = (field, operator, value) => {
    switch (operator) {
      case "is":
        return { [field]: value };
      case "not":
        return { [field]: { not: value } };
      case "doesNotEqual":
        return { [field]: { not: value } };
      case "doesNotContain":
        return { [field]: { not: { contains: value } } };
      case "isAnyOf":
        if ("boolean" === typeof value?.[0]) return { [field]: value[0] };

        return { [field]: { in: value } };
      case ">":
        return { [field]: { gt: value } };
      case "<":
        return { [field]: { lt: value } };
      case ">=":
        return { [field]: { gte: value } };
      case "<=":
        return { [field]: { lte: value } };
      case "after":
        return { [field]: { gt: value } };
      case "before":
        return { [field]: { lt: value } };
      case "onOrAfter":
        return { [field]: { gte: value } };
      case "onOrBefore":
        return { [field]: { lte: value } };
      case "startsWith":
        return { [field]: { startsWith: value, mode: "insensitive" } };
      case "contains":
        return { [field]: { contains: value, mode: "insensitive" } };
      case "endsWith":
        return { [field]: { endsWith: value, mode: "insensitive" } };
      case "isEmpty":
        return { [field]: null };
      case "isNotEmpty":
        return { [field]: { not: undefined } };
      case "array_contains":
        return { [field]: { array_contains: value } };
      case "equals_json":
        return { [field]: { equals: value } };
      default:
        return { [field]: value };
    }
  };
  Object.MuiToPrismaRawQueryFilter = (filters, tableColumns) => {
    // If filters are not provided.
    if (!filters?.items?.length) return "";

    // Check for conditions.
    const conditions = filters.items.map((item) => {
      // Check if field is a date.
      const isDate =
        item.field.includes("createdAt") ||
        item.field.includes("updatedAt") ||
        _.isDate(item.value);

      // Const assignment.
      const field =
        tableColumns.includes(item.field) || isDate
          ? `"${item.field}"${isDate && item.value ? "::timestamptz" : ""}`
          : `(data->>'${item.field}')${isDate && item.value ? "::timestamptz" : ""}`;

      // Switch cases for handling clauses.
      switch (item.operator) {
        case "is":
          return isDate
            ? `${field} = '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} = '${item.value}'`;
        case "not":
          return isDate
            ? `${field} != '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} != '${item.value}'`;
        case "equals":
          return isDate
            ? `${field} = '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} = '${item.value}'`;
        case "after":
          return isDate
            ? `${field} > '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} > '${item.value}'`;
        case "onOrAfter":
          return isDate
            ? `${field} >= '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} >= '${item.value}'`;
        case "before":
          return isDate
            ? `${field} < '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} < '${item.value}'`;
        case "onOrBefore":
          return isDate
            ? `${field} <= '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} <= '${item.value}'`;
        case "notEquals":
          return isDate
            ? `${field} != '${item.value}'${isDate && item.value ? "::timestamptz" : ""}`
            : `${field} != '${item.value}'`;
        case "contains":
          return `${field} LIKE '%${item.value}%'`;
        case "startsWith":
          return `${field} LIKE '${item.value}%'`;
        case "endsWith":
          return `${field} LIKE '%${item.value}'`;
        case "greaterThan":
          return `${field} > '${item.value}'`;
        case "lessThan":
          return `${field} < '${item.value}'`;
        case "greaterOrEqual":
          return `${field} >= '${item.value}'`;
        case "lessOrEqual":
          return `${field} <= '${item.value}'`;
        default:
          throw new Error(`Unsupported operator: ${item.operator}`);
      }
    });

    // Return conditions.
    return conditions.join(
      ` ${filters.logicOperator?.toUpperCase() || "AND"} `,
    );
  };
  Object.WeightedRandomAlgorithm = (__weights) => {
    // Local variable.
    let i, j;

    // Variable assignment.
    const table = [];

    /*
     * Loop over spec.
     * and generate table.
     */
    for (i in __weights) {
      // HasOwnProperty check.
      if (!__weights.hasOwnProperty(i)) continue;

      /*
       * Push to table.
       * based on weight.
       */
      for (j = 0; j < __weights[i] * 10; j++) table.push(i);
    }

    // Return function.
    return () => table[Math.floor(Math.random() * table.length)];
  };
  Object.depthOf = (__object) => {
    // Local variable.
    let _jamaica, _level;

    // Variable assignment.
    _level = 1;

    // Loop over object properties.
    for (_jamaica in __object) {
      // HasOwnProperty check.
      if (!__object.hasOwnProperty(_jamaica)) continue;

      /*
       * Only continue if given object value
       * is typeof object.
       */
      if ("object" === typeof __object[_jamaica]) {
        // Const assignment.
        const depthBy = 1;
        const _depth = Object.depthOf(__object[_jamaica]) + depthBy;

        // Variable assignment.
        _level = Math.max(_depth, _level);
      }
    }

    // Return depth.
    return _level;
  };
  Object.ServerGlobalConfigurationFetch = async () => {
    // Local variables.
    let _configuration;

    // Const assignment.
    const Axios = require("axios"); // Npm: axios library.
    const __Debug = require("debug"); // Npm: debug library.
    const _ = require("underscore"); // Npm: utility module.
    const { AES } = require("crypto-js"); // Npm: crypto-js library.

    // Const assignment.
    const _Debug = __Debug("Boot");

    // Style guide.
    _Debug("Requesting boot configuration for given platform.");

    // Get boot configuration.
    const _BootConfiguration = await Axios({
      url: process.env.BOOT_URL,
      method: "post",
      headers: {
        "content-type": "application/json",
        "b-authorization": AES.encrypt(
          `WTF__313232`?.toString(),
          process.env.APP_PASSWORD,
        ),
        authorization: `Basic ${btoa(`${process.env.APP_USERNAME}:${process.env.APP_PASSWORD}`)}`,
      },
      data: {
        query: `
        query($ip: String!) {
          PlatformRead(search: $ip) {
            id,
            isBlocked,
            configuration,
            message,
            status
          }
        }`,
        variables: {
          ip: process.env.HOST_IP,
        },
      },
    });

    // Style guide.
    _Debug("Successfully received response for given platform.");

    // If getting boot configuration fails then report failure.
    if (_BootConfiguration instanceof Error) {
      // Const assignment.
      const error = new Error(
        "Failed to get boot configuration for given platform.",
      );

      // Style guide.
      _Debug(error);

      // Report failure.
      return error;
    }
    if (0 < _BootConfiguration?.data?.errors?.length) {
      // Const assignment.
      const error = new Error(
        "Failed to get boot configuration for given platform.",
      );

      // Style guide.
      _Debug(error);

      // Report failure.
      return error;
    }

    // Report failure if boot configuration is empty.
    if (
      _BootConfiguration?.data?.data?.PlatformRead &&
      _.isEmpty(
        _.first(_BootConfiguration?.data?.data?.PlatformRead)?.configuration,
      )
    )
      return new Error("PLATFORM_NOT_FOUND");
    if (
      _BootConfiguration?.data?.data?.PlatformRead &&
      "PLATFORM_NOT_FOUND" ===
        _.first(_BootConfiguration?.data?.data?.PlatformRead)?.status
    )
      return new Error("PLATFORM_NOT_FOUND");

    // Style guide.
    _Debug("Successfully received boot configuration for given platform.");

    // Const assignment.
    _configuration = JSON.parse(
      JSON.parse(
        _.first(_BootConfiguration?.data?.data?.PlatformRead)?.configuration ??
          {},
      ),
    );
    const _bootConfig = {
      isPlatformTrafficBlocked: _.first(
        _BootConfiguration?.data?.data?.PlatformRead,
      )?.isBlocked,
    };

    // If configuration is string than parse it.
    if ("string" === typeof _configuration)
      _configuration = JSON.parse(_configuration);

    // Loop over globals which needs to be export.
    for (const j in _configuration) {
      /*
       * If given j exist in global than skip
       * assigning it.
       */
      if (_bootConfig && _bootConfig[j]) continue;

      // Assign key value to global.
      _bootConfig[j] = _configuration[j];
    }

    // Style guide.
    _Debug("Successfully assigned boot configuration to global.");

    // Const assignment.
    const _globalsToExport = {
      CONFIG_RC: _bootConfig,
      WORKING_ENV: new Enum({
        DEVELOPMENT: "DEVELOPMENT",
        PRODUCTION: "PRODUCTION",
        STAGING: "STAGING",
      }),
      ACCOUNT_TYPE: new Enum({
        ADMIN: "ADMIN",
        COMPANY: "COMPANY",
        VENDOR: "VENDOR",
        EMPLOYEE: "EMPLOYEE",
      }),
    };

    // Loop over globals which needs to be export.
    for (const j in _globalsToExport) {
      /*
       * If given j exist in global than skip
       * assigning it.
       */
      if (global && global[j]) continue;

      // Assign key value to global.
      global[j] = _globalsToExport[j];
    }

    // Report void 0.
    return void 0;
  };

  // String prototype extends
  String.toCapitalize = (__string) => {
    /*
     * If given string is not empty than use it
     * else prefer this.
     */
    if (__string && "string" === typeof __string)
      return (
        __string.toLowerCase().charAt(0).toUpperCase() +
        __string.toLowerCase().slice(1)
      );

    // Return capitalize.
    return void 0;
  };
  String.toCamelCase = (__string) =>
    __string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/gu, (__match, __index) => {
      // Return string on null match
      if (0 === Number(__match)) return "";

      // Return camelcase.
      return 0 === __index ? __match.toLowerCase() : __match.toUpperCase();
    });
  String.random = (length) => {
    // Local variable.
    let _result, i;

    // Variable assignment.
    _result = "";

    // Const assignment.
    const _characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const _charactersLength = _characters.length;

    // Loop over length and generate string.
    for (i = 0; i < length; i++) {
      // Concat random char at given random index.
      _result += _characters.charAt(
        Math.floor(Math.random() * _charactersLength),
      );
    }

    // Return result.
    return _result;
  };
  String.hexPad = (n, width, z) => {
    // Variable assignment.
    z = z || "0";
    n = `${n}`;

    // Return padding.
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  };
  String.ipv6ToIpv4 = (__string) =>
    /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/u.exec(__string)
      ? /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/u.exec(__string)[1]
      : __string;
  String.extractIpFromString = (__string) =>
    /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gu.exec(__string)
      ? /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gu.exec(__string)[1]
      : __string;

  // Number object extend.
  Number.toFixedNumber = (__string, __digits, __base) =>
    Math.round(__string * ((__base || 10) ** __digits || 2)) /
    ((__base || 10) ** __digits || 2);

  // Update big int.
  // eslint-disable-next-line no-extend-native
  BigInt.prototype.toJSON = function toJSON() {
    // Convert to string.
    return this.toString();
  };
})();
