
import _ from 'underscore' 



export default async (__, { search, searches, take = 10, skip = 0 }, Context) => {
  try {

    if (Context && Context.isContext) {
      const _functionName = 'Routes -> Account -> Search'

      let _AccountFindMany

      if (_.isEmpty(search) && _.isEmpty(searches)) {
        return new Error('SEARCH_NOT_FOUND')
      }

      await Context.Debug({ 'message': `Searching account with search: ${search}` }, _functionName)

      _AccountFindMany = await Context.DataBase.account.findMany({
        'where': {
          'isDeleted': false,
          'accountType': {
            'not': 'ADMIN'
          },
          'OR': _.compact(_.flatten([
            {
              'fullName': {
                'startsWith': search,
                'mode': 'insensitive'
              },
              'displayName': {
                'startsWith': search,
                'mode': 'insensitive'
              }
            },
            ...(searches?.map(r => ({
              'email': {
                'startsWith': r,
                'mode': 'insensitive'
              }
            })) || []),
            ...(searches?.map(r => ({
              'displayName': {
                'startsWith': r,
                'mode': 'insensitive'
              }
            })) || [])
          ]))
        },
        take,
        skip
      })


      if (_AccountFindMany instanceof Error) {
        await Context.Debug({ 'message': `Failed to search account with search: ${search}`, 'error': _AccountFindMany }, _functionName)
        return _AccountFindMany
      }

      await Context.Debug({ 'message': _.isEmpty(_AccountFindMany) ? 'Search successful found empty seems that there is no entry in database.' : `Successfully searched account with search: ${search}` }, _functionName)

      !_.isEmpty(_AccountFindMany) && _AccountFindMany.map(v => Object.assign(v, { 'status': 'READ_SUCCESSFUL', 'message': 'Successfully fetched accounts matching to given search ' }))
      _.isEmpty(_AccountFindMany) && (_AccountFindMany = [{ 'status': 'NO_MATCH_FOUND', 'message': 'it seems that no account matches to given search.' }])

      await Context.Debug({ 'message': `Returning search result for search: ${search}` }, _functionName)

      return _AccountFindMany
    }

    return new Error('MISSING__CONTEXT')
  } catch (error) {
    return error
  }
}
