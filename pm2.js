//pm2 deploy:
// use `npm i -g pm2` to install pm2.
// use `node pm2` to add these `api` processes.
// use `pm2 delete api` to delete these `api` processes.

var pm2 = require('pm2');

process.env.FORCE_COLOR = 1;
process.env.NODE_ENV = 'production';

pm2.connect(function() {
  pm2.start({
    name      : 'api',
    script    : 'index.js',
    node_args : ['--harmony'],
    exec_mode : 'cluster',
    instances : 2,
    watch     : true,
    restart_delay      : 5000,
    max_memory_restart : '500M'
  }, function(err, apps) {
    pm2.disconnect();
  });
});
