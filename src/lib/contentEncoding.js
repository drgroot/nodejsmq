/**
 * encodings to support:
 *  - gzip
 *  - identity (nothing)
 *  - base64 (output from Buffer.from)
 *  - deflate (zlib)
 *  - br (brotli)
 */

const types = [
  {
    encoding: 'base64',
    decode: (v) => v.toString(),
    encode: (v) => Buffer.from(v),
  },
];

const findType = (encoding) => {
  const [type = {
    encoding: 'identity',
    decode: (v) => v,
    encode: (v) => v,
  }] = types.filter((t) => t.encoding === encoding);

  return type;
};

export const decode = (content, encoding) => findType(encoding).decode(content);

export const encode = (content, encoding) => findType(encoding).encode(content);
