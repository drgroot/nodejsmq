'use strict';
const connection = require('./messageBusConnection.js');
const publish = require('./messageBusPublish.js');

module.exports = {
  consume: require('./messageBusConsume.js'),
  log: require('./messageBusLogger.js'),

  publish_noResponse: publish.noResponse,
  publish_getResponse: publish.getResponse,

  connection: connection,

  /**
  * Disconnects from messaging bus. Returns a promise upon closure.
  */
  disconnect: () => connection.then(conn => conn.close()),
}