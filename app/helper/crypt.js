'use strict';

let crypto = require('crypto');
let algorithm = 'blowfish';

let S = module.exports;

S.encrypt = function(text, password) {
  let noiseHex = parseInt(Math.random() * 0xffffff).toString(16);
  noiseHex = ('000000').substr(noiseHex.length) + noiseHex;
  let noise64 = new Buffer(noiseHex, 'hex').toString('base64');

  let cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(noise64 + text, 'base64', 'base64');
  crypted += cipher.final('base64');

  crypted = crypted.match(/^([0-9a-zA-Z\+\/]+)/)[1].replace(/\//g, '_').replace(/\+/g, '-');
  return crypted;
};

S.decrypt = function(text, password) {
  text = text.replace(/_/g, '/').replace(/\-/g, '+') + ('==').substr(0, text.length % 3);

  let decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(text, 'base64', 'base64');
  dec += decipher.final('base64');

  dec = dec.substr(4);
  return dec;
};

// {
//   user: ShortId,
//   expires: Date,
//   rev: Number
// }
S.encryptToken = function(token, password) {
  let user;

  if (token.user.length === 24) user = new Buffer(token.user, 'hex').toString('base64');
  else if (token.user.length === 16) user = token.user.replace(/_/g, '/').replace(/\-/g, '+');
  else throw new Error('Token User is invalid');

  let buf = new Buffer(6);
  buf.writeIntBE(token.expires / 86400000, 0, 3);
  buf.writeIntLE(token.rev - 0, 3, 3);

  let text = user + buf.toString('base64');

  return S.encrypt(text, password);
};

//{
//  format: null=ShortId, else a Buffer format
//}
S.decryptToken = function(digest, password, format) {
  let text = S.decrypt(digest, password);
  if (text.length !== 24) return null;
  let result = {};

  let buf = new Buffer(text.substr(16, 8), 'base64');
  result.expires = new Date(buf.readIntBE(0, 3) * 86400000);
  if (result.expires < new Date()) return null;
  result.rev = buf.readIntLE(3, 3);

  let user = text.substr(0, 16);
  if (format === 'base64') result.user = user;
  else if (format) result.user = new Buffer(user, 'base64').toString(format);
  else result.user = user.replace(/\//g, '_').replace(/\+/g, '-');

  return result;
};
