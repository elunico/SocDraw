const dns = require('dns');
const os = require('os');
const fs = require('fs');
const ROOM_LENGTH = 4;

const words = JSON.parse(fs.readFileSync('words.json')).words;

async function getLocalIP() {
  return new Promise((resolve, reject) => {
    dns.lookup(os.hostname(), function (err, add, fam) {
      if (err) {
        reject(err);
      } else {
        resolve(add);
      }
    });
  });
}

function randomRoomString() {
  let w = [];
  for (let i = 0; i < ROOM_LENGTH; i++) {
    w.push(words[Math.floor(Math.random() * words.length)]);
  }
  return w.join('-');
}

module.exports = { randomRoomString, getLocalIP }