const types = [
  {
    contentType: 'application/json',
    pack: JSON.stringify,
    unpack: JSON.parse,
  },
];

const findType = (contentType) => {
  const [type = {
    contentType: 'text/plain',
    pack: (v) => v,
    unpack: (v) => v,
  }] = types.filter((t) => t.contentType === contentType);

  return type;
};

export const unpack = (content, contentType) => findType(contentType).unpack(content);

export const pack = (content, contentType) => findType(contentType).pack(content);
