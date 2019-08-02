/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');
const Room = require('../room');

describe('room.js', function () {
  it('should be empty on start', function (done) {
    let room = new Room();
    expect(room.isEmpty()).to.be.true;
    done();
  });

  it('should contain two clients and not be empty', function (done) {
    let room = new Room();
    room.addClient({ id: 0, other: 'dummy' });
    room.addClient({ id: 1, other: 'dummy' });
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
    room.addClient({ id: 0, other: 'dummy' });
    room.addClient({ id: 1, other: 'dummy' });
    room.removeClient(0);
    room.removeClient(1);
    expect(room.isEmpty()).to.be.true;
    done();
  });

});


