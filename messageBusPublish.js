'use strict';
const uuid = require('uuid/v1');
const connection = require('./messageBusConnection.js');

module.exports = {
  noResponse: (
    message, exchange_name, routing_key, exchange_type = 'topic'
  ) => connection
    .then(conn => conn.createChannel())
    .then(channel =>
      channel.assertExchange(exchange_name, exchange_type)
        .then(
          channel.publish(exchange_name, routing_key, Buffer.from(JSON.stringify(message)))
        )
        .then(() => channel.close())
    ),

  getResponse: (
    message, exchange_name, routing_key, exchange_type = 'topic'
  ) => connection
    .then(conn => conn.createChannel())
    .then(channel =>
      channel.assertExchange(exchange_name, exchange_type)
        .then(() =>
          channel.assertQueue('', { durable: false })
            .then(queue =>
              sendMessageResponse(channel, queue.queue, exchange_name, routing_key, message)
            )
        )
    ),
}

let sendMessageResponse = (channel, replyTo, exchange_name, routing_key, message) =>
  new Promise(resolve => {
    let correlationId = uuid();

    channel.publish(exchange_name, routing_key, Buffer.from(JSON.stringify(message)), {
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

