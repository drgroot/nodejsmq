'use strict';
const amqplib = require('amqplib');
const logger = require('../logger');

module.exports = function () {
  const connection = amqplib.connect(process.env['MESSAGEBUS_URL'])
    .catch(e => logger('error', 'Unable to connect to messaging bus', e));

  connection.on('error', function (err) {
    logger('error', 'Error on messaging bus', err);
  });

  return {
    /**
     * Returns promise containing connection
     */
    conn: connection,

    /**
     * Disconnects from messaging bus. Returns a promise upon closure.
     */
    disconnect: () => new Promise((resolve, reject) =>
      connection.close(function (err) {
        if (err) return reject(err);
        resolve();
      })
    )
  }
}();