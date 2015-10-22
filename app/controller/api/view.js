'use strict';

/* global spawnware, Router */

let Room = require('model/room');
let Sched = require('model/sched');

let getSchedRooms = spawnware(function*(req) {
  let rooms = yield Room.getAll({});
  return {data: rooms};
});

let getSchedView = spawnware(function*(req) {
  let arg = {
    name: req.params.name,
    room: req.query.room
  };

  if (arg.room) {
    return {data: yield Sched.getByRoom(arg)};
  } else throw ['badArgument'];
});

module.exports = (new Router()
  .get('/sched/rooms', getSchedRooms)
  .get('/sched/:name', getSchedView)
);
