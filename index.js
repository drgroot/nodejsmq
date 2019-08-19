'use strict';
const amqplib = require('amqplib');

module.exports = function (connection_url) {
  let connection = null;
  let connect = () => (connection !== null) ?
    Promise.resolve(connection) :
    amqplib.connect(connection_url)
      .then(conn => connection = conn);
  let publish = require('./messageBusPublish.js')(connect());

  return {
    /**
     * Returns promise resolving connection
     */
    connection: connect(),

    /**
     * Closes connection
     */
    disconnect: () => connection.close(),

    consume: require('./messageBusConsume.js')(connect()),
    reply: require('./messageBusReply.js'),

    publishNoResponse: publish.noResponse,
    publishGetResponse: publish.getResponse,
  }
}