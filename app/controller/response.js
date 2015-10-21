'use strict';

/* global spawnware, errorware, extend, omit */

let chalk = require('chalk');
let httpErrors = require('controller/http-errors');
let out = require('helper/output');

let ping = spawnware(function() {
  return {data: 'pong'};
});

let notFound = spawnware(function() {
  throw ['notFound'];
});

let httpError = function(data, req, res, next) {

  //jshint maxcomplexity: 8

  // body-parser error
  if (data.statusCode && data.statusCode !== 200) data[errorware] = true;

  if (data[errorware]) {
    if (data instanceof Array) {
      let name = data[0];
      let error = httpErrors[name];
      res.status(error ? error.code : 500);
      return next({error: name, message: error && error.message});
    }

    let statusCode = 500;

    // middleware error
    if (data.statusCode) {
      statusCode = data.statusCode;
      data = data [extend]({error: data.type}) [omit]('status', 'statusCode', 'type');
      return res.status(statusCode), next(data);
    }

    out.error(chalk.gray('@'), chalk.yellow(new Date().toISOString()));
    out.info(chalk.gray('@'), chalk.bold.cyan(req.method), chalk.cyan(req.path));

    out.info(data instanceof Error ? out.prettyError.render(data) : data);
    res.status(statusCode);
    return next(data instanceof Error ? {error: data.message} : data);
  }

  return next(data);
};

let httpReply = function(data, req, res, next) {
  void next;
  if (typeof data === 'string') return res.header('Content-Type', 'text/html;charset=utf-8').end(data);

  if (typeof data === 'object') return (
    res.header('Content-Type', 'application/json;charset=utf-8')
    .end(JSON.stringify(data))
  );

  if (data instanceof Buffer) return res.end(data);
  res.header('Content-Type', 'application/json;charset=utf-8').end(JSON.stringify(data));
};

module.exports = (app) => (app
  .get('/ping', ping)
  .use(notFound)
  .use(httpError)
  .use(httpReply)
);
