'use strict';

/* global spawnware */

let User = require('model/user');
let crypt = require('helper/crypt');
let config = require('config');
let secret = config.secret;

let auth = spawnware(function*(req) {
  let token = req.headers['x-api-auth'] || req.query.auth;
  if (!token) throw ['badToken'];
  let auth;

  try {
    auth = crypt.decryptToken(token, secret);
  } catch (err) {
    throw ['badToken'];
  }

  if (!auth) throw ['badToken'];
  let user = yield User.auth({id: auth.user, authRev: auth.rev});
  if (!req.auth) req.auth = {};
  req.auth.user = user;
  req.modelHeader = {caller: user};
});

module.exports = auth;
