
import Argon2 from 'argon2' 
import _ from 'underscore' 

import Tag from 'tag'



import GstCreate from '../../../Gst/__mutation__/Create'
import AccountUpload from '../Upload'



export default async (__, {
  accountId,
  displayName,
  fullName,
  password,
  website,
  isBlocked,
  phoneNumber,
  accountType,
  thumbnailStoredAt,
  gstDisplayName,
  gstDescription,
  gstState,
  gstCountry,
  email,
  dateOfBirth,
  gender
}, Context) => {
  try {

    if (Context && Context.isContext) {
      const _functionName = 'Routes -> Account -> Setting'

      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': accountId ?? Context.Session.user.id }, 'include': { 'Gst': { 'where': { 'isDeleted': false }, 'select': { 'id': true } } } })

      if (_.isEmpty(_AccountFindUnique) || _AccountFindUnique instanceof Error) {
        await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountFindUnique }, _functionName)

        return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('FAILED_TO_FIND_ACCOUNT')
      }

      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      console.log('RECEIVED ARGS from UI:', { displayName, fullName, email, phoneNumber, dateOfBirth, gender })

      let _dataToUpdate = {}

      if (displayName !== undefined) _dataToUpdate = { ..._dataToUpdate, 'displayName': displayName }
      if (fullName !== undefined) _dataToUpdate = { ..._dataToUpdate, 'fullName': fullName }
      if (website?.href !== undefined) _dataToUpdate = { ..._dataToUpdate, 'website': website?.href }
      if (isBlocked !== undefined) _dataToUpdate = { ..._dataToUpdate, 'isBlocked': isBlocked }
      if (accountType !== undefined) _dataToUpdate = { ..._dataToUpdate, 'accountType': accountType }
      if (phoneNumber !== undefined) _dataToUpdate = { ..._dataToUpdate, 'phoneNumber': phoneNumber }
      if (email !== undefined) _dataToUpdate = { ..._dataToUpdate, 'email': email }
      if (dateOfBirth !== undefined) _dataToUpdate = { ..._dataToUpdate, 'dateOfBirth': dateOfBirth }
      if (gender !== undefined) _dataToUpdate = { ..._dataToUpdate, 'gender': gender }
      if (password !== undefined && password !== '') _dataToUpdate = { ..._dataToUpdate, 'password': await Argon2.hash(password) }

      if (_.isEmpty(_dataToUpdate)) {
        const _error = new Error('NO_DATA_TO_UPDATE')

        await Context.Debug({ 'message': `Failed to update account with id: ${accountId ?? Context.Session.user.id}`, 'error': _error }, _functionName)

        return _error
      }

      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      const _AccountUpdate = await Context.DataBase.account.update({ 'data': _dataToUpdate, 'where': { 'id': accountId ?? Context.Session.user.id } }).catch(e => e)

      if (_AccountUpdate && _AccountUpdate instanceof Error) {
        await Context.Debug({ 'message': `Failed to update account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountUpdate }, _functionName)
        
        if (_AccountUpdate.code === 'P2002') {
          throw new Error('EMAIL_ALREADY_EXISTS')
        }
        throw _AccountUpdate
      }


      if (thumbnailStoredAt && thumbnailStoredAt.then) {
        // Execution mutation for handling image.
        const _AccountUpload = await AccountUpload(__, { 'accountId': _AccountUpdate?.id, thumbnailStoredAt }, Context)

        // Report failure if error is caught.
        if (_AccountUpload instanceof Error) {
          // Report failure.
          return _AccountUpload
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Updated account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Create gst if details are passed in.
      if (!_.isEmpty(_AccountFindUnique.Gst) && !_.isEmpty(gstDisplayName) && !_.isEmpty(gstCountry) && !_.isEmpty(gstState)) {
        // Execute Context.
        const _GstUpdate = await Context.ExecuteGraph(`
          mutation MutationGstUpdate($gstId: ID!, $gstDisplayName: String!, $gstDescription: String!, $gstState: JSON!, $gstCountry: JSON!) {
            GstUpdate(gstId: $gstId, displayName: $gstDisplayName, description: $gstDescription, state: $gstState, country: $gstCountry) {
              id,
              message,
              status
            }
          }
        `, {
          gstDisplayName,
          gstDescription,
          gstState,
          gstCountry,
          'gstId': _AccountFindUnique.Gst?.[0].id
        }, { ...Context, 'noAuth': true })

        // If Checking scope caught exception.
        if (_GstUpdate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update GST for account.`, 'error': _GstUpdate }, _functionName)

          // Report failure.
          return _GstUpdate
        }
        if (0 < _GstUpdate?.errors?.length) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update GST for account.`, 'error': _GstUpdate }, _functionName)

          // Report failure.
          return _GstUpdate?.errors?.[0]
        }
        if (_.isEmpty(_GstUpdate?.data)) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update GST for account.`, 'error': _GstUpdate }, _functionName)

          // Report failure.
          return new Error('EXPECTED_GST_TO_EXIST')
        }
        if (_.isEmpty(_GstUpdate?.data?.GstUpdate)) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update GST for account.`, 'error': _GstUpdate }, _functionName)

          // Report failure.
          return new Error('EXPECTED_GST_TO_EXIST')
        }
      } else if (_.isEmpty(_AccountFindUnique?.Gst) && !_.isEmpty(gstDisplayName) && !_.isEmpty(gstCountry) && !_.isEmpty(gstState)) {
        // Execute Context.
        const _GstCreate = await GstCreate(__, {
          'displayName': gstDisplayName,
          'description': gstDescription,
          'state': gstState,
          'country': gstCountry,
          'accountId': _AccountFindUnique?.id
        }, Context)

        // If Checking scope caught exception.
        if (_GstCreate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _GstCreate }, _functionName)

          // Report failure.
          return _GstCreate
        }
        if (_.isEmpty(_GstCreate)) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to create GST for account.`, 'error': _GstCreate }, _functionName)

          // Report failure.
          return new Error('EXPECTED_GST_TO_EXIST')
        }
      }

      // Return updates.
      const _return = {
        ..._AccountUpdate,
        'message': 'Account updated successfully',
        'status': 'UPDATE_SUCCESSFUL'
      }

      // Publish all updates to pubsub.
      await Context.Pubsub.publish(Tag.Account.Setting(Context.Session.user.id), _return)

      // Return update with status code.
      return _return
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
