'use strict';

/* global byId, mongoose, Schema */

let Group;

let schema = new Schema({
  name: String,
}, {
  collection: 'group',
});

let byName = {name: 1};
schema.index(byName);

let S = schema.statics;

let Id = require('mongoose-hook-custom-id');

// {
//   items: [{name: String}],
//   create: Boolean
// }
// => {_name_: _item_}
S.resolve = (arg) => spawn(function*() {
  if (!arg.items.length) return {};
  let found = yield Group.find({$or: arg.items}, {name: 1}).sort(byName) [catchify]();
  let foundNames = found [mapKeys](item => item.name);

  if (arg.create) {
    let newNames = arg.items [filter](item => !(item.name in foundNames));
    newNames.forEach(item => {item._id = Id.newShortId(mongoose);});
    if (newNames.length) yield Group.create(newNames) [catchify]();
    let resolved = newNames [mapKeys](item => item.name) [extend](foundNames);
    return resolved;
  } else {
    return foundNames;
  }
});

// {
//   ids: [String]
// }
S.get = (arg) => spawn(function*() {
  if (!arg.items.length) return {};
  let found = yield Group.find({_id: {$in: arg.ids}}, {name: 1}).sort(byId) [catchify]();
  return found [mapKeys](item => item._id);
});

Group = module.exports = mongoose.model('Group', schema);
