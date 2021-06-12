import Consumer from './consume';
import { encode } from './lib/contentEncoding';
import { pack } from './lib/contentType';
import './types/amqp';

const basicPublish = (
  connection,
  routingKey,
  message,
  {
    exchangeName = '',
    contentType = 'application/json',
    contentEncoding = 'base64',
    ...options
  } = {},
) => connection
  .then((conn) => conn.createChannel())
  .then((channel) => {
    const packedMessage = pack(message, contentType);

    channel.publish(
      exchangeName,
      routingKey,
      encode(packedMessage, contentEncoding),
      {
        ...options,
        contentType,
        contentEncoding,
      },
    );
    return channel.close();
  });

const publisher = (connection) => ({
  publish: (routingKey, message, options) => basicPublish(connection, routingKey, message, options),

  publishMessage: (
    routingKey,
    message,
    options,
  ) => new Promise((resolve) => {
    const datetime = (new Date()).getTime();
    const randomNums = Math.random();
    const correlationId = `${datetime}${randomNums}`;
    const consumer = Consumer(connection);

    consumer({
      assertQueueOptions: {
        exclusive: true, durable: false, autoDelete: true,
      },
      onConsuming: (replyTo) => basicPublish(
        connection,
        routingKey,
        message,
        {
          ...options,
          correlationId,
          replyTo,
        },
      ),
      onMessage: (msg, channel, body) => {
        if (msg.properties.correlationId !== correlationId) {
          channel.nack(msg, false, true);
        } else {
          channel.ack(msg);
          channel.close()
            .then(() => resolve(body));
        }
      },
    });
  }),
});

export default publisher;
