import { decode } from './lib/contentEncoding';
import { unpack } from './lib/contentType';
import './types/amqp';

/**
 * Consumer
 * @typedef {Object} Consumer
 * @property {Function} disconnect stops the consumer and closes the channel
 */

/**
 * Options used when asserting an exchange into existence.
 * @typedef {Object} ExchangeOptions
 * @property {boolean} [durable=true]
 * @property {boolean} [internal=false]
 * @property {boolean} [autoDelete=false]
 * @property {string} alternateExchange
 */

/**
 * Options used when asserting a queue into existence
 * @typedef {Object} QueueOptions
 * @property {boolean} [exclusive=false]
 * @property {boolean} [durable=true]
 * @property {boolean} [autoDelete=false]
 */

/**
 * Options used when consuming
 * @typedef {Object} ConsumeOptions
 * @property {string} [consumerTag]
 * @property {boolean} [noLocal=false]
 * @property {boolean} [noAck=false]
 * @property {boolean} [exclusive=True]
 * @property {integer} [priority]
 */

/**
 * Function to handle processing the message when a message has arrived.
 * @typedef MessageHandler
 * @param {Message} message
 * @param {channel} channel
 * @param {any} body message body
 * @function
 */

/**
 * Function triggered when the consumer is consuming.
 * @typedef ConsumingCallback
 * @param {string} queue The name of the queue
 * @param {channel} channel
 * @function
 */

/**
 * @description Creates a consumer on a rabbitmq channel. Spawns a new channel within an existing
 *  connection.
 * @param {MessageHandler} onMessage Function to be called when a message has arrived.
 * @param {string} [queueName] The name of the queue to bind on. If a queue name is not specified,
 *  it will bind to a queue created by rabbitmq.
 * @param {boolean} [assertQueue=true] If true, will assert the queue into existance.
 * @param {QueueOptions} [assertQueueOptions]
 * @param {ConsumeOptions} [consumeOptions]
 * @param {integer} [prefetch=1]
 * @param {string} [exchangeName='']
 * @param {string} [routingKey]
 * @param {boolean} [assertExchange=false] If true, will assert the exchange into existance.
 * @param {string} [assertExchangeType='direct'] The type of exchange to be asserted into existence.
 * @param {ExchangeOptions} [assertExchangeOptions]
 * @param {ConsumingCallback} [onConsuming] Callback method when the consumer is consuming.
 * @return {Consumer} Consumer
 * @example
 *  nodeMQ.consume({
 *    queueName: 'myQueue',
 *    onMessage: (msg,channel,body)=>{
 *      console.log('Recieved Message!);
 *      console.log(body);
 *      nodeMQ.reply(msg,channel,'My response');
 *    }
 *  });
 */
const consumer = (connection) => (
  {
    onMessage,
    prefetch = 1,

    exchangeName = '',
    routingKey = false,
    assertExchange = false,
    assertExchangeType = 'direct',
    assertExchangeOptions = {},

    queueName,
    assertQueue = true,
    assertQueueOptions = {},

    consumeOptions = {},
    onConsuming = () => Promise.resolve(true),
  } = {},
) => {
  let channel = null;

  connection
    .then((conn) => conn.createChannel())
    .then((chan) => {
      channel = chan;
      return channel.prefetch(prefetch);
    })
    .then(() => {
      // create exchange if specified
      if (exchangeName !== '' && assertExchange) {
        return channel.assertExchange(exchangeName, assertExchangeType, assertExchangeOptions);
      }

      return '';
    })
    .then(() => {
      // create queue if specified
      if (queueName && assertQueue) {
        return channel.assertQueue(queueName, assertQueueOptions)
          .then(() => queueName);
      }

      // if queue is not specified, create a new queue from rabbitmq
      if (!queueName) {
        return channel.assertQueue('', assertQueueOptions)
          .then((queue) => queue.queue);
      }

      return queueName;
    })
    .then((queue) => {
      // bind queue to exchange if required
      if (routingKey) {
        return channel.bindQueue(queue, exchangeName, routingKey)
          .then(() => queue);
      }

      // bind queue to exchange by name if no routing key is given
      if (exchangeName !== '') {
        return channel.bindQueue(queue, exchangeName, queue)
          .then(() => queue);
      }

      return queue;
    })
    .then((queue) => channel.consume(queue, (msg) => {
      let { content: body } = msg;
      const { contentEncoding, contentType } = msg.properties;

      if (contentEncoding) {
        body = decode(body, contentEncoding);
      }

      if (contentType) {
        try {
          body = unpack(body, contentType);
        } catch (e) {
          body = {
            content: body,
            error: `Error processing ${contentType}: ${e.message}`,
          };
        }
      }

      onMessage(msg, channel, body);
    }, consumeOptions)
      .then(() => Promise.resolve(onConsuming(queue, channel))));

  return {
    disconnect: () => {
      if (channel === null) {
        return Promise.resolve(true);
      }

      return channel.close()
        .then(() => { channel = null; });
    },
  };
};

export default consumer;
