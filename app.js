const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const analytics = require('./analytics.js');
const { socketSetHandlers } = require("./sockets.js");
const { getLocalIP, pathDistance } = require('./utils.js');
const { setUpRoutes } = require('./routes.js');

// space for drawing data and rooms
// MUST BE KEYED BY THE SAME VALUES
// rooms[key1] should be the room corresponding to the data at previousData[key1]
let previousData = {};
let rooms = {};

const COMPACTING_INTERVAL_MILLIS = Number(process.env.COMPACTING_INTERVAL_MILLIS) || 2000;

console.log('[+] Beginning path compacting interval')
setInterval(() => {
  for (let key of Object.keys(previousData)) {
    let roomData = previousData[key];
    let i = rooms[key].lastCompactedIndex;
    let count = 0;
    while (i < roomData.length - 2) {
      let thisEvent = roomData[i];
      let nextEvent = roomData[i + 1];
      if (thisEvent.type != 'paint' || nextEvent.type != 'paint') { i++; continue; }
      if (pathDistance(thisEvent.path, nextEvent.path) < (thisEvent.width / 1.5)) {
        roomData.splice(i + 1, 1);
        /*
          if there is an event that is not a paint, then the paths are disjoint
          so its ok to just advance past them
          also note that the splice means this might go out of bounds so check for that
          also also note that we checking the event AFTER nextEvent but since
          that has already been spliced out of hte array (see above)
          we use the i+1 index not i+2
        */
        if (roomData[i + 1] && roomData[i + 1].type == 'paint') {
          roomData[i + 1].path.last.x = thisEvent.path.x
          roomData[i + 1].path.last.y = thisEvent.path.y
        }
        count++;
      } else {
        i++;
      }
    }
    rooms[key].lastCompactedIndex = i;
    if (count > 0) {
      console.log(`[*] Removed ${count} extraneous path points leaving ${roomData.length} points (compacted: ${((count / roomData.length) * 100).toFixed(2)}%) from room ${key}`)
      console.log(`[*] Room ${key} compacted through index ${i}`);
    }
  }
}, COMPACTING_INTERVAL_MILLIS);

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
