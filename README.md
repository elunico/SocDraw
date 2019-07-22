# SocDraw
Drawing in P5.js over sockets 

SocDraw is a program that uses [p5.js](http://p5js.org) ([source](https://github.com/processing/p5.js)) 
and [socket.io](http://socket.io) ([source](https://github.com/socketio/socket.io)) to enable 
real-time collaborative drawing using HTML5 canvas. 

Drawing is based on the idea of a 'room'. A room is a canvas, associated drawing data, and connected clients.
Rooms are identified by their name which is a string of 4 random (nice) words).

One or more clients can join a room to collaborate and draw on the same canvas, or a client 
can create a new room whose name can be shared to collaborate as well. When a client connects to a 
room, the current state of the canvas is transmitted, allowing them to pick up with the rest of the 
collaborators.

Rooms are ephemeral and generated as needed. If all clients disconnect from a room and the room remains
empty for some amount of time (a grace period
is allowed for refreshes/reconnects and the like) the drawing data and the room itself is destroyed. 
Attempts to reconnect to a room with the same name will fail. A new room will need to be created from the home page. 
