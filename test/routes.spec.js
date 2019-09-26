/* eslint-disable no-undef */
const mocha = require('mocha');
const request = require('supertest');
const { expect, chaiRequest } = require('chai');
const express = require('express');
const fs = require('fs');
const cookieParser = require('cookie-parser');

if (!process.env.PASSPHRASE) {
  throw new Error('No passphrase set!');
}

const app = express();
app.use(express.json());
app.use(cookieParser());
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

  it('should return the login page', function (done) {
    request(app).get('/login').expect(200).end(function (err, res) {
      if (err) {
        done(err);
      } else {
        let text = fs.readFileSync('public/login.html');
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

  it('should authenticate successfully when sending correct password and timestamp', (done) => {
    request(app).post('/api/authenticate').send({ password: 'corsica', timeStamp: 1000 }).expect(200).expect({ success: true }).end(done);
  });

  it('should return bad request if timeStamp is not present', (done) => {
    request(app).post('/api/authenticate').send({ password: 'corsica' }).expect(400).end(done);
  });

  it('should return bad request with no password', (done) => {
    request(app).post('/api/authenticate').send({ timeStamp: 1000 }).expect(400).end(done);
  });

  it('should not authenticate successfully if password is incorrect', (done) => {
    request(app).post('/api/authenticate').send({ password: 'invalid', timeStamp: 1000 }).expect(200).expect({ success: false }).end(done);
  });

  xit('should logout successfully if an active session cookie is found', (done) => {
    let agent = request.agent(app);
    agent.post('/api/authenticate').send({ password: 'corsica', timeStamp: 1000 }).expect(200).expect({ success: true }).end(done);
    agent.get('/logout').expect(200).end(done);
    done();
  });

  it('should report unauthorized if logout when no active session is present', (done) => {
    request(app).get('/logout').expect(401).end(done);
  });

  it('should send not found for non existent room and redirect to error', function (done) {
    request(app).get('/room/in/does-not-exist-yet').expect(404, done);
  });

  xit('should send all room data as HTML when authenticated', (done) => {
    let agent = request.agent(app);
    agent.post('/api/authenticate').send({ password: 'corsica', timeStamp: 1000 }).expect(200).expect({ success: true }).end();
    agent.get('/room/all').expect(200).end(done);
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
