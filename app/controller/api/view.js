'use strict';

/* global spawnware, Router */

let Room = require('model/room');
let Prof = require('model/prof');
let Sched = require('model/sched');

let getSchedRooms = spawnware(function*(req) {
  let rooms = yield Room.getAll({});
  return {data: rooms};
});

let getSchedProfs = spawnware(function*(req) {
  let profs = yield Prof.getAll({});
  return {data: profs};
});

let getSchedView = spawnware(function*(req) {
  let arg = {
    name: req.params.name,
    room: req.query.room,
    prof: req.query.prof
  };

  if (arg.room || arg.prof) {
    return {data: yield Sched.get(arg)};
  } else throw ['badArgument'];
});

module.exports = (new Router()
  .get('/sched/rooms', getSchedRooms)
  .get('/sched/profs', getSchedProfs)
  .get('/sched/:name', getSchedView)
);
