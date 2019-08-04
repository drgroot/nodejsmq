'use strict';
const chai = require('chai');
const messageBus = require('../');

describe('Logger', function () {

  it('Should log and filter by level', () => {
    let consumer1 = null;
    let consumer2 = null;
    return new Promise(resolve => {
      consumer1 = messageBus.consume(
        'logger1', 'logs-exchange', 'debug.log',
        (channel, msg) => {
          let message = JSON.parse(msg.content.toString());
          chai.assert.isNull(message);
        }
      );
      consumer2 = messageBus.consume(
        'logger', 'logs-exchange', 'error.log',
        (channel, msg) => {
          let message = JSON.parse(msg.content.toString());
          chai.assert.isNotNull(message);
          chai.assert.strictEqual(message.level, 'error');
          chai.assert.strictEqual(message.message[0], 'I got an error');

          return Promise.resolve('bye');
        },
        () => messageBus.log('error', 'I got an error'), 'topic',
        () => resolve()
      )
    })
      .then(() => consumer1.disconnect())
      .then(() => consumer2.disconnect());
  })

});