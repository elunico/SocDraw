const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const analytics = require('./analytics.js');
const { socketSetHandlers } = require("./sockets.js");
const { getLocalIP, distance } = require('./utils.js');
const { setUpRoutes } = require('./routes.js');

// space for drawing data and rooms
let previousData = {};
let rooms = {};

const pathResolution = 5;

console.log('[+] Beginning path compacting interval')
setInterval(() => {
  // console.log(Object.values(previousData).map(i => i.length))
  // console.log(Object.values(previousData).filter(i => i.type == 'paint').filter(i => i.path.last).length)
  for (let key of Object.keys(previousData)) {
    let roomData = previousData[key];
    let i = 0;
    let count = 0;
    // TODO: When the points are removed, the part of the program that draws the lines between sufficiently far away points, doesn't seem to work. It may have something to do with when the lines are drawn or possibly I'm not setting `path.last` correctly when I remove the drawing events
    while (i < roomData.length - 2) {
      let thisEvent = roomData[i];
      let nextEvent = roomData[i + 1];
      // if there is an event that is not a paint, then the paths are disjoint
      // so its ok to just advance past them
      if (thisEvent.type != 'paint' || nextEvent.type != 'paint') { i++; continue; }
      if (distance(thisEvent.path.x, thisEvent.path.y, nextEvent.path.x, nextEvent.path.y) < pathResolution) {
        roomData.splice(i + 1, 1);
        // TODO: this should search for the next 'paint' event because last is always filled in?
        // also note that the splice means this might go out of bounds so check for that
        if (roomData[i + 2] && roomData[i + 2].type == 'paint') {
          roomData[i + 2].path.last.x = thisEvent.x
          roomData[i + 2].path.last.y = thisEvent.y
        }
        count++;
      } else {
        i++;
      }
    }
    if (count > 0) {
      console.log(`[+] Removed ${count} extra path points from room ${key}`)
    }
  }
}, 2000);

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
