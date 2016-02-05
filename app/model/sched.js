'use strict';

/* global spawn, catchify,
    pick, omit, keys, defaults, groupBy, mapValues,
    mongoose, Schema */

let Sched;
let Room;
let Prof;

let schema = new Schema({
  name: String,
  room: {type: String, ref: 'Room'},
  day: Number,
  time: Number,
  week: Number,
  group: {type: String, ref: 'Group'},
  subgroup: Number,
  subject: {type: String, ref: 'Subject'},
  subjectType: {type: String, ref: 'SubjectType'},
  prof: {type: String, ref: 'Prof'}
}, {
  collection: 'sched',
});

let byRoom = {name: 1, room: 1, day: 1, time: 1, week: 1};
schema.index(byRoom, {unique: true});

let byProf = {name: 1, prof: 1, day: 1, time: 1, week: 1};
schema.index(byProf);

let S = schema.statics;

// {
//   name: String, //required
//   room: String, // \_ either
//   prof: String, // /
//   day: Number,
//   time: Number,
//   week: Number,
// }
S.get = (arg) => spawn(function*() {
  if (!arg.room && !arg.prof) throw ['badArgument'];

  let queryProj = {name: 1, room: 1, prof: 1, day: 1, time: 1, week: 1};
  let query = arg [pick](queryProj [keys]()) [pick](v => v != null);

  let resolved = yield Promise.all([
    !query.room ? {} : Room.resolve({items: [{name: query.room}]}),
    !query.prof ? {} : Prof.resolve({items: [{name: query.prof}]})
  ]);

  let resolvedMap = resolved.map(item => item [map]());

  if (query.room) {
    if (!resolvedMap[0].length) return null;
    query.room = resolvedMap[0][0]._id;
  }

  if (query.prof) {
    if (!resolvedMap[1].length) return null;
    query.prof = resolvedMap[1][0]._id;
  }

  let proj = ({group: 1, subgroup: 1, subject: 1, subjectType: 1}) [defaults](queryProj);
  let sort = arg.prof ? byProf : byRoom;

  let cmd = Sched.find(query, proj).sort(sort);

  cmd.populate('group', {name: 1});
  cmd.populate('subject', {name: 1});
  cmd.populate('subjectType', {name: 1})

  if (!arg.room) cmd.populate('room', {name: 1});
  if (!arg.prof) cmd.populate('prof', {name: 1});

  let found = yield cmd.exec() [catchify]();

  let result = (
    found [groupBy](item => item.day) [mapValues](itemsByDay => (
      itemsByDay [groupBy](item => item.time) [mapValues](itemsByTime => (
        itemsByTime [groupBy](item => item.week) [mapValues](itemsByWeek => (
          itemsByWeek [map](item => ({
            room: arg.room || (item.room && item.room.name),
            group: item.group && item.group.name,
            subgroup: item.subgroup,
            subject: item.subject && item.subject.name,
            subjectType: item.subjectType && item.subjectType.name,
            prof: arg.prof || (item.prof && item.prof.name)
          }))
        ))
      ))
    ))
  );

  return result;
});

// {
//   scheds: [{
//     name: String,
//     room: String,
//     day: Number,
//     time: Number,
//     week: Number,
//     group: String,
//     subgroup: Number | null,
//     subject: String,
//     subjectType: String,
//     prof: String | null,
//   }]
// }
S.set = (arg) => spawn(function*() {
  /*if (arg.scheds.length) {
    let removes = arg.scheds.map(sched => sched [pick](byRoom [keys]()));
    yield Sched.remove({$or: removes}) [catchify]();
  }*/

  yield Sched.create(arg.scheds [filter](sched => sched.subject)) [catchify]();
});

S.clear = (arg) => spawn(function*() {
  yield Sched.remove({name: arg.name}) [catchify]();
});

// {
//   scheds: [{
//     name: String,
//     room: String,
//     day: Number,
//     time: Number,
//     week: Number
//   }],
//   prof: Prof,
// }
S.setProf = (arg) => spawn(function*() {
  if (arg.scheds.length) {
    yield Sched.update(
      {$or: arg.scheds [map](sched => sched [pick](byRoom [keys]()))},
      {$set: {prof: arg.prof}},
      {multi: true}
    ) [catchify]();
  }
});

Sched = module.exports = mongoose.model('Sched', schema);
Room = require('model/room');
Prof = require('model/prof');
