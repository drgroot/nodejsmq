# NodeMQ

A simple rabbitmq implementation

## Quick Example
```
const nodeMQ = require('nodejsmq')('amqp://rabbitmq/'); // Connection url
nodeMQ.consume(
  'my-queue',
  (msg,channel) => Promise.resolve('I recieved a message')
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

Listens on specified queue. Callback function used to handle messages recieved. Should return a promise with results (scalar or array). This will be sent to the reciever (if there is one). Messages will be `acked` on success. Returning `null` will `nack` the message and will not be requeued. Rejects will be caught and message will be `acked`, response will contain error message.

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