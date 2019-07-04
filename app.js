var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
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
  })
}


const PORT = 8000;
app.listen(PORT);
getLocalIP().then((address) => {
  console.log(`[+] Hosting server on ${address}:${PORT}`);
}).catch((err) => {
  console.error(err);
  throw err;
});

function handler(req, res) {
  let p = __dirname + req.url;
  if (req.url == '/') {
    p += 'index.html';
  }
  fs.readFile(p, function (err, data) {
    res.end(data);
  });
}

String.prototype.trimAddress = function () {
  if (this.startsWith('::ffff:')) {
    return this.substring(7);
  }
  return this;
}


io.on('connection', function (socket) {
  console.log(`[+] Connecting to client ${socket.id} at ${socket.handshake.address.trimAddress()}`);
  socket.emit('connected', { id: socket.id });
  socket.on('mouse pressed event', function (data) {
    socket.emit('ack', { success: true });
    io.emit('incoming drawing', data);
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
});

io.on('disconnect', function (socket) {
  console.log(`[-] Disconnected from client ${socket.handleshake.address}`);
});
