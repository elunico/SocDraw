/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');
const utils = require('../utils');

describe('utils', function () {
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
});
