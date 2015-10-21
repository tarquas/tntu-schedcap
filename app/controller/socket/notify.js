'use strict';

/* global spawn, promisify, defaults, extend */

let io;

let S = module.exports = (cfg) => {
  let ctlr = {
    root: require('controller'),
    auth: require('controller/auth'),
  };

  io = require('socket.io')(cfg.server, {path: '/notify'});

  io.on('connection', (socket) => spawn(function*() {try {
    let query = socket.request._query;
    let auth = query && query.auth;
    if (!auth) return;

    let req = {header: () => null, query: {auth: auth}};

    yield ctlr [promisify]('auth')(req, {});

    socket.join(req.auth.user);

    socket.on('api', (args) => {
      let res = {
        statusCode: 200,

        status: function(code) {
          this.statusCode = code;
          return this;
        },

        end: function(data) {
          socket.emit('api', {
            id: args.id,
            status: this.statusCode,
            data: data,
            headers: this.headers,
          });
        },
      };

      let req = {
        res: res,
        method: args.method.toUpperCase(),
        url: args.path,
        query: ({auth: auth}) [defaults](args.query),
        headers: ({}) [extend](args.headers) [defaults](socket.request.headers),

        header: function(name) {
          return this.headers[name.toLowerCase()];
        },

        ip: socket.handshake.address,
      };

      ctlr.root.handle(req, res);
    });
  } catch (ee) {}}));
};

S.users = (userIds, data) => {
  if (!io) return false;
  userIds.forEach(userId => io.to(userId).emit('notify', data));
  return true;
};
