'use strict';

require('app-module-path').addPath(__dirname + '/app');
require('esfunctional');

/* global catcha, spawn, promisify, express, mongoose */

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

global.express = require('express');
global.Router = express.Router;

global.mongoose = require('mongoose');
global.Schema = mongoose.Schema;

let config = require('config');
let chalk = require('chalk');
let out = require('helper/output');
let path = require('path');
let http = require('http');

out.ns = 'api';

global.rootDir = __dirname;
global.appDir = path.join(__dirname, '/app');

out.prettyError.alias(path.join(__dirname), '[api]');

process.on('exit', () => {
  console.log('');
  out.warn('TNTU Schedule Capture API Server stopped @', chalk.cyan(config.httpPort));
});

process.on('unhandledException', out.logException);

let failureExit = () => {process.exit(1);};

process.on('SIGTERM', failureExit);
process.on('SIGHUP', failureExit);
process.on('SIGINT', failureExit);

let dropCollections = () => spawn(function*() {
  let colls = yield mongoose.connection.db [promisify]('collections')();

  for (let coll of colls) {
    if (coll.collectionName.substring(0, 6) !== 'system') {
      yield coll [promisify]('remove')({});
    }
  }
});

spawn(function*() {
  out.info('Environment:', chalk.cyan(config.env));

  try {
    yield mongoose [promisify]('connect')(config.mongodb);
    yield mongoose.connection.db [promisify]('collections')();
    out.info('Connected to MongoDB');
  } catch (err) {
    out.error(chalk.red('Could not connect to MongoDB @ '), chalk.cyan(config.mongodb));
    throw err;
  }

  if (process.env.NODE_ENV === 'testing' && !process.env.TESTING_NODROPDB) {
    out.info(chalk.bold.magenta('Clearing test database'));
    yield dropCollections();
  }

  try {
    require('model');
    out.info('Initialized Database Models');
  } catch (err) {
    out.error(chalk.red('Could not initialize Database Models'));
    throw err;
  }

  let app;
  let server;

  try {
    app = express();
    server = http.Server(app);
    require('controller/socket')({server: server});
    app.use(require('cors')());
    app.use(require('compression')({level: 9}));
    yield server [promisify]('listen')(config.httpPort);
    out.info('TNTU Schedule Capture API Web Server listens @', chalk.cyan(config.httpPort));
  } catch (err) {
    out.error(chalk.red('Could not start Web Server @'), chalk.cyan(config.httpPort));
    throw err;
  }

  try {
    app.use(require('controller'));
    out.info('Initialized Endpoint Controllers');
  } catch (err) {
    out.error(chalk.red('Could not initialize Endpoint Controllers'));
    throw err;
  }

  out.info(chalk.bold.green('Ready'));
})

[catcha]((err) => {
  out.logException(err);
  process.exit(1);
});
