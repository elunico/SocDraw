const crypto = require('crypto');
const uuid = require('uuid/v4');

const PASSPHRASE = process.env.PASSPHRASE;

if (!PASSPHRASE) {
  throw 'NO PASSPHRASE';
}

const TOKEN_LIFE_MILLIS = 1000 * 60 * 60 * 24;

let tokens = [];

const TOKEN_CLEANER = setInterval(() => {
  console.log('[-] Pruning expired tokens');
  tokens = tokens.filter(t => t.valid);
}, TOKEN_LIFE_MILLIS);

function correctPassword(password, timeStamp) {
  let mult = Math.round(crypto.randomBytes(1)[0] / 32);
  let time = String(timeStamp);
  let userHash = sha256hex(password + time, 750 * mult);
  let myHash = sha256hex(PASSPHRASE + time, 750 * mult);
  return userHash === myHash && PASSPHRASE === password;
}

function cookieExpirationFrom(time) {
  return new Date(time + TOKEN_LIFE_MILLIS);
}

function newAuthCookie() {
  let tok = nextToken();
  registerToken(tok);
  let cookieData = {
    name: 'sat',
    value: tok,
    options: { expires: cookieExpirationFrom(Date.now()) }
  };
  return cookieData;
}

function sha256hex(s, times) {
  times = times || 1;
  let h = s;
  for (let i = 0; i < times; i++)
    h = crypto.createHash('sha256').update(h).digest('hex');
  return h;
}


function registerToken(t) {
  let o = { token: t, valid: true };
  o['timer'] = setTimeout(() => {
    console.log('[-] Token expiring');
    o.valid = false;
  }, TOKEN_LIFE_MILLIS);
  tokens.push(o);
}

function validToken(c) {
  return tokens.filter(t => t.token == c && t.valid).length > 0;
}

function nextToken() {
  return uuid();
}

function clobberToken(token) {
  for (let t of tokens) {
    if (t.token == token) {
      t.valid = false;
      clearTimeout(t.timer);
      return true;
    }
  }
  return false;
}

function clobberAllTokens() {
  tokens.forEach(t => {
    t.valid = false;
    clearTimeout(t.timer);
  });
  tokens = [];
}

module.exports = {
  correctPassword,
  newAuthCookie,
  validToken,
  sha256hex,
  clobberToken,
  TOKEN_LIFE_MILLIS,

  // testing
  TOKEN_CLEANER,
  clobberAllTokens,
  registerToken,
  nextToken
};
