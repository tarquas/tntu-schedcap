'use strict';

/* global nok, catcha */

let config = require('config');
let chalk = require('chalk');
let PrettyError = require('pretty-error');

let S = module.exports;

S.prettyError = new PrettyError();

S.nsPfx = () => S.ns ? (S.ns + ' ') : '';

S.debug = function() {return (config.debug) && console.log.apply(
  console,
  [chalk.bold.cyan('[' + S.nsPfx() + 'debug]')].concat([].slice.call(arguments))
);};

S.info = function() {return console.log.apply(
  console,
  [chalk.bold.green('[' + S.nsPfx() + 'info]')].concat([].slice.call(arguments))
);};

S.warn = function() {return console.log.apply(
  console,
  [chalk.bold.yellow('[' + S.nsPfx() + 'warn]')].concat([].slice.call(arguments))
);};

S.error = function() {return console.log.apply(
  console,
  [chalk.bold.red('[' + S.nsPfx() + 'error]')].concat([].slice.call(arguments))
);};

S.logException = (err) => {
  S.error(chalk.bold.gray('@'), chalk.yellow(new Date().toISOString()));

  S.info(
    err instanceof Error ? S.prettyError.render(err) :
    err ? chalk.cyan(JSON.stringify(err.message || err, null, 2)) :
    chalk.bold.red('unknown error')
  );
};

S.stack = Symbol('output.stack');
Object.prototype[S.stack] = function(back) {
  let stack;

  try {
    throw new Error();
  } catch (err) {
    stack = err.stack.split('\n');
    stack.splice(0, (back || 0) + 2);
    stack = stack.join('\n');
  }

  return this [catcha](err => (
    err.stack = (err.stack ? err.stack.split('\n')[0] : (err.message || err)) + stack,
    nok(err)
  ));
};
