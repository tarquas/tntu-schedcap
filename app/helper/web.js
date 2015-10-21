'use strict';

let PromiseSaved = global.Promise;
module.exports = require('axios');
global.Promise = PromiseSaved;
