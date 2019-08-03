'use strict';
const chai = require('chai');
const messageBus = require('../');

describe('Consumer', function () {

  it('Should stop consuming gracefully', () => {
    let consumer = null;
    return new Promise(resolve =>
      consumer = messageBus.consume(
        'rpc-queue',
        'my-exhange',
        '#',
        () => { },
        () => consumer.disconnect()
          .then(() => resolve())
      )
    )
  });

  it('Should ack knowledge message using promise', () =>
    new Promise(resolve => {
      let consumer = messageBus.consume(
        'rpc-queue',
        'my-exhange',
        '*queue',
        (channel, msg) => {
          chai.assert.strictEqual(JSON.parse(msg.content.toString()), 'hi');
          return Promise.resolve('bye');
        }, () =>
          messageBus.publish_getResponse('hi', 'my-exhange', 'lolmy-queue')
            .then(newMessage => {
              newMessage = JSON.parse(newMessage.toString());
              chai.assert.strictEqual(newMessage.results[0], 'bye');
              chai.assert.isNull(newMessage.error);
              chai.assert.isTrue(newMessage.is_success);

              consumer.disconnect()
                .then(() => resolve())
            })
      )
    })
  );

  it('Should reject message on reject response', () =>
    new Promise(resolve => {
      let consumer = messageBus.consume(
        'rpc-queue',
        'my-exhange',
        '#',
        (channel, msg) => Promise.reject('I reject'),
        () => messageBus.publish_getResponse('hi', 'my-exhange', 'rpc_queue')
          .then(newMessage => {
            newMessage = JSON.parse(newMessage.toString());
            chai.assert.strictEqual(newMessage.error, 'I reject');
            chai.assert.lengthOf(newMessage.results, 0);
            chai.assert.isFalse(newMessage.is_success);

            consumer.disconnect()
              .then(() => resolve())
          })
      )
    })
  );
});