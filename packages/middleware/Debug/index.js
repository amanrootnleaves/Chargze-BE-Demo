
export default async (resolve, root, args, context, info) => {
  try {

    if (context && context.isContext && !(context instanceof Error)) {
      const _resolve = await resolve(root, args, context, info)

   
      if (_resolve && !(_resolve instanceof Error)) return _resolve

      
      return _resolve instanceof Error ? context.Debug({ 'error': _resolve, root, args, context, info }) : _resolve
    }

    return context?.Debug?.({
      'error': context instanceof Error ? context : new Error('MISSING__CONTEXT'),
      root,
      args,
      context,
      info
    })
  } catch (error) {
    return error
  }
}
