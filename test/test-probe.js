'use strict';

/* global spawn, out, chalk */

let Tntu = require('model/capture/tntu');

module.exports = spawn(function*() {
  out.info(chalk.bold.yellow('Probe > TNTU'));
  let onProgress = p => console.log('capture progress: ', p);
  yield Tntu.captureCurrent({name: 'tntu', onProgress: onProgress});
});
