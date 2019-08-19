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
        'rpc-queue2', (msg, channel) => {
          let value = JSON.parse(msg.content.toString());
          chai.assert.strictEqual(value, 'my messag');
          rabbitMQ.reply(msg, channel, true)
            .then(() => resolve())
        },
        {
          onConsuming: () => rabbitMQ.publishNoResponse('my messag', 'rpc-queue2'),
        }
      )
    )
      .then(() => consumer.disconnect())
  );

  it('Should send a response', () =>
    new Promise(resolve =>
      consumer = rabbitMQ.consume(
        'rpc-queue', (msg, channel) => {
          let value = JSON.parse(msg.content.toString());
          chai.assert.strictEqual(value, 'hi');
          rabbitMQ.reply(msg, channel, 'Response');
        },
        {
          onConsuming: () =>
            rabbitMQ.publishGetResponse('hi', 'rpc-queue')
              .then(response => {
                response = JSON.parse(response.toString());
                chai.assert.strictEqual(response, 'Response');
                resolve();
              }),
        }
      )
    )
      .then(() => consumer.disconnect())
  )

  after(() => rabbitMQ.disconnect());
});