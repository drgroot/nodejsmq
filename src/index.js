import amqplib from 'amqplib';
import consumer from './consume';
import Publisher from './publish';
import { encode } from './lib/contentEncoding';
import { pack } from './lib/contentType';
import './types/amqp';

/**
 * @description Replies to a message with a response. If message is not meant to be responded to,
 *  it will simply ack the message.
 * @param {Message} message
 * @param {channel} channel
 * @param {Any} response
 * @param {MessageProperties} [options] Defaults content type to 'application/json' and
 *  contentEncoding to 'base64'.
 */
export const reply = (
  message,
  channel,
  response,
  {
    contentType = 'application/json',
    contentEncoding = 'base64',
    ...options
  } = {},
) => {
  if (
    message.properties.replyTo !== null
    && typeof message.properties.replyTo !== 'undefined'
  ) {
    const packedMessage = pack(response, contentType);
    channel.publish(
      '',
      message.properties.replyTo,
      encode(packedMessage, contentEncoding),
      {
        ...options,
        contentType,
        contentEncoding,
        correlationId: message.properties.correlationId,
      },
    );
  }

  channel.ack(message);
  return Promise.resolve(true);
};

/**
 * nodeMQ object
 * @typedef {Object} nodeMQ
 * @property {Function} connection Returns a promise resolving the connection
 * @property {Function} disconnect Disconnects from the server and closes the connection
 * @property {Consumer} consume
 * @property {Function} reply
 */

/**
 * @description Creates a nodeMQ connection object to rabbitmq
 * @param {string} connectionURL rabbitmq connection url
 * @return {nodeMQ} nodeMQ
 * @example
 *   import nodejsmq from 'nodejsmq';
 *
 *   const nodeMQ = nodejsmq('amqp://localhost/');
 *   nodeMQ.publishMessage('myqueue','Hello World')
 *   .then((response)=> {
 *     console.log(response);
 *     nodeMQ.disconnect();
 *   });
 */
const nodeMQ = (connectionURL) => {
  let connection = null;

  const connect = () => {
    if (connection) {
      return Promise.resolve(connection);
    }

    return amqplib.connect(connectionURL)
      .then((conn) => { connection = conn; })
      .then(() => connection);
  };

  const publisher = Publisher(connect());

  return {
    /**
     * @description returns promise resolving connection
     */
    connection: connect(),

    /**
     * @description closes the connection
     */
    disconnect: () => connection.close,

    consume: consumer(connect()),
    publish: publisher.publish,
    publishMessage: publisher.publishMessage,
    reply,
  };
};

export default nodeMQ;
