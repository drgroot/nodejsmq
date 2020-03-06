// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from 'chai';
import nodeMQ from './app';

describe('Consumer', () => {
  let consumer;

  it('Should consume onto a named queue', () => new Promise((resolve) => {
    consumer = nodeMQ.consume({
      queueName: 'myqueue',
      onConsuming: (queue) => {
        consumer.disconnect();
        assert.strictEqual(queue, 'myqueue');
        resolve();
      },
    });
  }));

  it('should consume onto an unamed queue', () => new Promise((resolve) => {
    consumer = nodeMQ.consume({
      onConsuming: (queue) => {
        consumer.disconnect();
        assert.isString(queue);
        resolve();
      },
    });
  }));

  describe('direct exchange', () => {
    const name = 'myqueue';

    it('should consume onto direct exchange without issue', () => new Promise((resolve) => {
      consumer = nodeMQ.consume({
        queueName: name,
        onConsuming: (queue) => {
          consumer.disconnect();
          assert.strictEqual(queue, name);
          resolve();
        },
      });
    }));

    it('should recieve messages and encode/decode message', () => new Promise((resolve) => {
      const message = [1, 2, 3];
      consumer = nodeMQ.consume({
        queueName: name,
        onConsuming: () => nodeMQ.publish(name, message),
        onMessage: (msg, channel, body) => {
          nodeMQ.reply(msg, channel);
          consumer.disconnect();
          assert.deepStrictEqual(body, message);
          resolve();
        },
      });
    }));
  });

  describe('exchange', () => {
    const queueName = 'exchangeQ';
    const message = { a: 1 };
    const sendMessage = (exchange, route) => nodeMQ
      .publish(route, message, { exchangeName: exchange });

    it('should bind using queueName if no routing key given', () => new Promise((resolve) => {
      consumer = nodeMQ.consume({
        queueName,
        onConsuming: () => sendMessage('exchange', queueName),
        onMessage: (msg, channel, body) => {
          nodeMQ.reply(msg, channel);
          consumer.disconnect();
          assert.deepStrictEqual(body, message);
          resolve();
        },
        assertExchange: true,
        exchangeName: 'exchange',
      });
    }));

    it('should adhere to routing key if given', () => new Promise((resolve) => {
      consumer = nodeMQ.consume({
        queueName: 'logHandler',
        onConsuming: () => sendMessage('exchangeTopic', 'log.error'),
        onMessage: (msg, channel, body) => {
          nodeMQ.reply(msg, channel);
          consumer.disconnect();
          assert.deepStrictEqual(body, message);
          assert.strictEqual(msg.fields.routingKey, 'log.error');
          resolve();
        },
        routingKey: 'log.*',
        assertExchange: true,
        assertExchangeType: 'topic',
        exchangeName: 'exchangeTopic',
      });
    }));
  });
});
