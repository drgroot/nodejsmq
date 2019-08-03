'use strict';
const amqplib = require('amqplib');

module.exports = function () {

  let connection = amqplib.connect(process.env['MESSAGEBUS_URL'])
    .then(conn => {
      console.log('Connected to message bus');
      connection = conn;

      return conn;
    })
    .catch(e => console.error('Unable to connect to messaging bus', e));

  /**
   * Returns promise containing connection object
   */
  return connection;
}();