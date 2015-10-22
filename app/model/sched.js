'use strict';

/* global spawn, catchify,
    pick, omit, keys, defaults, groupBy, mapValues,
    mongoose, Schema */

let Sched;
let Room;

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

let S = schema.statics;

// {
//   name: String, //required
//   room: String,
//   day: Number,
//   time: Number,
//   week: Number,
// }
S.getByRoom = (arg) => spawn(function*() {
  let queryProj = {name: 1, room: 1, day: 1, time: 1, week: 1};
  let query = arg [pick](queryProj [keys]());

  let resolved = (yield Room.resolve({items: [{name: query.room}]})) [map]();
  if (!resolved.length) return null;
  query.room = resolved[0]._id;

  let proj = ({group: 1, subgroup: 1, subject: 1, subjectType: 1, prof: 1}) [defaults](queryProj);
  let sort = byRoom;

  let found = yield (
    Sched.find(query, proj).sort(sort)
    .populate('group')
    .populate('subject')
    .populate('subjectType')
    .populate('prof')
    .exec() [catchify]()
  );

  let result = (
    found [groupBy](item => item.day) [mapValues](itemsByDay => (
      itemsByDay [groupBy](item => item.time) [mapValues](itemsByTime => (
        itemsByTime [groupBy](item => item.week) [mapValues](itemsByWeek => (
          itemsByWeek [map](item => ({
            room: arg.room,
            group: item.group && item.group.name,
            subgroup: item.subgroup,
            subject: item.subject && item.subject.name,
            subjectType: item.subjectType && item.subjectType.name,
            prof: item.prof && item.prof.name
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
