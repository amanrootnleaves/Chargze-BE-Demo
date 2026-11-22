
import Argon2 from "argon2"; // Npm: argon2 encryption library.
import _ from "underscore"; // Npm: utility module.
import { createId } from "@paralleldrive/cuid2"; // Npm: cuid2 library.

import GstCreate from "../../../../Gst/__mutation__/Create";
import AccountUpload from "../../Upload";
import { SendVerificationEmail } from "../../../../../dyna_modules/Email";
import { v4 as uuidv4 } from "uuid";


export default async (
  __,
  {
    email,
    password,
    accountType,
    displayName,
    fullName,
    address,
    thumbnailStoredAt,
    phoneNumber,
    gstDisplayName,
    gstDescription,
    gstState,
    gstCountry,
    publicKey,
  },
  Context,
) => {
  try {

    if (Context && Context.isContext) {
      const _functionName = "Routes -> Account -> Register -> WithEmail";
      const _accountId = createId();

      await Context.Debug(
        { message: `Registering account with email: ${email}` },
        _functionName,
      );

      const _AccountFindUnique = await Context.DataBase.account.findUnique({
        where: { email },
      });

  
      if (_AccountFindUnique instanceof Error) {
        await Context.Debug(
          {
            message: `Failed to find account with email: ${email}`,
            error: _AccountFindUnique,
          },
          _functionName,
        );

        return _AccountFindUnique;
      } else if (!_.isEmpty(_AccountFindUnique)) {
        // Style guide.
        await Context.Debug(
          { message: `Account with email: ${email} already exists.` },
          _functionName,
        );

        // Return login
        return new Error("ACCOUNT_WITH_EMAIL_FOUND");
      }

      if (!_.isEmpty(phoneNumber)) {
        const _AccountFindPhone = await Context.DataBase.account.findFirst({
          where: { phoneNumber },
        });

        if (!_.isEmpty(_AccountFindPhone)) {
          await Context.Debug(
            {
              message: `Account with phone number: ${phoneNumber} already exists.`,
            },
            _functionName,
          );
          return new Error("ACCOUNT_WITH_PHONE_NUMBER_FOUND");
        }
      }

      // Local variable.
      let _AccountFindMany;

      /*
       * If displayName is provided than check then
       * no other account have given displayName if
       * so than report failure.
       */
      _AccountFindMany = await Context.DataBase.account.findMany({
        where: { displayName },
      });
      _AccountFindMany = _.isArray(_AccountFindMany)
        ? _.first(_AccountFindMany)
        : _AccountFindMany;

      // Report failure if _AccountFindMany caught exception.
      if (_AccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: `Failed to find account with displayName: ${displayName}`,
            error: _AccountFindMany,
          },
          _functionName,
        );

        // Report failure.
        return _AccountFindMany;
      }

      /*
       * If _AccountFindMany is not empty
       * than report failure else update data.
       */
      if (
        !_.isEmpty(_AccountFindMany) &&
        _AccountFindMany.displayName === displayName
      ) {
        // Style guide.
        await Context.Debug(
          { message: `Account with displayName: ${displayName} already exist` },
          _functionName,
        );

        // Report failure.
        return new Error("ACCOUNT_DISPLAY_NAME_ALREADY_EXISTS");
      }

      // Style guide.
      await Context.Debug(
        { message: `Creating account with email: ${email}` },
        _functionName,
      );

      // Get account type from global account type.
      accountType = accountType ? ACCOUNT_TYPE.get(accountType)?.value : void 0;

      // Create account entry for given user details.
      const _AccountCreate = await Context.DataBase.account.create({
        data: {
          id: _accountId,
          displayName: displayName,
          accountType: accountType,
          email: email,
          password: await Argon2.hash(password),
          phoneNumber: phoneNumber,
          address: address,
          fullName: fullName,
          verificationToken: uuidv4(),
          publicKey: publicKey,
          emailVerified: accountType === ACCOUNT_TYPE.ADMIN.value,
          ...(Context.Session?.user?.id && {
            ParentAccount: {
              connect: { id: Context.Session.user.id },
            },
          }),
        },
      });

      // If creating account caught exception than report failure.
      if (_.isEmpty(_AccountCreate) || _AccountCreate instanceof Error) {
        // Style guide.
        await Context.Debug(
          {
            message: `Failed to create account with email: ${email}`,
            error: _AccountCreate,
          },
          _functionName,
        );

        // Report failure.
        return _AccountCreate instanceof Error
          ? _AccountCreate
          : new Error("FAILED_TO_CREATE_ACCOUNT");
      }

      // If image is available then add it.
      if (thumbnailStoredAt?.then) {
        // Execution mutation for handling image.
        const _AccountUpload = await AccountUpload(
          __,
          { accountId: _AccountCreate?.id, thumbnailStoredAt },
          Context,
        );

        // Report failure if error is caught.
        if (_AccountUpload instanceof Error) {
          // Report failure.
          return _AccountUpload;
        }
      }

      // Style guide.
      await Context.Debug(
        { message: `Account created with email: ${email}` },
        _functionName,
      );
      // Style guide.
      await Context.Debug(
        { message: `Account created with email: ${email}` },
        _functionName,
      );

      // Send verification email asynchronously so it doesn't block the UI
      // Only send if it's not an admin being auto-created
      if (accountType !== ACCOUNT_TYPE.ADMIN.value) {
        SendVerificationEmail(email, _AccountCreate.verificationToken).catch(
          (err) => {
            Context.Debug(
              {
                message: `Failed to send verification email to: ${email}`,
                error: err,
              },
              _functionName,
            );
          },
        );
      }

      // Create gst if details are passed in.
      if (
        !_.isEmpty(gstDisplayName) &&
        !_.isEmpty(gstCountry) &&
        !_.isEmpty(gstState)
      ) {
        // Execute Context.
        const _GstCreate = await GstCreate(
          __,
          {
            displayName: gstDisplayName,
            description: gstDescription,
            state: gstState,
            country: gstCountry,
            accountId: _accountId,
          },
          Context,
        );

        // If Checking scope caught exception.
        if (_GstCreate instanceof Error) {
          // Style guide.
          await Context.Debug(
            { message: `Failed to create GST for account.`, error: _GstCreate },
            _functionName,
          );

          // Report failure.
          return _GstCreate;
        }
        if (_.isEmpty(_GstCreate)) {
          // Style guide.
          await Context.Debug(
            { message: `Failed to create GST for account.`, error: _GstCreate },
            _functionName,
          );

          // Report failure.
          return new Error("EXPECTED_GST_TO_EXIST");
        }
      }

      return {
        message: `Registration successful. Please check your email (${email}) to verify your account.`,
        status: "CREATE_SUCCESSFUL",
        ..._AccountCreate,
      };
    }

    // Report failure.
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    // Report failure.
    return error;
  }
};
