
import _ from 'underscore'
import Tag from 'tag'


export default async (__, { accountId, address }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = 'Routes -> Account -> UpdateAddress'

      if (_.isEmpty(address)) {
        return new Error('ADDRESS_IS_REQUIRED')
      }

      // Check if account exists
      const targetAccountId = accountId ?? Context.Session.user.id
      const _AccountFindUnique = await Context.DataBase.account.findUnique({
        where: { id: targetAccountId }
      })

      if (_.isEmpty(_AccountFindUnique) || _AccountFindUnique instanceof Error) {
        await Context.Debug({ message: `Failed to find account with id: ${targetAccountId}`, error: _AccountFindUnique }, _functionName)
        return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('FAILED_TO_FIND_ACCOUNT')
      }

      await Context.Debug({ message: `Updating address for account with id: ${targetAccountId}` }, _functionName)

      const _AccountUpdate = await Context.DataBase.account.update({
        data: { address },
        where: { id: targetAccountId }
      })

      if (_AccountUpdate && _AccountUpdate instanceof Error) {
        await Context.Debug({ message: `Failed to update address for account with id: ${targetAccountId}`, error: _AccountUpdate }, _functionName)
        return _AccountUpdate
      }

      // Prepare response
      const _return = {
        ..._AccountUpdate,
        message: 'Address updated successfully',
        status: 'UPDATE_SUCCESSFUL'
      }

      // Publish update to pubsub
      await Context.Pubsub.publish(Tag.Account.Setting(Context.Session.user.id), _return)

      return _return
    }

    return new Error('MISSING__CONTEXT')
  } catch (error) {
    return error
  }
}
