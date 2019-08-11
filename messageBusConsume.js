'use strict';

module.exports = function (connection) {
  let default_options = {
    prefetch: 1,

    exchangeName: '',
    routingKey: false,
    assertExchange: true,
    assertExchangeType: 'direct',
    assertExchangeOptions: {},

    assertQueue: true,
    assertQueueOptions: {},

    onConsuming: () => Promise.resolve(true),
    onSentMsg: () => Promise.resolve(true),
  };

  /**
   * Consumes on a queue and binds onto the exchange
   * @param {String} queueName Name of queue to consume
   * @param {String} exchangeName Name of exchange to bind to
   * @param {String} routingKey Routing key to use when binding on exchange. Defaults to queueName
   * @param {Function} onMsg Function to handle consuming messages. First argument is message. Second argument is channel.
   * @param {Object} options Consuming options object.
   */
  return (
    queueName,
    onMsg = () => Promise.resolve(true),
    options = {}
  ) => {
    let channel = null;
    options = { ...default_options, ...options };

    connection
      .then(conn => conn.createChannel())
      .then(chan => {
        channel = chan;
        return chan.prefetch(options.prefetch);
      })
      .then(() =>
        (options.assertExchange === false || options.exchangeName === '') ?
          Promise.resolve(true) :
          channel.assertExchange(
            options.exchangeName,
            options.assertExchangeType,
            options.assertExchangeOptions
          )
      )
      .then(() =>
        (options.assertQueue === false) ?
          Promise.resolve(true) :
          channel.assertQueue(queueName, options.assertQueueOptions)
            .then(() => Promise.resolve(channel))
      )
      .then(() =>
        (options.assertExchange === false || options.exchangeName === '') ?
          Promise.resolve(true) :
          channel.bindQueue(
            queueName,
            options.exchangeName,
            (options.routingKey === false) ? queueName : options.routingKey
          )
      )
      .then(() =>
        channel.consume(queueName, msg => consuming(channel, onMsg, msg, options.onSentMsg))
      )
      .then(() => Promise.resolve(options.onConsuming(channel)));

    return {
      /**
       * Disconnects channel
       */
      disconnect: () => (channel === null) ?
        Promise.reject('Channel closed!') :
        channel.close()
          .then(() => channel = null)
    }
  }
}

/**
 * Consumes on a channel
 * @param {Channel} channel channel object
 * @param {Function} onMsg Consume function. First argument is msg. Second argument is channel.
 * @param {Message} msg AMQP message object.
 * @param {Function} onSentMsg Triggers when message is acked or nacked. First argument is channel.
 */
let consuming = (channel, onMsg, msg, onSentMsg) => onMsg(msg, channel)
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
  })
  .then(() => onSentMsg(channel));