// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from 'chai';
import nodeMQ from './app';

describe('publisher', () => {
  const response = { b: 1 };
  let consumer;
  before(() => new Promise((resolve) => {
    consumer = nodeMQ.consume({
      queueName: 'myqueue123',
      onMessage: (msg, channel) => nodeMQ.reply(msg, channel, response),
      onConsuming: () => resolve(),
    });
  }));


  it('should resolve the response', () => nodeMQ.publishMessage('myqueue123', 'hi')
    .then((body) => {
      assert.deepStrictEqual(body, response);
    }));

  after(() => consumer.disconnect());
});
