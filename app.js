const fs = require('fs');
const os = require('os');
const dns = require('dns');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const Room = require('./room.js');

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

String.prototype.trimAddress = function () {
  if (this.startsWith('::ffff:')) {
    return this.substring(7);
  }
  return this;
}

const PORT = process.env.PORT || 8000;
server.listen(PORT);
app.use(express.static('public'));

(async function () {
  let address = await getLocalIP();
  console.log(`[+] Hosting server on ${address}:${PORT}`);
})();

const ROOM_LENGTH = 4;

let words = JSON.parse(fs.readFileSync('words.json')).words;
let previousData = {};
let rooms = {};


function randomRoomString() {
  let w = [];
  for (let i = 0; i < ROOM_LENGTH; i++) {
    w.push(words[Math.floor(Math.random() * words.length)]);
  }
  return w.join('-');
}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/home.html');
});

app.get('/:anything', function (req, res) {
  res.sendFile(__dirname + '/' + req.params.anything);
});

app.get('/libraries/:anything', function (req, res) {
  res.sendFile(__dirname + '/libraries/' + req.params.anything);
});

app.get('/room/new', function (req, res) {
  let roomName = randomRoomString();
  rooms[roomName] = new Room(roomName);
  res.redirect(`/room/in/${roomName}`);
});

app.get('/room/in/:w1', function (req, res) {
  let room = req.params.w1;
  if (!rooms[room]) {
    res.status(404).sendFile(__dirname + '/error.html');
  } else {
    if (!previousData[room]) {
      previousData[room] = [];
    }
    res.sendFile(__dirname + '/room.html');
  }
});

io.on('connection', (socket) => {
  console.log(`[+] Connecting to client ${socket.id} at ${socket.handshake.address.trimAddress()}`);
  socket.on('needs assignment', function (data) {
    socketJoinRoom(socket, data.room);
    socket.sd_roomName = data.room;
    rooms[data.room].addClient(socket.id);
  });
  socket.emit('connected', { id: socket.id });
});
io.on('disconnect', function (socket) {
  console.log(`[-] Disconnected from client ${socket.handleshake.address}`);

});


function socketJoinRoom(socket, roomName) {
  console.log(`[+] Socket ${socket.id} joining room ${roomName}`);
  socket.join(roomName);
  socket.on('mouse pressed event', function (data) {
    socket.to(roomName).emit('ack', { success: true });
    previousData[roomName].push(data);
    io.to(roomName).emit('incoming drawing', data);
  });
  socket.on('setup done', function (data) {
    socket.emit('previous data', { previousData: previousData[roomName] });
  });
  socket.on('mouse released', function (data) {
    io.to(roomName).emit('mouse released', {});
  });
  socket.on('clear canvas', function (data) {
    io.to(roomName).emit('clear canvas', {});
  });
  socket.on('disconnect', function (data) {
    console.log(`[-] Client ${socket.id} disconnecting from ${socket.handshake.address.trimAddress()}`);
    let room = rooms[socket.sd_roomName];
    if (room) {
      console.log(`Removing client ${socket.id} from room ${room.name}`);
      room.removeClient(socket.id);
      // TODO: why is room never cleared
      if (room.isEmpty()) {
        console.log(`Removing room ${room.name} because it is empty`);
        delete rooms[socket.sd_roomName];
      }
    }
  })
}
