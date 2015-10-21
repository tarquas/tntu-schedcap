'use strict';

/* global Router */

module.exports = (new Router()
  .use('/view', require('controller/api/view'))
  .use('/capture', require('controller/api/capture'))
);

require('controller/response')(module.exports);
