const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');
const os = require('os');
const dns = require('dns');

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

const PORT = 8000;
app.listen(PORT);

(async function() {
  let address = await getLocalIP();
  console.log(`[+] Hosting server on ${address}:${PORT}`);
})();

function handler(req, res) {
  let p = __dirname + req.url;
  if (req.url == '/') {
    p += 'index.html';
  }
  fs.readFile(p, function (err, data) {
    res.end(data);
  });
}

let previousData = [];

io.on('connection', function (socket) {
  console.log(`[+] Connecting to client ${socket.id} at ${socket.handshake.address.trimAddress()}`);
  socket.on('mouse pressed event', function (data) {
    socket.emit('ack', { success: true });
    previousData.push(data);
    io.emit('incoming drawing', data);
  });
  socket.on('setup done', function (data) {
    socket.emit('previous data', { previousData: previousData });
  });
  socket.on('mouse released', function (data) {
    io.emit('mouse released', {});
  });
  socket.on('clear canvas', function (data) {
    io.emit('clear canvas', {});
  });
  socket.on('disconnect', function (data) {
    console.log(`[-] Client ${socket.id} disconnecting from ${socket.handshake.address.trimAddress()}`);
  })
  socket.emit('connected', { id: socket.id, previousData: previousData });
});

io.on('disconnect', function (socket) {
  console.log(`[-] Disconnected from client ${socket.handleshake.address}`);
});
