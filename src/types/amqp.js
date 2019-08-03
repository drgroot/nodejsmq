/**
 * Properties set when the message has been sent from the publish method
 * @typedef {Object} MessageProperties
 * @property {string} expiration
 * @property {string} userId
 * @property {integer} priority
 * @property {boolean} persistent
 * @property {string} contentType
 * @property {string} contentEncoding
 * @property {string} correlationId
 * @property {string} replyTo
 * @property {string} messageId
 * @property {string} type
 * @property {string} appId
 */

/**
 * Message recived from rabbitmq
 * @typedef {Object} Message
 * @property {buffer} content
 * @property {MessageProperties} properties
 */
