/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');
const utils = require('../utils');

describe('utils.js', function () {
  it('should return local ip address', function (done) {
    utils.getLocalIP().then(addr => {
      expect(addr).to.contain('192.');
      done();
    }).catch(err => { done(err); });
  });

  it('should return a random room string of size 4', function (done) {
    let str = utils.randomRoomString();
    expect(str).to.contain('-');
    expect(str.split('-')).to.be.lengthOf(4);
    done();
  });

  describe('trimAddress', function () {
    it('should not change a address string that is already correct', function (done) {
      let s = 'Test string';
      expect(utils.trimAddress(s)).to.equal(s);
      done();
    });

    it('should not change en empty string', function (done) {
      expect(utils.trimAddress('')).to.equal('');
      done();
    });

    it('should return an address trimmed', function (done) {
      expect(utils.trimAddress('::ffff:127.0.0.1')).to.equal('127.0.0.1');
      expect(utils.trimAddress('::::ffff::0.0.0.0')).to.equal('::::ffff::0.0.0.0');
      done();
    });
  });
});
