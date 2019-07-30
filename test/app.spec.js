/* eslint-disable no-undef */
const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');
const fs = require('fs');
const { listener, rooms } = require('../app');
const Room = require('../room');
const utils = require('../utils');

describe('utils', function () {
  it('should return local ip address', function (done) {
    utils.getLocalIP().then(addr => {
      expect(addr).to.contain('192.');
      done();
    }).catch(err => { throw err; });
  });

  it('should return a random room string of size 4', function (done) {
    let str = utils.randomRoomString();
    expect(str).to.contain('-');
    expect(str.split('-')).to.be.lengthOf(4);
    done();
  });
});

describe('listener', function () {
  after(() => listener.close());
  it('should return the home page', function (done) {
    request(listener).get('/').expect(200).end(function (err, res) {
      if (err) {
        throw err;
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
        throw err;
      } else {
        done();
      }
    });
  });

  it('should return library code', function (done) {
    request(listener).get('/libraries/p5.js').expect(200).end(function (err, res) {
      if (err) {
        throw err;
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
        throw err;
      } else {
        expect(Object.keys(rooms)).to.have.lengthOf(1);
        done();
      }
    });
  });
});

describe('room', function () {
  it('should be empty on start', function (done) {
    let room = new Room();
    expect(room.isEmpty()).to.be.true;
    done();
  });

  it('should contain two clients and not be empty', function (done) {
    let room = new Room();
    room.addClient({ id: 0, dummy: true });
    room.addClient({ id: 1, dummy: true });
    expect(room.numClients()).equals(2);
    expect(room.isEmpty()).to.be.false;
    done();
  });

  it('should show room is going to be deleted', function (done) {
    after(() => clearTimeout(room.deleteTimer));
    let room = new Room();
    room.deleteTimer = setTimeout(() => { throw 'Should be cancelled'; }, 10000);
    expect(room.willBeDeleted()).to.be.true;
    done();
  });

  it('should show room will not be deleted anymore', function (done) {
    let room = new Room();
    room.deleteTimer = setTimeout(() => { throw 'Should be cancelled'; }, 10000);
    room.cancelDeletion();
    expect(room.willBeDeleted()).to.be.false;
    expect(room.deleteTimer).to.be.null;
    done();
  });

  it('should contain 2 then be empty', function (done) {
    let room = new Room();
    room.addClient({ id: 0, dummy: true });
    room.addClient({ id: 1, dummy: true });
    room.removeClient(0);
    room.removeClient(1);
    expect(room.isEmpty()).to.be.true;
    done();
  });

});
