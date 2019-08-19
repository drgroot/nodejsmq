# NodeMQ

A simple rabbitmq implementation

## Quick Example
```
const nodeMQ = require('nodejsmq')('amqp://rabbitmq/'); // Connection url
nodeMQ.consume(
  'my-queue',
  (msg,channel) => nodeMQ.reply(msg,channel,'I send a message in response!')
)

nodeMQ.publishNoResponse(['my data','to send'],'a-queue')

nodeMQ.publishGetResponse('send this','*.log','myExchange')
  .then( response=> console.log('I just recieved a message!',response.toString()) )
```

## API Documentation

### Consuming

nodeMQ.**consume** (queue_name, consume_function, options)
 * `queue_name` Name of queue to assert on.
 * `consume_function` Handle recieved messages
 * `options` Consumption object

Listens on specified queue. Callback function used to handle messages recieved. Consume function takes message as first parameter and chanel as the second parameter.

Options accepts the following parameters:

| Name          | Default                     |  Description    |
| ------------- | --------------------------- | --------------- |
| `prefetch`    | `1`                    | AMQP prefetch  |  
| `exchangeName`| `''` | Name of exchange to bind to  |
| `assertExchange`  | `true` | If true, assert the exchange into existence. |
| `assertExchangeType`  | `'direct'` | When asserting the exchange, mode to assert on |
| `assertExchangeOptions`  | `{}` | Options to pass when asserting the exchange |
| `routingKey`  | `''` | Routing key to use when binding to an exchange |
| `assertQueue`  | `true` | If true, assert the queue into existence. |
| `assertQueueOptions`  | `{}` | Options to pass when asserting the queue |

nodeMQ.**reply** (message, channel, response) [Promise]

 * `message` Content to send
 * `channel` Channel being used for consumption
 * `response` Content used to response

Replies to a message. `response` will be packed into a binary before being sent. If message is not meant to replied to, it will not reply with anything. It will ack the message.


### Publishing

nodeMQ.**publishNoResponse** (message, routing_key, exchange_name) [Promise]

 * `message` Content to send
 * `routing_key` Routing pattern or queue to publish to
 * `exchange_name` Exchange to publish on. Default '';

Sends a message and does not wait for a response. `message` will be packed into binary before being sent (if not already). If the message is a JSON object, it will be stringified before being packed into a binary.


nodeMQ.**publishGetResponse** (message, routing_key, exchange_name) [Promise]

 * `message` Content to send
 * `routing_key` Routing pattern or queue to publish to
 * `exchange_name` Exchange to publish on. Default '';

Sends a message and waits for the response. Returns a promise containing the response. 


### Other Functions

nodeMQ.**connection** () [Promise]

Returns a promise containing the connection object to the messaging bus.


nodeMQ.**disconnect** () [Promise]

Disconnects from the messaging bus.