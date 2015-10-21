'use strict';

/* global io, Api, Cookie, Socket */

window.Socket = {name: 'socket-api'};

Socket.login = function() {
  Socket.logout();

  var chan = io.connect(Api.url, {
    path: '/notify',
    transports: ['websocket', 'polling'],
    query: {auth: Cookie.auth},
  });

  window.addEventListener('beforeunload', Socket.logout);

  chan.on('notify', Socket.gotNotify);

  chan.on('connect', function() {
    Socket.chan = chan;
  });

  chan.on('error', function(data) {
    console.log('Socket error:', data || 'unknown');
  });

  chan.on('connect_failed', function(data) {
    console.log('Socket connection error:', data || 'unknown');
  });
};

Socket.logout = function() {
  if (Socket.chan) {
    Socket.chan.close();
    Socket.chan = null;
  }
};

Socket.gotNotify = function(data) {
  void data; //TODO:
};

//Socket.chan.emit('event', data);
