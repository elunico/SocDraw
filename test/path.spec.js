/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');

const Path = require('../public/path.js');


describe('path.js', function () {
  it('should have all properties', function (done) {
    let path = new Path(1, 2, 3, 4);
    expect(path.x).to.equal(1);
    expect(path.y).to.equal(2);
    expect(path.last).to.deep.equal({ x: 3, y: 4 });
    done();
  });
});
