'use strict';
require('app-module-path').addPath(__dirname + '/../app');
require('esfunctional');

global.mongoose = require('mongoose');

/* global T, ok, thena, catcha, spawn, promisify, delay, test, mongoose */

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'testing';

let config = require('config');
let chalk = require('chalk');
let web = require('helper/web');
let out = require('helper/output');

global.T = {};
global.web = web;
global.out = out;
global.chalk = chalk;
T.apiUrl = config.apiUrl;

out.prettyError.alias(__dirname, '[test]');
out.prettyError.skipNodeFiles();
out.prettyError.skip(traceLine => traceLine.packageName !== '[current]');

module.exports = ok();

spawn(function*() {

  //jshint maxcomplexity: 7

  out.info(chalk.bold.magenta('Powering up webserver'));
  require('..'); // boot app

  yield mongoose.connection [promisify]('once')('open');

  // wait for server start up
  let nTries = 40;
  while (--nTries && (yield web.get(T.apiUrl + '/ping') [catcha]()).status !== 200) yield delay(100);
  if (!nTries) throw new Error('Webserver hasn\'t powered up for 4 seconds');

  out.info(chalk.bold.magenta('Starting Tests'));

  out.info(chalk.yellow('Integrity of Webserver'));

  (yield web.get(T.apiUrl + '/ping') [catcha]()) [test]('Bad response for /ping', {
    status: 200,
    data: {data: 'pong'},
  });

  (yield web.get(T.apiUrl + '/someWrongUrl') [catcha]()) [test]('Bad response for wrong urls', {
    status: 404,
  });

  let files = require('fs').readdirSync(__dirname).sort();
  for (let file of files) yield require('./' + file);

  out.info(chalk.bold.green('===== All tests succeeded ====='));

  return 0; // success
})

// emit exit code
[thena](process.exit)

//error handler
[catcha]((err) => {
  out.logException(err);
  process.exit(1);
});
