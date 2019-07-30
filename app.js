const fs = require('fs');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const Room = require('./room.js');
const utils = require('./utils.js');

const ROOM_KEEP_SECONDS = Number(process.env.ROOM_KEEP_SECONDS) || 15;

String.prototype.trimAddress = function () {
  if (this.startsWith('::ffff:')) {
    return this.substring(7);
  }
  return this;
}

const PORT = process.env.PORT || 8000;
server.listen(PORT);
// app.use(express.static('public'));

(async function () {
  let address = await utils.getLocalIP();
  console.log(`[+] Hosting server on ${address}:${PORT}`);
})();

let previousData = {};
let rooms = {};

function notFound(res) {
  res.status(404).send('<h1>Error 404: Not Found!</h1>');
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/home.html');
});

app.get('/:anything', function (req, res) {
  try {
    let a = fs.openSync(__dirname + '/public/' + req.params.anything, 'r');
    fs.closeSync(a);
    res.sendFile(__dirname + '/public/' + req.params.anything);
  } catch (e) {
    notFound(res);
  }
});

app.get('/libraries/:anything', function (req, res) {
  try {
    let a = fs.openSync(__dirname + '/public/libraries/' + req.params.anything, 'r');
    fs.closeSync(a);
    res.sendFile(__dirname + '/public/libraries/' + req.params.anything);
  } catch (e) {
    notFound(res);
  }
});

app.get('/room/new', function (req, res) {
  let roomName = utils.randomRoomString();
  rooms[roomName] = new Room(roomName);
  res.redirect(`/room/in/${roomName}`);
});

app.get('/room/in/:w1', function (req, res) {
  let room = req.params.w1;
  if (!rooms[room]) {
    res.status(404).sendFile(__dirname + '/public/error.html');
  } else {
    if (!previousData[room]) {
      previousData[room] = [];
    }
    res.sendFile(__dirname + '/public/room.html');
  }
});

io.on('connection', (socket) => {
  console.log(`[+] Connecting to client ${socket.id} at ${socket.handshake.address.trimAddress()}`);
  socket.on('needs assignment', function (data) {
    if (rooms[data.room]) {
      socketJoinRoom(socket, data.room);
      socket.sd_roomName = data.room;
      if (rooms[data.room].willBeDeleted()) {
        rooms[data.room].cancelDeletion();
        console.log(`[+] Room ${data.room} is no longer scheduled for deletion because someone connected to it`);
      }
      rooms[data.room].addClient(socket.id);
      console.log(`[*] Room ${data.room} now has ${rooms[data.room].numClients()} members`);
    } else {
      socket.emit('room removed', {});
    }
  });
  socket.emit('connected', { id: socket.id });
  console.log(`[*] There are ${Object.keys(rooms).length} rooms in use`);
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
    socket.to(roomName).emit('incoming drawing', data);
  });
  socket.on('setup done', function (data) {
    socket.emit('previous data', { previousData: previousData[roomName] });
  });
  socket.on('mouse released', function (data) {
    socket.to(roomName).emit('mouse released', {});
    previousData[roomName].push({ type: 'mouse released' });
  });
  socket.on('flood fill', function (data) {
    previousData[roomName].push(data);
    socket.to(roomName).emit('flood fill', data);
  });
  socket.on('undo', function (data) {
    // console.log('socket sent undo, emitting undo to room');
    socket.to(roomName).emit('undo');
  })
  socket.on('clear canvas', function (data) {
    socket.to(roomName).emit('clear canvas', {});
    previousData[roomName] = [];
  });
  socket.on('disconnect', function (data) {
    console.log(`[-] Client ${socket.id} disconnecting from ${socket.handshake.address.trimAddress()}`);
    let room = rooms[socket.sd_roomName];
    if (room) {
      console.log(`[-] Removing client ${socket.id} from room ${room.name}`);
      room.removeClient(socket.id);
      console.log(`[*] Room ${room.name} now has ${room.numClients()} members`);
      if (room.isEmpty()) {
        console.log(`[-] Room ${room.name} is empty. Room and all data will be destroyed in ~${ROOM_KEEP_SECONDS} seconds unless someone connects to it`);
        room.deleteTimer = setTimeout(() => {
          console.log(`[-] Removing room ${room.name} because it has been empty for ~${ROOM_KEEP_SECONDS} seconds`);
          delete rooms[socket.sd_roomName];
          delete previousData[socket.sd_roomName];
          console.log(`[*] There are now ${Object.keys(rooms).length} rooms in use`);
        }, 1000 * ROOM_KEEP_SECONDS);
      }
    }
  })
}
