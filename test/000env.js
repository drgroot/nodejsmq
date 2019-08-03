'use strict';
const messageBus = require('../');

after(() => messageBus.disconnect());