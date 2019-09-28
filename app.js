const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const analytics = require('./analytics.js');
const { socketSetHandlers } = require("./sockets.js");
const { getLocalIP } = require('./utils.js');
const { setUpRoutes } = require('./routes.js');

// space for drawing data and rooms
let previousData = {};
let rooms = {};

// handle api requests and responses
app.use(express.json());

// for authenticating
app.use(cookieParser());

// logs information about requests on server-side
app.use(analytics());

// heroku port and local port
const PORT = process.env.PORT || 8000;

// start server
let listener = server.listen(PORT);

// server start message
(async function () {
  let address = await getLocalIP();
  console.log(`[+] Hosting server on ${address}:${PORT}`);
})();

// set up HTTP routes
setUpRoutes(app, rooms, previousData);


// all routes are set
// set up socket connection and disconnect handlers
// connection handler sets up handlers for each socket
socketSetHandlers(io, rooms, previousData);

module.exports = {
  listener,
  rooms
};
