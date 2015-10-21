'use strict';

/* global spawn, promisify */

let Subject = require('model/subject');
let SubjectType = require('model/subject-type');
let Group = require('model/group');
let Room = require('model/room');
let Prof = require('model/prof');
let Sched = require('model/sched');

let jsdom = require('jsdom');
let iconv = require('iconv-lite');

iconv.skipDecodeWarning = true;

void Prof;

let S = module.exports;

S.config = {
  schedUrl: 'http://tntu.edu.ua/?p=uk/schedule/',

  dom: {
    encoding: 'binary',

    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false
    }
  }
};

S.text = node => iconv.decode(node.textContent, 'windows-1251').trim();

S.getFaculties = () => spawn(function*() {
  let root = yield jsdom [promisify]('env')(S.config.schedUrl, S.config.dom);

  let faculties = [].slice.call(
    root.document.querySelectorAll('#FacultiesFullList a[href]')
  ).map(node => ({
    title: S.text(node),
    schedUrl: node.href
  }));

  return faculties;
});

S.getGroups = (faculty) => spawn(function*() {
  let root = yield jsdom [promisify]('env')(faculty.schedUrl, S.config.dom);

  let groups = [].slice.call(
    root.document.querySelectorAll('#GroupsList a[href]')
  ).map(node => ({
    title: S.text(node),
    schedUrl: node.href
  }));

  return groups;
});

S.getSched = (group) => spawn(function*() {
  let root = yield jsdom [promisify]('env')(group.schedUrl, S.config.dom);
  let tabHead = root.document.querySelector('#ScheduleWeek');
  let tab = tabHead.lastChild;

  let colSpans = [].slice.call(tabHead.rows[0].cells, 1).map(cell => cell.colSpan || 1);
  let rowSpans = [];

  for (let span, rowIdx = 0; rowIdx < tab.rows.length; rowIdx += span) {
    let row = tab.rows[rowIdx];
    span = row.cells[0].rowSpan || 1;
    rowSpans.push(span);
  }

  let rowSpan;
  let rowSpanIdx = 0;
  let rowSpanIn;
  let rowSpansLeft;
  let rowSpansLeftN = 0;

  let colSpan;
  let colSpanIdx;
  let colSpanIn;

  let resultCell;
  let resultRow;
  let results = [];

  for (let y = 0; y < tab.rows.length; y++) {
    let row = tab.rows[y];

    if (rowSpansLeftN <= 0) {
      resultRow = [];
      results[rowSpanIdx] = resultRow;

      rowSpan = rowSpans[rowSpanIdx++];
      rowSpanIn = 0;
      rowSpansLeftN = 0;

      rowSpansLeft = Array(colSpans.length) [map]((v, k) => {
        let spans = rowSpan * colSpans[k];
        rowSpansLeftN += spans;
        return spans;
      });
    }

    colSpan = 0;
    colSpanIdx = 0;
    colSpanIn = 0;
    while (colSpanIdx < rowSpansLeft.length && rowSpansLeft[colSpanIdx] <= 0) colSpanIdx++;

    for (let x = rowSpanIn ? 0 : 1; x < row.cells.length; x++) {
      let cell = row.cells[x];

      if (colSpanIn >= colSpan) {
        if (colSpan) {
          do {colSpanIdx++;}
          while (colSpanIdx < rowSpansLeft.length && rowSpansLeft[colSpanIdx] <= 0);
        }

        resultCell = resultRow[colSpanIdx];
        if (!resultCell) resultRow[colSpanIdx] = resultCell = [];

        colSpan = colSpans[colSpanIdx];
        colSpanIn = 0;
      }

      let cellRowSpan = cell.rowSpan || 1;
      let cellColSpan = cell.colSpan || 1;
      let coverage = cellRowSpan * cellColSpan;

      rowSpansLeft[colSpanIdx] -= coverage;
      rowSpansLeftN -= coverage;

      let lesson = cell.querySelector('div.Lesson');
      let info = cell.querySelector('div.Info');

      if (lesson && info) {
        resultCell.push({
          week: (cellRowSpan >= rowSpan) ? null : (rowSpanIn + 1),
          subgroup: (cellColSpan >= colSpan) ? null : (colSpanIn + 1),
          subject: S.text(lesson),
          subjectType: S.text(info.firstChild),
          room: S.text(info.lastChild)
        });
      }

      colSpanIn += cell.colSpan || 1;
    }
    
    rowSpanIn++;
  }

  return results;
});

S.captureStatus = {};

// {
//   name: String,
//   onProgress: function(frac),
// }
S.captureCurrent = (arg) => spawn(function*() {
  if (typeof S.captureStatus[arg.name] === 'number') return false;

  let complete = 0;

  let progress = (frac) => spawn(function*() {
    if (frac.constructor.name === 'Number') complete += frac;
    else complete = frac;

    S.captureStatus[arg.name] = complete;
    if (arg.onProgress) yield arg.onProgress(complete);
  });

  yield progress(0);

  try {
    let preSched = [];
    let subjects = {};
    let subjectTypes = {};
    let groups = {};
    let rooms = {};

    let faculties = yield S.getFaculties();

    for (let faculty of faculties) {
      let groupsCap = yield S.getGroups(faculty);

      for (let group of groupsCap) {
        yield delay(5000);
        console.log('Capturing sched for ' + group.title);
        let captured = yield S.getSched(group);

        for (let dayIdx = 0; dayIdx < captured.length; dayIdx++) {
          let day = dayIdx + 1;
          let byDay = captured[dayIdx];
          
          for (let periodIdx = 0; periodIdx < byDay.length; periodIdx++) {
            let period = periodIdx + 1;
            let byPeriod = byDay[periodIdx];

            for (let item of byPeriod) {
              let pre = ({
                name: arg.name,
                day: day,
                time: period,
                group: group.title
              }) [defaults](item);

              subjects[pre.subject] = true;
              subjectTypes[pre.subjectType] = true;
              groups[pre.group] = true;
              rooms[pre.room] = true;

              if (pre.week == null) {
                preSched.push(({week: 1}) [defaults](pre));
                preSched.push(({week: 2}) [defaults](pre));
              } else preSched.push(pre);
            }
          }
        }

        yield progress(1 / (groupsCap.length * faculties.length));
      }
    }

    let subjectRes = yield Subject.resolve({
      items: subjects [keys]() [map](name => ({name: name})),
      create: true
    });

    let subjectTypeRes = yield SubjectType.resolve({
      items: subjectTypes [keys]() [map](name => ({name: name})),
      create: true
    });

    let groupRes = yield Group.resolve({
      items: groups [keys]() [map](name => ({name: name})),
      create: true
    });

    let roomRes = yield Room.resolve({
      items: rooms [keys]() [map](name => ({name: name})),
      create: true
    });

    for (let pre of preSched) {
      pre.subject = subjectRes[pre.subject]._id;
      pre.subjectType = subjectTypeRes[pre.subjectType]._id;
      pre.group = groupRes[pre.group]._id;
      pre.room = roomRes[pre.room]._id;
    }

    yield Sched.clear({name: arg.name});
    yield Sched.set({scheds: preSched});

    yield progress('done');
    delete S.captureStatus[arg.name];
    return true;

  } catch (err) {
    yield progress(err);
    throw err;
  }
});
