
const fs = require('fs');
const auth = require('./auth.js');
const { randomRoomString } = require('./utils.js');
const Room = require('./room.js');
const rateLimit = require('express-rate-limit');

const authenticationLimiter = rateLimit({
  windowMs: 1000 * 60,// 1 minute
  max: 5, // start blocking after 5 requests
  onLimitReached: function (req, res, options) {
    console.log(`[!] Rate limit on /login reached by ${req.ip}`);
  }
});
const roomDataLimiter = rateLimit({
  windowMs: 1000 * 30,// 30 seconds
  max: 50, // start blocking after 5 requests
  onLimitReached: function (req, res, options) {
    console.log(`[!] Rate limit on /api/room/:name reached by ${req.ip}`);
  }
});

function doNotCache(response) {
  response.header('Cache-Control', 'no-store');
  return response; 
}

function notFound(res) {
  res.status(404).send('<h1>Error 404: Not Found!</h1>');
}

function setUpRoutes(app, rooms, previousData) {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
  });

  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
  });

  app.get('/logout', (req, res) => {
    let token = req.cookies.sat;
    doNotCache(res);
    if (auth.validToken(token)) {
      let result = auth.clobberToken(token);
      if (result) {
        res.status(200).sendFile(__dirname + '/private/logout.html');
        return;
      }
    }
    res.status(401).sendFile(__dirname + '/private/invalidSession.html');
  });

  app.get('/:anything', (req, res) => {
    try {
      let a = fs.openSync(__dirname + '/public/' + req.params.anything, 'r');
      fs.closeSync(a);
      res.sendFile(__dirname + '/public/' + req.params.anything);
    } catch (e) {
      notFound(res);
    }
  });


  app.post('/api/authenticate', authenticationLimiter, (req, res) => {
    if (!req.body || !req.body.password || !req.body.timeStamp) {
      res.status(400).json({ success: false, reason: 'Invalid request body' });
      return;
    }
    doNotCache(res);
    let time = String(req.body.timeStamp);
    if (auth.correctPassword(req.body.password, time)) {
      let {
        name, value, options
      } = auth.newAuthCookie();
      res.cookie(name, value, options).json({ success: true });
    } else {
      res.json({ success: false });
    }
  });

  app.get('/api/rooms', roomDataLimiter, (req, res) => {
    let cookie = req.cookies.sat;
    doNotCache(res);
    if (!auth.validToken(cookie)) {
      res.status(403).json(
        { success: false, reason: 'Invalid or not present token' });
      return;
    }
    res.status(200).json(rooms);
  });

  app.get('/api/rooms/:name', roomDataLimiter, (req, res) => {
    let cookie = req.cookies.sat;
    doNotCache(res);
    if (!auth.validToken(cookie)) {
      res.status(403).json(
        { success: false, reason: 'Invalid or not present token' });
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

  app.get('/libraries/:anything', (req, res) => {
    try {
      let a = fs.openSync(
        __dirname + '/public/libraries/' + req.params.anything, 'r');
      fs.closeSync(a);
      res.sendFile(__dirname + '/public/libraries/' + req.params.anything);
    } catch (e) {
      notFound(res);
    }
  });


  app.get('/room/all', roomDataLimiter, (req, res) => {
    let cookie = req.cookies.sat;
    doNotCache(res);
    if (!auth.validToken(cookie)) {
      res.sendStatus(401);
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

  app.get('/room/new', (req, res) => {
    let roomName = randomRoomString();
    rooms[roomName] = new Room(roomName);
    doNotCache(res);
    res.redirect(`/room/in/${roomName}`);
  });

  app.get('/room/in/:w1', (req, res) => {
    let room = req.params.w1;
    doNotCache(res);
    if (!rooms[room]) {
      res.status(404).sendFile(__dirname + '/public/error.html');
    } else {
      if (!previousData[room]) {
        previousData[room] = [];
      }
      res.sendFile(__dirname + '/public/room.html');
    }
  });
}

module.exports = { setUpRoutes };
