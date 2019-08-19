'use strict'

/**
 * Respond to a message with response. Converts response to Binary
 * @param {Message} msg AMQP message object
 * @param {Channel} channel channel object
 * @param {Any} response response to send over
 */
module.exports = (msg, channel, response) => {
  if (msg.properties.replyTo !== null && typeof msg.properties.replyTo !== 'undefined') {
    channel.publish(
      '',
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(response)),
      {
        correlationId: msg.properties.correlationId
      }
    );
  }
  channel.ack(msg);
  return Promise.resolve(true);
}