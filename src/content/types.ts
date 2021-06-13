export type ContentTypeName = string;

interface PackFunction {
  (input: any): string
}

interface UnPackFunction {
  (input: any): any
}

interface ContentType {
  contentType: ContentTypeName;
  pack: PackFunction;
  unpack: UnPackFunction;
}

const types: [ContentType] = [
  {
    contentType: 'application/json',
    pack: JSON.stringify,
    unpack: JSON.parse,
  },
];

const findType = (name: ContentTypeName): ContentType => {
  const [
    type = {
      contentType: 'text/plain',
      pack: (v: string): string => v,
      unpack: (v: string): string => v,
    }
  ] = types.filter((t) => t.contentType === name);

  return type;
}

export const unpack = (content: any, contentType: ContentTypeName): any => findType(contentType).unpack(content);

export const pack = (content: any, contentType: ContentTypeName): any => findType(contentType).pack(content);
