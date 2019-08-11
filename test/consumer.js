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
      consumer = rabbitMQ.consume('rpc-queue', () => Promise.resolve('l'), {
        exchangeName: 'myExchange',
        routingKey: '*.log',
        assertExchangeType: 'topic',
        onConsuming: () =>
          rabbitMQ.publishGetResponse('my message', 'random.log', 'myExchange')
            .then(response => {
              response = JSON.parse(response.toString());
              chai.assert.strictEqual(response.results[0], 'l');
              chai.assert.isNull(response.error);
              chai.assert.isTrue(response.is_success);
              resolve();
            })
      })
    )
  )

  it('Should nack the message on null response', () =>
    new Promise((resolve, reject) =>
      consumer = rabbitMQ.consume('rpc-queue', () => Promise.resolve(null), {
        onConsuming: () =>
          rabbitMQ.publishGetResponse('asdad', 'rpc-queue')
            .then(() => reject('Should not get resolve')),
        onSentMsg: () => resolve()
      })
    )
  )

  it('Should ack knowledge message using promise', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue', () => Promise.resolve('Response'),
        {
          onConsuming: () =>
            rabbitMQ.publishGetResponse('hi', 'rpc-queue')
              .then(response => {
                response = JSON.parse(response.toString());
                chai.assert.isTrue(response.is_success);
                chai.assert.isNull(response.error);
                chai.assert.strictEqual(response.results[0], 'Response');
                resolve();
              })
        }
      )
    )
  );

  it('Should return error message if onMsg resolves error', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume('rpc-queue', () => Promise.reject('asdsd'), {
        onConsuming: () =>
          rabbitMQ.publishGetResponse('wasup', 'rpc-queue')
            .then(response => {
              response = JSON.parse(response.toString());
              chai.assert.isFalse(response.is_success);
              chai.assert.lengthOf(response.results, 0);
              chai.assert.strictEqual(response.error, 'asdsd');
              resolve();
            })
      })
    )
  )

  after(() => rabbitMQ.disconnect());
});