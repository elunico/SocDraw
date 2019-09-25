/* eslint-disable no-undef */
const mocha = require('mocha');
const request = require('supertest');
const { expect, chaiRequest } = require('chai');
const express = require('express');
const fs = require('fs');

const app = express();
const rooms = {};
const previousData = {};

const listener = app.listen(process.env.PORT || 8001);

const { setUpRoutes } = require('../routes.js');

describe('routes.js', () => {
  before(() => {
    setUpRoutes(app, rooms, previousData);
  });

  after(() => listener.close());

  it('should send file home.html from /public', function (done) {
    request(app).get('/home.html').expect(200).end(function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(res.text).to.contain('Welcome to SocDraw');
        done();
      }
    });
  });

  it('should return the home page', function (done) {
    request(app).get('/').expect(200).end(function (err, res) {
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
    request(app).get('/app.js').expect(404).end(function (err, res) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('should return library code', function (done) {
    request(app).get('/libraries/p5.minv0.9.0.js').expect(200).end(function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(res.text).to.contain('function');
        done();
      }
    });
  });

  it('should send not found for non existent room and redirect to error', function (done) {
    request(app).get('/room/in/does-not-exist-yet').expect(404, done);
  });

  it('should redirect to room and create new room', function (done) {
    expect(Object.keys(rooms)).to.have.lengthOf(0);
    request(app).get('/room/new').expect(302).end(function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(Object.keys(rooms)).to.have.lengthOf(1);
        let room = Object.keys(rooms)[0];
        request(app).get(`/room/in/${room}`).expect(200).end(function (err, res) {
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
