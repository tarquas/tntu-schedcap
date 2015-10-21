'use strict';

module.exports = {
  httpPort: 3381,

  mongodb: (
    'mongodb://' +
    (process.env.MONGO_PORT_27017_TCP_ADDR || '127.0.0.1') +
    ':' +
    (process.env.MONGO_PORT_27017_TCP_PORT || 27017) +
    '/' +
    (process.env.MONGO_DBNAME || 'tntu-schedcap-test')
  ),
};
