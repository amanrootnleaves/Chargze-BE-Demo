/*
 * IMPORTS
 */
import _ from 'underscore'
import { Readable } from 'stream'
import { Buffer } from 'buffer'
import { GraphQLError, GraphQLScalarType } from 'graphql'


/*
 * CONSTANTS
 */
const _AllowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png'
]


/*
 * EXPORTS
 */
export default new GraphQLScalarType({
  'name': 'Document',
  'description': 'Allows PDF, JPG, JPEG and PNG document uploads.',

  async parseValue(value) {
    const _value = await value.promise ?? await value

    if (!_value) throw new GraphQLError('Document file is required')

    const _fileName = _value.name ?? _value.fileName ?? _value.filename
    const _mimeType = _value.type ?? _value.mimetype

    if (!_fileName || !_AllowedMimeTypes.includes(_mimeType)) {
      throw new GraphQLError('Only PDF, JPG, JPEG and PNG documents are allowed')
    }

    if (_value.createReadStream && _.isEmpty(_value.file)) {
      _value.file = {
        'mimetype': _mimeType,
        'fileName': _fileName,
        'createReadStream': _value.createReadStream,
        'isDocument': true
      }

      delete _value.createReadStream
    } else if (!_.isEmpty(_value.blobParts)) {
      const _Stream = new Readable()

      _Stream.push(Buffer.concat(_value.blobParts.map(k => Buffer.from(k))))
      _Stream.push(null)

      _value.file = {
        'mimetype': _mimeType,
        'fileName': _fileName,
        'createReadStream': () => _Stream,
        'isDocument': true
      }
    }

    return _value
  }
})