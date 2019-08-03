## Message Bus

Connection is established by reading the `MESSAGEBUS_URL` environment url.

**Quick Example**
```
const messageBus = require('com/messageBus');
messageBus.consume(
  'queue_name',
  (channel, msg)=>{
    console.log( 'I just recieved a message', msg.contents.toString() )
  }
)

messageBus.publish_noResponse('Message')
  .then( ()=> console.log('I just send a message!') )

messageBus.publish_getResponse('Message 2')
  .then( response=> console.log('I just recieved a message!') )
```

**API Documentation**

messageBus.**consume** (queue_name, exchange_name, routing_key, callback, connected)
 * queue_name <String>
 * exchange_name <String>
 * routing_key <String/Pattern>
 * callback <Function>
  * channel <Channel Object>
  * msg <Message Object>
 * connected <Function>

Listens on specified queue. Callback function used to handle messages recieved. Should return a promise with results (scalar or array). This will be sent to the reciever (if there is one). Messages will be `acked` on success. Returning null will reject the message and will not be requed. Rejects will be caught and message will be `acked`, response will contain error message. `connected` is a callback for when the channel has been connected without issue, first and only argument is channel.


messageBus.**publish_noReponse** (message, exchange_name, routing_key) <Promise>

 * message <Any>
 * exchange_name <String>
 * routing_key <Pattern>

Sends a message and does not wait for a response. `message` will be packed into binary before being sent (if not already). If the message is a JSON object, it will be stringified before being packed into a binary.


messageBus.**publish_getResponse** (message, exchange_name, routing_key) <Promise>

 * message <Any>
 * exchange_name <String>
 * routing_key <Pattern>

Sends a message and waits for the response. Returns a promise containing the response. Details of `message` object are the same as **publish_noResponse**. 


messageBus.**connection** () <Promise>

Returns a promise containing the connection object to the messaging bus.


messageBus.**disconnect** () <Promise>

 Disconnects from the messaging bus.