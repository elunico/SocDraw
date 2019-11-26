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


function trimAddress(s) {
  if (s.startsWith('::ffff:')) {
    return s.substring(7);
  }
  return s;
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRoomString() {
  let w = [];
  for (let i = 0; i < ROOM_LENGTH; i++) {
    w.push(random(words));
  }
  return w.join('-');
}

function pathDistance(path1, path2) {
  return Math.sqrt(Math.pow(path2.x - path1.x, 2) + Math.pow(path2.y - path1.y, 2));
}

module.exports = { randomRoomString, getLocalIP, trimAddress, pathDistance }
