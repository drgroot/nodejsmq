# NodeMQ

A simple rabbitmq library.

## Installation

```
npm install --save nodejsmq
```

## Quick Example
```
import nodejsmq from 'nodejsmq';

// create a connection to the rabbitmq server
const nodeMQ = nodejsmq('amqp://rabbitmq/');

// start consuming
nodeMQ.consume({
  queueName: 'myqueue',
  onMessage: (msg,channel,body)=>{
    console.log('Recieved message');
    console.log(body);
    nodeMQ.reply(msg, channel, 'My Response');
  },
});

// publish a message
nodeMQ.publish('myqueue','Send this info!')
  .then((response)=>{
    console.log('the consumer responded!');
    console.log(response);
  });
```

## [Full API Reference](https://drgroot.github.io/nodeMQ)