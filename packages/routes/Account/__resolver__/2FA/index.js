export default async (__, args, Context) => {
  const _functionName = 'Routes -> Account -> Query -> GetTwoFactorStatus'

  try {
    if (!Context?.isContext) {
      return new Error('MISSING__CONTEXT')
    }

    const userId = Context.Session?.user?.id
    if (!Context.Session?.isLoggedIn || !userId) {
      return new Error('REQUIRE_AUTHENTICATION')
    }

    await Context.Debug(
      { 'message': 'Fetching 2FA status started.' },
      _functionName
    )

    const account = await Context.DataBase.account.findUnique({
      'where': { 'id': userId },
      'select': { 'is2FAEnabled': true }
    })

    if (!account) {
      return new Error('ACCOUNT_WITH_ID_NOT_FOUND')
    }

    const isEnabled = account.is2FAEnabled ?? false

    await Context.Debug(
      { 'message': '2FA status fetched successfully.', isEnabled },
      _functionName
    )

    return { isEnabled }
  } catch (error) {
    if (Context?.isContext) {
      await Context.Debug(
        { 'message': 'Fetch 2FA status failed.', 'error': error.message },
        _functionName
      )
    }

    return error
  }
}
