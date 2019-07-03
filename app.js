var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8000);

function handler(req, res) {
  let p;
  if (req.url == '/') { p = __dirname + '/index.html'; }
  else { p = __dirname + req.url; }
  fs.readFile(p, function (err, data) {
    res.end(data);
  });
}


let id = 1;

io.on('connection', function (socket) {
  socket.emit('connected', { id: id++ });
  socket.on('mouse pressed event', function (data) {
    socket.emit('ack', { success: true });
    io.emit('incoming drawing', data);
  });
});
