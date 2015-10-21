'use strict';

/* global spawn, spawnware, Router */

let Tntu = require('model/capture/tntu');

let getCapture = spawnware(function*(req) {
  let key = req.params.key;

  if (key === 'tntu-schedcap') spawn(function*() {
    let onProgress = p => console.log(key, 'capture progress:', p);
    yield Tntu.captureCurrent({name: 'tntu', onProgress: onProgress});
  });

  return {data: {ok: true}};
});

module.exports = (new Router()
  .get('/:key', getCapture)
);
