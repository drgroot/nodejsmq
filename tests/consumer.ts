import { assert } from 'chai';
import nodeMQ from './app';

describe('Consumer', () => {
  let consumer: any;

  it('Should consume onto a named queue', () => new Promise((resolve) => {
    consumer = nodeMQ.consume({
      queueName: 'myqueue',
      consumeCallback: (queue) => {
        consumer.disconnect();
        assert.strictEqual(queue, 'myqueue');
        resolve(3);
      },
    });
  }));

  describe('direct exchange', () => {
    const name = 'myqueue';

    it('should consume onto direct exchange without issue', () => new Promise((resolve) => {
      consumer = nodeMQ.consume({
        queueName: name,
        consumeCallback: (queue) => {
          consumer.disconnect();
          assert.strictEqual(queue, name);
          resolve(3);
        },
      });
    }));

    it('should recieve messages and encode/decode message', () => new Promise((resolve, reject) => {
      const message = [1, 2, 3];
      consumer = nodeMQ.consume({
        queueName: name,
        consumeCallback: () => nodeMQ.publish(name, message),
        onMessage: (msg, channel, body) => {
          if (msg) {
            channel.ack(msg);
            consumer.disconnect();
            assert.deepStrictEqual(body, message);
            resolve(3);
          } else {
            reject(3);
          }
        },
      });
    }));
  });

  describe('exchange', () => {
    const message = { a: 1 };
    const sendMessage = (exchange: string, route: string) => nodeMQ
      .publish(route, message, { exchangeName: exchange });

    it('should adhere to routing key if given', () => new Promise((resolve, reject) => {
      consumer = nodeMQ.consume({
        queueName: 'logHandler',
        consumeCallback: () => sendMessage('amq.topic', 'log.error'),
        onMessage: (msg, channel, body) => {
          if (msg) {
            channel.ack(msg);
            consumer.disconnect();
            assert.deepStrictEqual(body, message);
            assert.strictEqual(msg.fields.routingKey, 'log.error');
            resolve(2);
          } else {
            reject(null);
          }
        },
        routingKey: 'log.*',
        exchangeName: 'amq.topic',
      });
    }));
  });
});
