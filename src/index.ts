import amqplib, { Connection, Channel, Message } from 'amqplib';
import { unpack, pack, ContentTypeName } from './content/types';
import { decode, encode, EncodingTypeName } from './content/encoding';

export interface PublishOptions {
  exchangeName?: string,
  contentType?: ContentTypeName,
  contentEncoding?: EncodingTypeName,
  replyTo?: string
  correlationId?: string
  [key: string]: any
}

export interface AssertQueueOptions {
  exclusive?: boolean,
  durable?: boolean,
  autoDelete?: boolean,
}

export interface ConsumerOptions {
  consumerTag?: string,
  noLocal?: boolean,
  noAck?: boolean,
  exclusive?: true,
}

export interface MessageHandler<T> {
  (message: Message | null, channel: Channel, body: T | undefined | Buffer): void
}

export interface ConsumingCallback {
  (queueName?: string, channel?: Channel): void
}

interface Consumer {
  disconnect(): Promise<true>;
  reply(message: Message, channel: Channel, response: any): Promise<any>;
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
    {
      exchangeName = '',
      contentType = 'application/json',
      contentEncoding = 'base64',
      ...options
    }: PublishOptions = {},
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
            ...options,
            contentType,
            contentEncoding,
          },
        );

        return channel.close();
      });
  }

  consume<T>(
    {
      onMessage,
      prefetch = 1,

      exchangeName = '',
      routingKey,
      queueName = `amqp.${(new Date()).getTime().toString()}`,
      assertQueue = true,
      assertQueueOptions = {},

      consumeOptions = {},
      consumeCallback = () => true,
    }: {
      onMessage?: MessageHandler<T>,
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
        () => ((exchangeName !== '') ? channel.bindQueue(queueName, exchangeName, routingKey || queueName) : false),
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

        return new Promise((resolve) => {
          channel.close()
            .then(() => resolve(true));
        });
      },

      reply: (message, ch, response) => {
        if (message.properties.replyTo) {
          this.publish(
            message.properties.replyTo,
            response,
            {
              exchangeName: message.fields.exchange || exchangeName,
              contentType: message.properties.contentType,
              contentEncoding: message.properties.contentEncoding,
              correlationId: message.properties.correlationId,
            },
          );
        }

        return Promise.resolve(ch.ack(message));
      },
    };
  }

  rpcPublish<T>(
    routingKey: string,
    message: any,
    {
      exchangeName = '',
      contentType = 'application/json',
      contentEncoding = 'base64',
      ...options
    }: PublishOptions = {},
  ) {
    return new Promise((resolve, reject) => {
      const datetime = (new Date()).getTime();
      const randomNums = Math.random();
      const correlationId = `${datetime}${randomNums}`;

      this.consume<T>({
        assertQueue: true,
        assertQueueOptions: { exclusive: true, durable: false, autoDelete: true },
        onMessage: (msg, channel, body) => {
          if (msg?.properties.correlationId === correlationId) {
            channel.ack(msg);
            channel.close()
              .then(() => resolve(body || msg));
          } else if (msg) {
            channel.nack(msg);
          }
        },
        consumeCallback: (replyTo) => {
          if (replyTo) {
            this.publish(
              routingKey,
              message,
              {
                ...options,
                exchangeName,
                contentType,
                contentEncoding,
                correlationId,
                replyTo,
              },
            );
          } else {
            reject(new Error('Unable to form queue for replyTo'));
          }
        },
      });
    });
  }
}
