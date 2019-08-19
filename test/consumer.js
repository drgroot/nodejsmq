'use strict';
const chai = require('chai');
let url = (process.env['MESSAGEBUS_URL']) ?
  process.env['MESSAGEBUS_URL'] :
  'amqp://127.0.0.1';

describe('Consumer', function () {
  let rabbitMQ = null;
  let consumer = null;

  before(() => rabbitMQ = require('../')(url));
  afterEach(() => consumer.disconnect());

  it('Should stop consuming gracefully', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue', () => Promise.resolve(true), {
          onConsuming: () => resolve()
        }
      )
    )
  );

  it('Should follow routing rules', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue',
        (msg, channel) => rabbitMQ.reply(msg, channel, 'l'),
        {
          exchangeName: 'myExchange',
          routingKey: '*.log',
          assertExchangeType: 'topic',
          onConsuming: () =>
            rabbitMQ.publishGetResponse('my message', 'random.log', 'myExchange')
              .then(response => {
                response = JSON.parse(response.toString());
                chai.assert.strictEqual(response, 'l');
                resolve();
              })
        }
      )
    )
  )

  it('Should nack the message on null response', () =>
    new Promise((resolve, reject) =>
      consumer = rabbitMQ.consume(
        'rpc-queue',
        (msg, channel) => {
          channel.nack(msg);
          setTimeout(() => resolve(), 1500);
        },
        {
          onConsuming: () =>
            rabbitMQ.publishGetResponse('asdad', 'rpc-queue')
              .then(() => reject('Should not get resolve')),
        }
      )
    )
  )

  it('Should ack knowledge message using promise', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue',
        (msg, channel) => rabbitMQ.reply(msg, channel, 'Response'),
        {
          onConsuming: () =>
            rabbitMQ.publishGetResponse('hi', 'rpc-queue')
              .then(response => {
                response = JSON.parse(response.toString());
                chai.assert.strictEqual(response, 'Response');
                resolve();
              })
        }
      )
    )
  );

  it('Should return promise on message without replyTo', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue',
        (msg, channel) => rabbitMQ.reply(msg, channel, 'Response')
          .then(() => resolve()),
        {
          onConsuming: () => rabbitMQ.publishNoResponse('hi', 'rpc-queue')

        }
      )
    )
  )

  after(() => rabbitMQ.disconnect());
});