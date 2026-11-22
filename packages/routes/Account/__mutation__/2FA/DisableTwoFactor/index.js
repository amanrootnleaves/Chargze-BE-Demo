import Argon2 from 'argon2'

export default async (__, { input }, Context) => {
  const _functionName = 'Routes -> Account -> Mutation -> DisableTwoFactor'

  try {
    if (!Context?.isContext) {
      return new Error('MISSING__CONTEXT')
    }

    const userId = Context.Session?.user?.id
    if (!Context.Session?.isLoggedIn || !userId) {
      return new Error('REQUIRE_AUTHENTICATION')
    }

    const { password } = input

    await Context.Debug(
      { 'message': 'Disabling 2FA via password started.' },
      _functionName
    )

    const result = await Context.DataBase.$transaction(
      async transaction => {
        const account = await transaction.account.findUnique({
          'where': { 'id': userId },
          'select': { 'id': true, 'password': true }
        })

        if (!account) {
          throw new Error('ACCOUNT_WITH_ID_NOT_FOUND')
        }

        if (
          !account.password || !(await Argon2.verify(account.password, password))
        ) {
          throw new Error('INVALID_CREDENTIALS')
        }

        await transaction.account.update({
          'where': { 'id': userId },
          'data': { 'is2FAEnabled': false }
        })

        return {
          'success': true,
          'message': 'Two-Factor Authentication disabled successfully.'
        }
      },
      {
        'maxWait': 5000,
        'timeout': 20000
      }
    )

    await Context.Debug(
      { 'message': '2FA disabled successfully.', userId },
      _functionName
    )

    return result
  } catch (error) {
    await Context.Debug(
      { 'message': 'Disable 2FA failed.', 'error': error.message },
      _functionName
    )

    return error
  }
}
