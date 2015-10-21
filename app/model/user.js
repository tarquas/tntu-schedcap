'use strict';

/* global spawn, catchify,
    uniq, omit, extend, groupBy, filter, invert, takeWhile,
    mongoose, byId, Schema */

let User;

let schema = new Schema(
  {
    name: String,
    timezone: String,
    email: String,
    password: String,
    authRev: Number,
    devices: [{_id: false, gimbalId: String, name: String}],
    reporters: [{_id: false, reporterId: String, name: String}],
  },

  {collection: 'user'}
);

let byEmail = {email: 1};
schema.index(byEmail, {unique: true, sparse: true});

let byName = {name: 1};
schema.index(byName);

let byDevice = {'devices.gimbalId': 1, name: 1};
schema.index(byDevice);

let byDeviceUnique = {'devices.gimbalId': 1};
schema.index(byDeviceUnique, {unique: true, sparse: true});

let byDeviceMap = {'devices.gimbalId': 1, _id: 1};
schema.index(byDeviceMap, {unique: true});

let byReporterUnique = {'reporters.reporterId': 1};
schema.index(byReporterUnique, {unique: true, sparse: true});

let S = schema.statics;

let moment = require('moment-timezone');

// regexp of valid email
S.validEmail = new RegExp(
  '^(([^<>()[\\]\\\\.,;:\\s@\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\"]+)*)' +
  '|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.' +
  '[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
);

// validate email
S.validateEmail = (email) => (
  email && email.length &&
  User.validEmail.test(email)
);

// validate password
S.validatePassword = (password) => (
  password && password.length && password.length >= 6
);

// validate name
S.validateName = (name) => (
  name && name.length && name.length >= 3
);

// validate device
S.validateGimbalId = (device) => (
  device && device.length && /^[a-zA-Z0-9-_]+$/.test(device)
);

// validate reporter id
S.validateReporterId = (reporterId) => (
  reporterId && reporterId.length &&
  reporterId.length >= 16 && S.validateGimbalId(reporterId)
);

// validate timezone
S.validateTimezone = (name) => (
  name && name.length && moment.tz.zone(name)
);

// register user
// {
//   name,
//   email,
//   password,
// }
// {
//   id
// }
S.register = (user) => spawn(function*() {
  if (!User.validateEmail(user.email)) throw ['badEmail'];
  if (!User.validatePassword(user.password)) throw ['badPassword'];
  if (!User.validateName(user.name)) throw ['badName'];
  if (!User.validateName(user.timezone)) throw ['badTimezone'];

  try {
    let found = yield User.findOneAndUpdate({
      name: user.name,
      email: {$exists: false},
    }, {
      $set: user,
      $inc: {authRev: 1},
      $setOnInsert: {},
    }, {
      upsert: true,
      sort: byName,
      new: true,
      select: {},
    }) [catchify]();

    return {id: found._id};
  } catch (err) {
    if (err.code === mongoose.ERROR_DUPLICATE) throw ['exists'];
    throw err;
  }
});

// auto register device
// {
//   deviceName,
//   deviceId,
// }
S.autoRegisterDevice = (user) => spawn(function*() {
  try {
    let found = yield User.findOneAndUpdate({
      name: user.deviceName,
    }, {
      $addToSet: {devices: {
        name: user.deviceName,
        gimbalId: user.deviceId,
      }},

      $setOnInsert: {
        name: user.deviceName,
        authRev: 1,
      },
    }, {
      upsert: true,
      sort: byName,
      new: true,
      select: {},
    }) [catchify]();

    return {id: found._id};
  } catch (err) {
    void err;
  }
});

// login user
// {
//   email,
//   password,
// }
// {
//   id,
//   authRev,
// }
S.login = (user) => spawn(function*() {
  if (!User.validateEmail(user.email)) throw ['badEmail'];
  if (!User.validatePassword(user.password)) throw ['badPassword'];

  let found = yield User.findOne(
    {email: user.email, password: user.password},
    {authRev: 1}
  ).sort(byEmail).exec() [catchify]();

  if (!found) throw ['badAuth'];

  return found.toObject() [omit]('_id') [extend]({id: found._id});
});

// auth user
// {
//   id,
//   authRev,
// }
// {
//   id,
//   name,
//   email,
//   devices: [],
// }
S.auth = (user) => spawn(function*() {
  let found = yield User.findOne(
    {_id: user.id, authRev: user.authRev},
    {name: 1, email: 1, devices: 1, reporters: 1}
  ).sort(byId).exec() [catchify]();

  if (!found) throw ['badToken'];

  return found.toObject() [omit]('_id') [extend]({id: found._id});
});

// get users
// {
//   caller,
//   ids,
//   gimbalIds,
// }
// [{
//   id,
//   name,
//   email,
//   devices: [],
// }]
S.get = (user) => spawn(function*() {

  //jshint maxcomplexity: 15

  //TODO: security; if (!user.ids) user.ids = [null];

  if (user.ids) {
    for (let idIdx in user.ids) {
      let id = user.ids[idIdx];
      if (!id || id === 'me') user.ids[idIdx] = id = user.caller.id;
      if (id === user.caller.id) user.ids[idIdx] = null;
      else if (!user.caller.admin) throw ['denied'];
    }
  }

  let query = {};

  let proj = {
    name: 1,

    //email: 1,
    //devices: 1,

  };

  let sort = byName;
  let noCall = false;

  if (user.ids) {
    let userIds = user.ids [uniq]() [filter](id => id);
    if (!userIds.length) noCall = true;
    query._id = {$in: userIds};
    sort = byId;
  }

  if (user.gimbalIds) {
    let gimbalIds = user.gimbalIds [uniq]();
    if (!gimbalIds.length) noCall = true;
    query.devices =
    proj.devices = {$elemMatch: {gimbalId: {$in: gimbalIds}}};
    if (sort !== byId) sort = byDevice;
  }

  let found = noCall ? [] : yield User.find(query, proj).sort(sort).exec() [catchify]();
  found = found.map(doc => doc.toObject() [omit]('_id') [extend]({id: doc._id}));

  let gimbalIdsInv = user.gimbalIds && user.gimbalIds [invert]();

  if (user.ids) {
    let grouped = found [groupBy](user => user.id);
    found = user.ids.map((id) => {
      if (id) return (grouped[id] || [null]) [0];
      if (!user.gimbalIds) return user.caller;
      return (
        user.caller.devices
        [takeWhile](device => !(device.gimbalId in gimbalIdsInv))
      ).length < user.caller.devices.length;
    });
  } else if (user.gimbalIds) {
    let grouped = found [groupBy](user => user.devices[0].gimbalId);
    found = user.gimbalIds.map(gimbalId => (grouped[gimbalId] || [null]) [0]);
  }

  return found;
});

// add user's device
// {
//   caller,
//   id,
//   device: {
//     gimbalId,
//     name,
//   }
// }
S.deviceAdd = (user) => spawn(function*() {
  if (!User.validateGimbalId(user.device.gimbalId)) throw ['badGimbalId'];
  if (user.id !== user.caller.id) throw ['denied'];
  let stat;

  try {
    stat = yield User.update(
      {_id: user.id, 'devices.gimbalId': {$ne: user.device.gimbalId}},
      {$addToSet: {devices: user.device}}
    ) [catchify]();
  } catch (err) {
    if (err.code === mongoose.ERROR_DUPLICATE) throw ['exists'];
    throw err;
  }

  if (!stat.n) throw ['exists']; //was 'notFound', but nModified doesn't work

  //if (!stat.nModified) throw ['exists'];

  return {gimbalId: user.device.gimbalId};
});

// delete user's device
// {
//   caller,
//   id,
//   gimbalId,
// }
S.deviceRemove = (user) => spawn(function*() {
  if (!User.validateGimbalId(user.gimbalId)) throw ['badGimbalId'];
  if (user.id !== user.caller.id) throw ['denied'];

  let stat = yield User.update(
    {_id: user.id},
    {$pull: {devices: {gimbalId: user.gimbalId}}}
  ) [catchify]();

  if (!stat.n) throw ['notFound'];
  if (!stat.nModified) throw ['notFound'];

  return {gimbalId: user.gimbalId};
});

// add user's reporter
// {
//   caller,
//   id,
//   reporter: {
//     reporterId,
//     name,
//   }
// }
S.reporterAdd = (user) => spawn(function*() {
  if (!User.validateReporterId(user.reporter.reporterId)) throw ['badReporterId'];
  if (user.id !== user.caller.id) throw ['denied'];
  let stat;

  try {
    stat = yield User.update(
      {_id: user.id, 'reporters.reporterId': {$ne: user.reporter.reporterId}},
      {$addToSet: {reporters: user.reporter}}
    ) [catchify]();
  } catch (err) {
    if (err.code === mongoose.ERROR_DUPLICATE) throw ['exists'];
    throw err;
  }

  if (!stat.n) throw ['exists']; //was 'notFound', but nModified doesn't work

  //if (!stat.nModified) throw ['exists'];

  return {reporterId: user.reporter.reporterId};
});

// delete user's reporter
// {
//   caller,
//   id,
//   reporterId,
// }
S.reporterRemove = (user) => spawn(function*() {
  if (!User.validateReporterId(user.reporterId)) throw ['badReporterId'];
  if (user.id !== user.caller.id) throw ['denied'];

  let stat = yield User.update(
    {_id: user.id},
    {$pull: {reporters: {reporterId: user.reporterId}}}
  ) [catchify]();

  if (!stat.n) throw ['notFound'];
  if (!stat.nModified) throw ['notFound'];

  return {reporterId: user.reporterId};
});

//{
//  reporterId
//}
//{
//  id
//}
S.resolveByReporter = (reporter) => spawn(function*() {
  if (!User.validateReporterId(reporter.reporterId)) throw ['badReporterId'];

  let found = yield User.findOne({
    'reporters.reporterId': reporter.reporterId,
  }, {name: 1, timezone: 1}).sort(byReporterUnique) [catchify]();

  if (!found) throw ['notFound'];
  return found [omit]('_id') [extend]({id: found._id});
});

User = module.exports = mongoose.model('User', schema);
