'use strict';

/* global express, Router */

module.exports = (new Router()
  .use('/view', require('controller/api/view'))
  .use('/capture', require('controller/api/capture'))
  .use('/', express.static(rootDir + '/ui/root'))
);

require('controller/response')(module.exports);
