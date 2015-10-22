'use strict';

/* global spawn, spawnware, Router */

let Tntu = require('model/capture/tntu');

let getTntuSchedcap = spawnware(function*(req) {
  spawn(function*() {
    let onProgress = p => console.log('tntu capture progress:', p);
    yield Tntu.captureCurrent({name: 'tntu', onProgress: onProgress});
  });

  return {data: {ok: true}};
});

let getTntuSchedcapProf = spawnware(function*(req) {
  spawn(function*() {
    let onProgress = p => console.log('tntu prof capture progress:', p);
    yield Tntu.captureProfCurrent({name: 'tntu', onProgress: onProgress});
  });

  return {data: {ok: true}};
});

module.exports = (new Router()
  .get('/tntu-schedcap', getTntuSchedcap)
  .get('/tntu-schedcap-prof', getTntuSchedcapProf)
);
