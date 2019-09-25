/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

console.log = () => { };

const mocha = require('mocha');
const request = require('supertest');
const { expect, chaiRequest } = require('chai');
const Room = require('../room');
const fs = require('fs');
const {
  listener, rooms, socketJoinRoom
} = require('../app');

describe('app.js', function () {
  describe('integration with routes.js', function () {
    this.slow(75);
    after(() => listener.close());

    it('should send file home.html from /public', function (done) {
      request(listener).get('/home.html').expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.contain('Welcome to SocDraw');
          done();
        }
      });
    });

    it('should return the home page', function (done) {
      request(listener).get('/').expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          let text = fs.readFileSync('public/home.html');
          expect(text.toString()).equals(res.text, 'Invalid response');
          done();
        }
      });
    });

    it('should not return app.js', function (done) {
      request(listener).get('/app.js').expect(404).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('should return library code', function (done) {
      request(listener).get('/libraries/p5.minv0.9.0.js').expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.contain('function');
          done();
        }
      });
    });

    it('should send not found for non existent room and redirect to error', function (done) {
      request(listener).get('/room/in/does-not-exist-yet').expect(404, done);
    });

    it('should redirect to room and create new room', function (done) {
      expect(Object.keys(rooms)).to.have.lengthOf(0);
      request(listener).get('/room/new').expect(302).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(Object.keys(rooms)).to.have.lengthOf(1);
          let room = Object.keys(rooms)[0];
          request(listener).get(`/room/in/${room}`).expect(200).end(function (err, res) {
            if (err) {
              done(err);
            } else {
              expect(res.text).to.contain('html');
              done();
            }
          });
        }
      });
    });
  });

  describe('integration with routes.js and authentication', function () {
    it('should return 403 Forebidden with no token on rooms', function (done) {
      request(listener).get('/api/rooms').expect(403, done);
    });

    it('should return 403 Forebidden on a room that doesn\'t exist with no token', function (done) {
      request(listener).get('/api/rooms/not-found').expect(403, done);
    });

    it('should return success: false on empty authenticate', function (done) {
      request(listener).post('/api/authenticate').expect(200).end(function (err, res) {
        expect(JSON.parse(res.text).success).to.be.false;
        done();
      });
    });

    it('should not authenticate with bad password', function (done) {
      request(listener).post('/api/authenticate')
        .expect(200)
        .send({ password: 'invalid', timeStamp: new Date().getTime() })
        .end(function (err, res) {
          expect(JSON.parse(res.text).success).to.be.false;
          done();
        });
    });

    it('should not authenticate with no timeStamp', function (done) {
      request(listener).post('/api/authenticate')
        .expect(200)
        .send({ password: process.env.PASSPHRASE })
        .end(function (err, res) {
          expect(JSON.parse(res.text).success).to.be.false;
          done();
        });
    });

    // chai not supertest http ?
    it('should authenticate successfully with correct credentials', function (done) {
      let loginSession = request.agent(listener);
      loginSession.post('/api/authenticate')
        .expect(200)
        .send({ password: process.env.PASSPHRASE, timeStamp: new Date().getTime() })
        .then((res) => {
          expect(JSON.parse(res.text).success).to.be.true;
          loginSession.get('/api/rooms').expect(200).then(function (res) {
            done();
          }).catch(err => done(err));
        }).catch(err => done(err));
    });
  });

  describe('integration with sockets.js', function () {
    this.slow(15);
    class DummySocket {
      constructor() {
        this.id = 'dummy-socket-id-1';
        this.handlers = {};
        this.room = null;
      }
      on(event, callback) {
        this.handlers[event] = callback;
      }

      hasCallbackFor(event) {
        return this.handlers[event] != undefined;
      }
      join(room) {
        this.roomName = room;
      }
    }

    it('should know room name after joining room', function (done) {
      let socket = new DummySocket();
      socketJoinRoom(socket, 'test room', {}, []);
      expect(socket.roomName).to.equal('test room');
      done();
    });

    it('should have all events registered after joining room', function (done) {
      let socket = new DummySocket();
      socketJoinRoom(socket, 'test room', {}, []);
      const events = ['mouse pressed event', 'setup done', 'mouse released', 'flood fill', 'undo', 'clear canvas', 'disconnect'];
      for (let event of events) {
        expect(socket.hasCallbackFor(event)).to.be.true;
      }
      done();
    });
  });
});
