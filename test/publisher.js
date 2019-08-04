'use strict';
const chai = require('chai');
const messageBus = require('../');

describe('Publisher', function () {

  it('Should send response without getting message', () =>
    new Promise(resolve => {
      let consumer = messageBus.consume(
        'rpc-queue',
        'my-exhange',
        '#',
        (channel, msg) => {
          chai.assert.strictEqual(JSON.parse(msg.content.toString()), 'hi');
          resolve();
          return Promise.resolve('hi');
        },
        () => messageBus.publish_noResponse('hi', 'my-exhange', 'rpc_queue')
      )
    })
  )

});