'use strict';

/* global express, Router */

module.exports = (new Router()
  .use('/view', require('controller/api/view'))
  .use('/capture', require('controller/api/capture'))
  .use('/', express.static(rootDir + '/ui/root' + (process.env.MAINTENANCE_MODE ? '-mtn' : '')))
);

require('controller/response')(module.exports);
