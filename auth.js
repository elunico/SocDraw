const crypto = require('crypto');

const PASSPHRASE = process.env.PASSPHRASE;

if (!PASSPHRASE) {
  throw 'NO PASSPHRASE';
}

const TOKEN_LIFE_MILLIS = 1000 * 60 * 60 * 24;

let tokens = [];

setInterval(() => {
  console.log('[-] Pruning expired tokens');
  tokens = tokens.filter(t => t.valid);
}, TOKEN_LIFE_MILLIS);

function correctPassword(password, timeStamp) {
  let time = String(timeStamp);
  let userHash = sha256hex(password + time);
  let myHash = sha256hex(PASSPHRASE + time);
  return userHash === myHash;
}

function sha256hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}


function registerToken(t) {
  let o = { token: t, valid: true };
  setTimeout(() => {
    console.log('[-] Token expiring');
    o.valid = false;
  }, TOKEN_LIFE_MILLIS);
  tokens.push(o);
}

function validToken(c) {
  return tokens.filter(t => t.token == c && t.valid).length > 0;
}

function nextToken(timeStamp) {
  timeStamp = String(timeStamp);
  let hash = sha256hex(PASSPHRASE + timeStamp);
  return timeStamp + hash.substring(timeStamp.length);
}

module.exports = {
  correctPassword, registerToken, validToken, nextToken, sha256hex, TOKEN_LIFE_MILLIS
};
