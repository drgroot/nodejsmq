export type EncodingTypeName = string;

interface EncodeFunction {
  (input: any): any
}

interface DecodeFunction {
  (input: any): any
}

interface Encoding {
  name: EncodingTypeName,
  encode: EncodeFunction,
  decode: DecodeFunction,
}

const encodings: [Encoding] = [
  {
    name: 'base64',
    decode: (v) => v.toString(),
    encode: (v) => Buffer.from(v),
  },
];

const findType = (name: EncodingTypeName): Encoding => {
  const type = encodings.find((t) => t.name === name) || {
    name: 'identity',
    decode: (v: any) => v,
    encode: (v: any) => v,
  };

  return type;
};

export const decode = (content: any, encoding: EncodingTypeName): any => findType(encoding)
  .decode(content);

export const encode = (content: any, encoding: EncodingTypeName): any => findType(encoding)
  .encode(content);
