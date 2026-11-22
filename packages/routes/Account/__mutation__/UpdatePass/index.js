import Argon2 from 'argon2'

export default async (__, { input }, Context) => {
  const _functionName = 'Routes -> Account -> Mutation -> ChangePassword'

  try {
    if (!Context?.isContext) {
      return new Error('MISSING__CONTEXT')
    }

    const userId = Context.Session?.user?.id
    if (!Context.Session?.isLoggedIn || !userId) {
      return new Error('REQUIRE_AUTHENTICATION')
    }

    const { currentPassword, newPassword } = input

    await Context.Debug(
      { 'message': 'Change password process started.' },
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
          !account.password || !(await Argon2.verify(account.password, currentPassword))
        ) {
          throw new Error('INVALID_CREDENTIALS')
        }

        const hashedPassword = await Argon2.hash(newPassword)

        await transaction.account.update({
          'where': { 'id': userId },
          'data': { 'password': hashedPassword }
        })

        return {
          'success': true,
          'message': 'Password changed successfully.'
        }
      },
      {
        'maxWait': 5000,
        'timeout': 20000
      }
    )

    await Context.Debug(
      { 'message': 'Password changed successfully.', userId },
      _functionName
    )

    return result
  } catch (error) {
    await Context.Debug(
      { 'message': 'Change password failed.', 'error': error.message },
      _functionName
    )

    return error
  }
}
