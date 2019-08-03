# Boilerplate Code for NodeJS Microservice

## Summary

This repository contains standard library code for writing a microservice in NodeJS. It contains a library for interacting with the messaging bus and logging using the Cornerstone logging format.

## Getting Started 

Simply add this code into your repository as a submodul. `$GITURL` is the clone URL of the repository.
`git submodule add $GITURL src/com`. 

You can now require `src/com/messageBus` and `src/com/logger` to use the messaging bus and logging endpoints respectively.

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

messageBus.**consume** (queue_name, callback)
 * queue_name <String>
 * callback <Function>
   * channel <Channel Object>
   * msg <Message Object>

Listens on specified queue. Callback function used to handle messages recieved. Should return a promise with results (scalar or array). This will be sent to the reciever (if there is one). Messages will be `acked` on success. Returning null will reject the message and will not be requed. Rejects will be caught and message will be `acked`, response will contain error message.


messageBus.**publish_noReponse** (message) <Promise>

 * message <Any>

Sends a message and does not wait for a response. `message` will be packed into binary before being sent (if not already). If the message is a JSON object, it will be stringified before being packed into a binary.


messageBus.**publish_getResponse** (message) <Promise>

 * message <Any>

Sends a message and waits for the response. Returns a promise containing the response. Details of `message` object are the same as **publish_noResponse**. 


messageBus.**connection** () <Promise>

Returns a promise containing the connection object to the messaging bus.


messageBus.**disconnect** () <Promise>

 Disconnects from the messaging bus.

## Logger

Connection is established by reading the `LOG_MANAGEMENT_URL` and `LOG_MANAGEMENT_PORT` environment variables. If `NODE_ENV` is set to production, it will not log to console. Microservice name will be read from global variable `global.MICROSERVICE_NAME` or environment variable `MICROSERVICE_NAME`. Environment variable will override the global variable.

The logger will prefix all logs following format: 

`{TIMESTAMP IN EST} {HOSTNAME} {MICROSERVICE_NAME} {LOG LEVEL}:`

logger(level, ...message)

* level <String>
* ...message <Any>

`level` is the log level. `message` is any argument following the first argument.