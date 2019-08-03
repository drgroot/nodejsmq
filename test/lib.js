// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from 'chai';
import { encode, decode } from '../src/lib/contentEncoding';
import { unpack, pack } from '../src/lib/contentType';

describe('library files', () => {
  describe('content encoding', () => {
    describe('identity fallback', () => {
      it('should decode identity', () => {
        const val = decode(2134, 'asdad');
        assert.strictEqual(val, 2134);
      });

      it('should encode identity', () => {
        const val = encode(1234, 'asddas');
        assert.strictEqual(val, 1234);
      });
    });

    const string = 'my test string';
    const tests = ['base64'];
    tests.forEach((test) => {
      let encoded = '';
      it(`${test}: encoding`, () => {
        encoded = encode(string, test);
      });

      it(`${test}: decoding`, () => {
        const decoded = decode(encoded, test);
        assert.strictEqual(decoded, string);
      });
    });
  });

  describe('content types', () => {
    describe('text/plain fallback', () => {
      it('should pack to identity', () => {
        const val = pack(1234, 'sdadasd');
        assert.strictEqual(val, 1234);
      });

      it('should unpack to identity', () => {
        const val = unpack(1234, 'asdad');
        assert.strictEqual(val, 1234);
      });
    });

    const input = ['1', 2, { a: 1 }];
    const tests = [
      {
        type: 'application/json',
        packed: '["1",2,{"a":1}]',
      },
    ];

    tests.forEach((test) => {
      let packed;
      it(`${test.type}: packing`, () => {
        packed = pack(input, test.type);
        assert.strictEqual(packed, test.packed);
      });

      it(`${test.type}: unpacked`, () => {
        const unpacked = unpack(packed, test.type);
        assert.deepStrictEqual(unpacked, input);
      });
    });
  });
});
