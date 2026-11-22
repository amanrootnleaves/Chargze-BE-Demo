/*
 * IMPORTS
 */
import _ from "underscore"; // Npm: utility module.
import { AES, enc } from "crypto-js"; // Npm: Crypto-js for hashing graphql queries.

/*
 * OBJECTS
 */
const isAuthenticated = async (
  __resolve,
  __directiveArgs,
  __,
  ___,
  Context,
  ____,
) => {
  // Const assignment.
  const _functionName = `Routes -> Account -> isAuthenticated(${____.fieldName})`;

  /*
   * Only proceed if user is logged in
   * else report failure.
   */
  if (
    Context &&
    Context.Session &&
    Context.Session.isLoggedIn &&
    !Context.noAuth
  ) {
    // Local variable.
    let _isBrowser;

    // Style guide.
    Context.Debug({ message: "User is logged in." }, _functionName);

    /*
     * Report failure if __directiveArgs doesn't matches to current
     * user role.
     */
    if (
      __directiveArgs &&
      __directiveArgs.accountType &&
      !__directiveArgs.accountType?.includes(Context.Session.user.accountType)
    ) {
      // Style guide.
      Context.Debug(
        {
          message: `account type ${Context.Session.user.accountType} is not in ${__directiveArgs.accountType} for field ${____.fieldName}`,
        },
        _functionName,
      );

      // Report failure.
      return new Error("UNAUTHORIZED_ACCESS");
    }

    // Check if token is required.
    if (
      __directiveArgs.requireToken &&
      _.isEmpty(Context.Session.headers["d-authorization"])
    ) {
      // Style guide.
      Context.Debug({ message: "Token is required." }, _functionName);

      // Report failure.
      return new Error("UNAUTHORIZED_ACCESS");
    }

    // Const assignment.
    _isBrowser = Context?.Session?.headers?.["b-authorization"];

    // If isBrowser is present then decrypt it.
    if (_isBrowser) {
      // Decrypt isBrowser.
      _isBrowser = AES.decrypt(_isBrowser, process.env.APP_PASSWORD);
      _isBrowser = _isBrowser.toString(enc.Utf8);
    }

 
    if (_.isEmpty(_isBrowser) || !_isBrowser?.includes("WTF")) {
      // Style guide.
      Context.Debug({ message: "Request is not from browser." }, _functionName);

      // Only proceed if x authorization is not passed.
      if (_.isEmpty(Context?.Session?.headers?.["x-authorization"])) {
        // Check if header has accessToken.
        if (_.isEmpty(Context?.Session?.headers?.["d-authorization"])) {
          return new Error("REQUIRE_ACCESS_TOKEN");
        }
        // Return the original resolver.
        return __resolve(__, ___, Context, ____);
      } else if (
        Context?.Session?.headers?.["x-authorization"] ===
        process.env.APP_PASSWORD
      ) {
        // Style guide.
        Context.Debug({ message: "Request is from browser." }, _functionName);

        // Return the original resolver.
        return __resolve(__, ___, Context, ____);
      }

      // Style guide.
      Context.Debug({ message: "Request is not from browser." }, _functionName);

      // Report failure.
      return new Error("UNAUTHORIZED_ACCESS");
    }

    // Style guide.
    Context.Debug({ message: "Request is from browser." }, _functionName);

    // Return the original resolver.
    return __resolve(__, ___, Context, ____);
  } else if (Context.noAuth) {
    // Style guide.
    Context.Debug(
      { message: "Context running internal graph.." },
      _functionName,
    );

    // Return the original resolver.
    return __resolve(__, ___, Context, ____);
  }

  // Style guide.
  Context.Debug(
    { message: "User is not logged in reporting failure." },
    _functionName,
  );

  // Else report failure.
  return new Error("REQUIRE__LOGIN");
};

/*
 * EXPORTS
 */
export default isAuthenticated;
