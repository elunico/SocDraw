const fs = require('fs');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const Room = require('./room.js');
const bp = require('body-parser');
const cookieParser = require('cookie-parser');
const auth = require('./auth.js');
const { randomRoomString, getLocalIP, trimAddress } = require('./utils.js');

const ROOM_KEEP_SECONDS = Number(process.env.ROOM_KEEP_SECONDS) || 15;

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8000;
let listener = server.listen(PORT);
// app.use(express.static('public'));

(async function () {
  let address = await getLocalIP();
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

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
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


app.post('/api/authenticate', (req, res) => {
  if (!req.body.password || !req.body.timeStamp) {
    res.status(401).json({ success: false, reason: 'Invalid request body' });
    return;
  }
  let time = String(req.body.timeStamp);
  if (auth.correctPassword(req.body.password, time)) {
    let tok = auth.nextToken(time);
    auth.registerToken(tok);
    res.cookie('sat', tok, {
      expires: new Date(Date.now() + auth.TOKEN_LIFE_MILLIS)
    }).json({ success: true });
  } else {
    res.json({ success: false })
  }
});

app.get('/room/all', function (req, res) {
  let cookie = req.cookies.sat;
  if (!auth.validToken(cookie)) {
    res.status(403).json({ success: false, reason: 'Invalid or not present token' });
    return;
  }
  res.write('<html><head><title>All Rooms</title></head><body>');
  res.write('<h1>All rooms that exist</h1><ol>');
  for (let roomName of Object.keys(rooms)) {
    res.write(`<li><a href="/api/rooms/${roomName}">${roomName}</a>  `);
    res.write(`[clients: ${rooms[roomName].numClients()}]</li>`);
  }
  res.write('</ol></body></html>');
  res.end();
});

app.get('/api/rooms', (req, res) => {
  let cookie = req.cookies.sat;
  if (!auth.validToken(cookie)) {
    res.status(403).json({ success: false, reason: 'Invalid or not present token' });
    return;
  }
  res.status(200).json(rooms);
});

app.get('/api/rooms/:name', function (req, res) {
  let cookie = req.cookies.sat;
  if (!auth.validToken(cookie)) {
    res.status(403).json({ success: false, reason: 'Invalid or not present token' });
    return;
  }
  let room = rooms[req.params.name];
  if (!room) {
    notFound(res);
  } else {
    let data = previousData[room.name];
    res.json(data);
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
  let roomName = randomRoomString();
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
  console.log(`[+] Connecting to client ${socket.id} at ${trimAddress(socket.handshake.address)}`);
  socket.on('needs assignment', function (data) {
    if (rooms[data.room]) {
      socketJoinRoom(socket, data.room);
      socket.sd_roomName = data.room;
      if (rooms[data.room].willBeDeleted()) {
        rooms[data.room].cancelDeletion();
        console.log(`[+] Room ${data.room} is no longer scheduled for deletion because someone connected to it`);
      }
      rooms[data.room].addClient(socket);
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
    previousData[roomName].push({ type: 'mouse released' });
    socket.to(roomName).emit('mouse released', {});
  });
  socket.on('flood fill', function (data) {
    previousData[roomName].push(data);
    socket.to(roomName).emit('flood fill', data);
  });
  socket.on('undo', function (data) {
    previousData[roomName].push({ type: 'undo' });
    socket.to(roomName).emit('undo');
  })
  socket.on('clear canvas', function (data) {
    socket.to(roomName).emit('clear canvas', {});
    previousData[roomName] = [];
  });
  socket.on('disconnect', function (data) {
    console.log(`[-] Client ${socket.id} disconnecting from ${trimAddress(socket.handshake.address)}`);
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

module.exports = { listener, rooms, socketJoinRoom };
