'use strict';

let config = module.exports = {
  httpPort: 3081,
  mongodb: 'mongodb://127.0.0.1:27017/tntu-schedcap',
  secret: process.env.TOKEN_SECRET || 'abcabcabcdefdefdefABC123',
};

/* global extend */

let configEnv = process.env.NODE_ENV;

switch (configEnv) {
  case 'production': (config) [extend](require('config/production')); break;
  case 'development': (config) [extend](require('config/development')); break;
  case 'testing': (config) [extend](require('config/testing')); break;
}

if (!config.apiUrl) config.apiUrl = 'http://127.0.0.1:' + config.httpPort;
config.env = configEnv;
