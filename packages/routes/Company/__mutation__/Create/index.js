/*
 * SIBLINGS
 */
import RegisterWithEmail from '../../../Account/__mutation__/Register/WithEmail'

/*
 * EXPORTS
 */
export default async (__, {
  displayName,
  gstIn,
  address,
  phoneNumber,
  country,
  state,
  email,
  password
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Customer -> Create'

      // Check if email with given email exists.
      const _accountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'email': email } })

      // Report failure if finding account caught exception.
      if (_accountFindUnique instanceof Error) {
        // Report failure.
        return _accountFindUnique
      }

      // If email exists, throw error.
      if (_accountFindUnique) {
        // Report failure.
        return new Error('ACCOUNT_EMAIL_EXISTS')
      }

      // Register given email.
      const _registerWithEmail = await RegisterWithEmail(__, {
        'displayName': displayName,
        'email': email,
        'password': password,
        'address': address,
        'phoneNumber': phoneNumber,
        'accountType': ACCOUNT_TYPE.COMPANY.value
      }, Context)

      // If registering given account caught exception, report failure.
      if (_registerWithEmail instanceof Error) {
        // Report failure.
        return _registerWithEmail
      }

      // If registering given account failed, report failure.
      if (!_registerWithEmail) {
        // Report failure.
        return new Error('ACCOUNT_REGISTRATION_FAILED')
      }

      // Create company under given main account.
      const _CustomerCreate = await Context.DataBase.company.create({
        'data': {
          displayName,
          address,
          phoneNumber,
          'Gst': {
            'create': {
              'displayName': gstIn,
              'description': 'default gst for given company.',
              'country': JSON.stringify(country ?? {}),
              'state': JSON.stringify(state ?? {})
            }
          },
          'Account': {
            'connect': {
              'id': _registerWithEmail.id
            }
          }
        }
      })

      // If creating customer caught exception then report failure.
      if (_CustomerCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create customer', 'error': _CustomerCreate }, _functionName)

        // Report failure.
        return _CustomerCreate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the customer` }, _functionName)

      // Return success.
      return {
        ..._CustomerCreate,
        'message': 'Successfully created customer.',
        'status': 'CREATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
