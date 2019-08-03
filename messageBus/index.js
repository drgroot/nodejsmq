'use strict';
const connection = require('./messageBusConnection.js');

module.exports = {
  consume: () => { },

  publish_noResponse: () => { },
  publish_getResponse: () => { },

  getQueueStats: () => { },

  connection: connection.conn,
  disconnect: connection.disconnect,
}