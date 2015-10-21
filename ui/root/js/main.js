'use strict';

var Main = {};

Main.fillSched = function(room) {
  Api.get('/view/sched/tntu?room=' + room, {}, function(err, sched) {
    if (err) {
      document.getElementById('sched-error').textContent = (
        'ERROR: ' + (err ? (err.message || err) : 'unknown') 
      );
      return;
    }
    
    document.getElementById('sched-content').textContent = (
      JSON.stringify(sched, null, 2)
    );
  });

  return false;
};
