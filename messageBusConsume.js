'use strict';
const connection = require('./messageBusConnection.js');

/**
 * Consumes onto a queue and an exchange with a given routing key
 * @param {String} queue_name Name of queue to subscribe to
 * @param {String} exchange_name Name of exchange to assert on
 * @param {Patter} routing_key Routing key pattern
 * @param {Function} onMsg Method called when receiving a message. First argument is Channel. Second argument is the message
 * @param {Function} connected Callback to execute when connected on queue. Return as promise. First argument is channel
 * @param {String} exchange_type Exchange type. Default topic
 */
module.exports = (
  queue_name,
  exchange_name,
  routing_key,
  onMsg,
  connected = () => true,
  exchange_type = 'topic'
) => {
  let channel = null;

  connection
    .then(conn => conn.createChannel())
    .then(chann => {
      channel = chann;

      return channel.prefetch(1)
        .then(() => channel.assertExchange(exchange_name, exchange_type))
        .then(() => channel.assertQueue(queue_name))
        .then(queue =>
          channel.bindQueue(queue.queue, exchange_name, routing_key)
            .then(
              () => channel.consume(queue.queue, msg => consume(channel, onMsg, msg))
            )
            .then(() => console.log(`Consuming on ${queue.queue}`))
            .then(() => Promise.resolve(connected(channel)))
        )
    })
    .catch(e => console.error(`Error consuming on ${queue_name}`, e));

  return {
    disconnect: () => {
      if (!channel) return Promise.reject('Channel closed!');
      return channel.close();
    }
  }
}

let consume = (channel, onMsg, msg) => onMsg(channel, msg)
  .then(results => {
    if (results === null) {
      channel.nack(msg, false, false);
      return false;
    }
    return {
      is_success: true,
      results: (results.constructor === Array) ? results : [results],
      error: null
    }
  })
  .catch(e => {
    return {
      is_success: false,
      results: [],
      error: e
    }
  })
  .then(content => {
    if (!content) return Promise.resolve();
    if (msg.properties.replyTo !== null && typeof msg.properties.replyTo != 'undefined') {
      channel.publish(
        '',
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(content)),
        { correlationId: msg.properties.correlationId }
      );
    }
    return Promise.resolve(channel.ack(msg));
  });