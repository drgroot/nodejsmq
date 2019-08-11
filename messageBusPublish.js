'use strict';
const uuid = require('uuid/v1');

module.exports = function (connection) {
  return {

    /**
    * Publishes a message without resolving a response
    * @param {Any} message Message to send
    * @param {String} routingKey Routing key to match to.
    * @param {String} exchangeName Name of exchange to publish on. Default ''
    */
    noResponse: (
      message,
      routingKey,
      exchangeName = '',
    ) => connection
      .then(conn => conn.createChannel())
      .then(channel => {
        channel.publish(
          exchangeName,
          routingKey,
          Buffer.from(JSON.stringify(message))
        );
        return channel.close();
      }),

    /**
    * Publishes a message and resolves the response
    * @param {Any} message Message to send
    * @param {String} routingKey Routing key to match to.
    * @param {String} exchangeName Name of exchange to publish on. Default ''
    */
    getResponse: (
      message,
      routingKey,
      exchangeName = '',
    ) => connection
      .then(conn => conn.createChannel())
      .then(channel =>
        channel.assertQueue('', { durable: false })
          .then(queue =>
            getResponse(
              channel,
              queue.queue,
              exchangeName,
              routingKey,
              message
            )
          )
      )
  }
}

/**
 * Publishes a message and resolves the response
 * @param {Channel} channel Channel object
 * @param {String} replyTo Name of queue to listen for response
 * @param {String} exchangeName Name of exchange to publish on. Default ''
 * @param {String} routingKey Routing key to send to
 * @param {Any} message Message to send
 */
let getResponse = (channel, replyTo, exchangeName, routingKey, message) =>
  new Promise(resolve => {
    let correlationId = uuid();

    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)), {
      correlationId: correlationId,
      replyTo: replyTo
    });

    channel.consume(replyTo, msg => {
      if (msg.properties.correlationId !== correlationId) {
        return channel.nack(msg, false, true);
      }

      channel.ack(msg);
      channel.close()
        .then(() => resolve(msg.content));
    });
  })

