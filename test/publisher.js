'use strict';
const chai = require('chai');
let url = (process.env['MESSAGEBUS_URL']) ?
  process.env['MESSAGEBUS_URL'] :
  'amqp://127.0.0.1';

describe('Publisher', function () {
  let rabbitMQ = null;
  let consumer = null;

  before(() => rabbitMQ = require('../')(url));

  it('Should send a response without accepting reply', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue', msg => {
          let value = JSON.parse(msg.content.toString());
          chai.assert.strictEqual(value, 'my messag');
          return Promise.resolve(true);
        },
        {
          onConsuming: () => rabbitMQ.publishNoResponse('my messag', 'rpc-queue'),
          onSentMsg: () => resolve()
        }
      )
    )
      .then(() => consumer.disconnect())
  );

  it('Should send a response', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue', msg => {
          let value = JSON.parse(msg.content.toString());
          chai.assert.strictEqual(value, 'hi');
          return Promise.resolve('Response');
        },
        {
          onConsuming: () =>
            rabbitMQ.publishGetResponse('hi', 'rpc-queue')
              .then(response => {
                response = JSON.parse(response.toString());
                chai.assert.isTrue(response.is_success);
                chai.assert.isNull(response.error);
                chai.assert.strictEqual(response.results[0], 'Response');
                resolve();
              }),
          onSentMsg: () => resolve()
        }
      )
    )
      .then(() => consumer.disconnect())
  )

  after(() => rabbitMQ.disconnect());
});