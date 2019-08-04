'use strict';
const os = require('os');
const moment = require('moment-timezone');
const publish = require('./messageBusPublish.js').noResponse;

let hostname = os.hostname();
let microservice_name = (process.env.MICROSERVICE_NAME) ? process.env.MICROSERVICE_NAME
  : (global.MICROSERVICE_NAME) ? global.MICROSERVICE_NAME : '';

/**
 * Logs message to the logging bus
 * @param {String} level Log level
 * @param {Any} message Any argument after is also passed to logger
 */
module.exports = (level, ...message) =>
  (process.env.NODE_ENV !== 'production') ?
    Promise.resolve(console.log(level, ...message)) :
    publish(
      {
        level: level.toLowerCase(),
        time: moment(new Date()).tz('America/Cancun').format('YYYY-MM-DDTHH:mm:ssZZ'),
        hostname: hostname,
        microservice: microservice_name,
        message: [...message],
      },
      'logs-exchange',
      `${level.toLowerCase()}.log`
    );