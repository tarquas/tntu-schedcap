'use strict';

var Main = {};

Main.error = function(err) {
  if (err) {
    document.getElementById('sched-error').textContent = (
      (err ? ((err.message || err) + ' ' + (err.stack || '')) : 'unknown')
    );
    return true;
  } else return false;
};

Main.fillSched = function(room) {
  Api.get('/view/sched/tntu?room=' + room, {}, function(err, sched) {try {
    if (Main.error(err)) return false;

    if (!sched.data) throw 'Розклад не знайдено';

    document.getElementById('sched-error').textContent = '';

    //document.getElementById('sched-content').textContent = (
    //  JSON.stringify(sched, null, 2)
    //);

    var table = document.getElementById('sched-table');

    for (var x = 1; x <= 5; x++) {
      var drow = sched.data[x];

      for (var y = 1; y <= 7; y++) {
        var tcell = table.rows[y].cells[x];
        var dcell = drow && drow[y];

        if (!dcell) tcell.innerHTML = '';
        else {
          var cweek = [['<td colspan="2"><div space></div></td>'], ['<td colspan="2"><div space></div></td>']];

          for (var w = 1; w <= 2; w++) {
            var dweek = dcell[w];
            if (!dweek) continue;

            dweek.sort(function(v1, v2) {return v1.subgroup - v2.subgroup});

            if (dweek[0].subgroup != null) {
              cweek[w - 1] = ['<td><div space></div></td>', '<td><div space></div></td>'];
            }

            if (dweek) for (var s = 0; s < dweek.length; s++) {
              var scell = dweek[s];

              cweek[w - 1][scell.subgroup ? scell.subgroup - 1 : s] = (
                '<td ' + (scell.subgroup == null ? 'colspan=2' : '') + '>' +
                '<div subject>' + scell.subject + '</div>' +
                '<div subject-type>' + scell.subjectType + '</div>' +
                '<div group>' + scell.group + '</div>' +
                '</td>'
              );
            }
          }
          
          var w1 = cweek[0].join('');
          var w2 = cweek[1].join('');

          tcell.innerHTML = (
            '<table class="sched-cell" width="100%" height="100%" border="1" cellspacing="0">' +
            ('<tr>' + w1 + '</tr>') +
            (w1 !== w2 ? '<tr>' + w2 + '</tr>' : '') +
            '</table>'
          );
        }
      }
    }
  } catch(ee) {Main.error(ee);}});

  return false;
};

Main.fillRooms = function() {
  Api.get('/view/sched/rooms', {}, function(err, rooms) {try {
    if (Main.error(err)) return false;
    var datalist = document.querySelector('datalist#rooms');
    datalist.innerHTML = '';

    for (var i = 0; i < rooms.data.length; i++) {
      var option = document.createElement('option');
      option.textContent = rooms.data[i];
      datalist.appendChild(option);
    }

    return false;
  } catch(ee) {Main.error(ee);}});
};

Main.fillRooms();
