const { trimAddress } = require('./utils.js');

const ROOM_KEEP_SECONDS = Number(process.env.ROOM_KEEP_SECONDS) || 15;

function socketSetHandlers(io, rooms, previousData) {
  io.on('connection', (socket) => {
    console.log(`[+] Connecting to client ${socket.id} at ${
      trimAddress(socket.handshake.address)}`);
    socket.on('needs assignment', function (data) {
      if (rooms[data.room]) {
        socketJoinRoom(socket, data.room, previousData, rooms);
        socket.sd_roomName = data.room;
        if (rooms[data.room].willBeDeleted()) {
          rooms[data.room].cancelDeletion();
          console.log(`[+] Room ${
            data.room} is no longer scheduled for deletion because someone connected to it`);
        }
        rooms[data.room].addClient(socket);
        console.log(`[*] Room ${data.room} now has ${
          rooms[data.room].numClients()} members`);
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
}

function socketJoinRoom(socket, roomName, previousData, rooms) {
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
  });
  socket.on('clear canvas', function (data) {
    socket.to(roomName).emit('clear canvas', {});
    rooms[roomName].lastCompactedIndex = 0;
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
  });
}

module.exports = { socketSetHandlers, socketJoinRoom };
