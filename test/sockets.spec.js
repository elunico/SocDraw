const mocha = require('mocha');
const request = require('supertest');
const { expect, chaiRequest } = require('chai');
const { socketJoinRoom, socketSetHandlers } = require('../sockets.js');
const Room = require('../room.js');

describe('sockets.js', () => {

  xit('should emit connected when connecting', (done) => { });

  xit('should connect and trigger connection message', (done) => { });

  xit('should join existing room on needs assignment', (done) => { });

  xit('should halt delete timer in empty room on join', (done) => { });

  xit('should receive `room removed` when connecting to non-existent or deleted room', (done) => { });

  xit('should emit disconnect when disconnecting', (done) => { });

  xit('should emit `ack`, save previous data, and emit `incoming drawing` on mouse pressed event', (done) => { });

  xit('should emit `previous data` on setup done event', (done) => { });

  xit('should push `mouse released` to previous data and emit `mouse released` on mouse released event', (done) => { });

  xit('should push and emit `undo` on undo event', (done) => { });

  xit('should emit `clear canvas` and clear all previous data on clear canvas event', (done) => { });

  xit('should set up room for deletion when only client leaves room', (done) => { });

  xit('should delete room and all previous data after timeout of empty room', (done) => { });
});
