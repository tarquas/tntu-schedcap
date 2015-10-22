'use strict';

var Main = {};

Main.fillSched = function(room) {
  Api.get('/view/sched/tntu?room=' + room, {}, function(err, sched) {try {
    if (err) {
      document.getElementById('sched-error').textContent = (
        'ERROR: ' + (err ? (err.message || err) : 'unknown') 
      );
      return;
    }
    
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
          var cweek = [['<td colspan="2"> &nbsp; </td>'], ['<td colspan="2"> &nbsp; </td>']];

          for (var w = 1; w <= 2; w++) {
            var dweek = dcell[w];
            if (!dweek) continue;

            dweek.sort(function(v1, v2) {return v1.subgroup - v2.subgroup});

            if (dweek[0].subgroup != null) {
              cweek[w - 1] = ['<td> &nbsp; </td>', '<td> &nbsp; </td>'];
            }

            if (dweek) for (var s = 0; s < dweek.length; s++) {
              var scell = dweek[s];

              cweek[w - 1][scell.subgroup ? scell.subgroup - 1 : s] = (
                '<td ' + (scell.subgroup == null ? 'colspan=2' : '') + '>' +
                scell.subject + '<br>' +
                scell.subjectType + '<br>' +
                scell.group + '' +
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
  } catch(ee) {
    document.getElementById('sched-error').textContent = (
      'ERROR: ' + (ee ? (ee.stack || ee.message || ee) : 'unknown') 
    );
  }});

  return false;
};
