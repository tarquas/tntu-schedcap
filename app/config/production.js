'use strict';

module.exports = {
  httpPort: process.env.PORT || 81,
  mongodb: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tntu-schedcap'
};
