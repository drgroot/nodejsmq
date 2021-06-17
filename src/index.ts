import amqplib, { Connection, Channel, Message } from 'amqplib';
import { unpack, pack, ContentTypeName } from './content/types';
import { decode, encode, EncodingTypeName } from './content/encoding';

interface PublishOptions {
  exchangeName?: string,
  contentType?: ContentTypeName,
  contentEncoding?: EncodingTypeName,
}

interface AssertQueueOptions {
  exclusive?: boolean,
  durable?: boolean,
  autoDelete?: boolean,
}

interface ConsumerOptions {
  consumerTag?: string,
  noLocal?: boolean,
  noAck?: boolean,
  exclusive?: true,
}

interface MessageHandler {
  (message: Message | null, channel: Channel, body: any): void
}

interface ConsumingCallback {
  (queueName?: string, channel?: Channel): void
}

interface Consumer {
  disconnect(): Promise<true>;
}

export default class NodeMQ {
  private connectionURL: string;

  public connection: any;

  constructor(connectionUrl: string) {
    this.connectionURL = connectionUrl;
    this.connect();
  }

  connect(): any {
    this.connection = amqplib.connect(this.connectionURL);
    return this.connection;
  }

  /**
   * @description closes the connection
   */
  disconnect(): void {
    this.connection
      .then((conn: Connection) => conn.close())
      .then(() => { this.connection = null; });
  }

  /**
   * @description Sends a message along rabbitMQ
   * @param routingKey string routingKey of the consumer to send to
   * @param message the message to send
   * @param {PublishOptions} options
   */
  publish(
    routingKey: string,
    message: any,
    { exchangeName = '', contentType = 'application/json', contentEncoding = 'base64' }: PublishOptions = {},
  ): Promise<any> {
    return ((this.connection) ? this.connection : this.connect())
      .then((conn: Connection) => conn.createChannel())
      .then((channel: Channel) => {
        const packedMessage = pack(message, contentType);
        const encodedMessage = encode(packedMessage, contentEncoding);

        channel.publish(
          exchangeName,
          routingKey,
          encodedMessage,
          {
            contentType,
            contentEncoding,
          },
        );

        return channel.close();
      });
  }

  consume(
    {
      onMessage,
      prefetch = 1,

      exchangeName = '',
      routingKey,
      queueName = 'test',
      assertQueue = true,
      assertQueueOptions = {},

      consumeOptions = {},
      consumeCallback = () => true,
    }: {
      onMessage?: MessageHandler,
      prefetch?: number,

      exchangeName?: string,
      routingKey?: string,
      queueName?: string,
      assertQueue?: boolean,
      assertQueueOptions?: AssertQueueOptions,

      consumeOptions?: ConsumerOptions,
      consumeCallback?: ConsumingCallback,
    } = {},
  ): Consumer {
    let channel: Channel;

    ((this.connection) ? this.connection : this.connect())
      .then((conn: Connection) => conn.createChannel())
      .then((chan: Channel) => { channel = chan; })
      .then(() => channel.prefetch(prefetch))
      .then(
        () => ((assertQueue)
          ? channel.assertQueue(
            queueName,
            {
              exclusive: false, durable: true, autoDelete: false, ...assertQueueOptions,
            },
          ) : false),
      )
      .then(
        () => ((exchangeName !== '') ? channel.bindQueue(
          queueName, exchangeName, routingKey || queueName,
        ) : false),
      )
      .then(
        () => channel.consume(
          queueName,
          (msg: null | Message) => {
            let body = msg?.content;
            if (msg?.properties.contentEncoding) {
              body = decode(body, msg?.properties.contentEncoding);
            }

            if (msg?.properties.contentType) {
              try {
                body = unpack(body, msg?.properties.contentType);
              } catch (e) {
                // pass
              }
            }

            if (onMessage) {
              onMessage(msg, channel, body);
            }
          },
          consumeOptions,
        ),
      )
      .then(() => consumeCallback(queueName, channel));

    return {
      disconnect: () => {
        if (channel === null) return Promise.resolve(true);

        return new Promise((resolve) => channel.close()
          .then(() => resolve(true)));
      },
    };
  }
}
