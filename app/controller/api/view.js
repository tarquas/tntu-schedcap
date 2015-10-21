'use strict';

/* global spawnware, Router */

let Sched = require('model/sched');

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
  .get('/sched/:name', getSchedView)
);
