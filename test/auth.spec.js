/* eslint-disable no-undef */
const mocha = require('mocha');
const request = require('supertest');
const {expect} = require('chai');
const auth = require('../auth.js');



describe('auth.js', function() {
  after(() => {
    clearInterval(auth.TOKEN_CLEANER);
  });

  it('should have TOKEN_LIFE_MILLIS be a number', function(done) {
    expect(auth.TOKEN_LIFE_MILLIS).to.be.a('number');
    expect(auth.TOKEN_LIFE_MILLIS).to.equal(1000 * 60 * 60 * 24);
    done();
  });

  it('should return token is invalid', function(done) {
    let valid = auth.validToken('invalid-token');
    expect(valid).to.be.false;
    done();
  });

  it('should invalidate tokens', function(done) {
    let tok = 'token1';
    let tok2 = 'token2';
    auth.registerToken(tok);
    auth.registerToken(tok2);
    expect(auth.validToken(tok)).to.be.true;
    expect(auth.validToken(tok2)).to.be.true;
    auth.clobberTokens();
    expect(auth.validToken(tok)).to.be.false;
    expect(auth.validToken(tok2)).to.be.false;
    done();
  });

  it('should register token and then return valid', function(done) {
    let tok = 'token';
    auth.registerToken(tok);
    after(() => {
      auth.clobberTokens();
    });
    expect(auth.validToken(tok)).to.be.true;
    done();
  });

  it('should say password is incorrect', function(done) {
    let password = 'password';
    expect(auth.correctPassword(password, 1)).to.be.false;
    done();
  });

  it('should have TEST_PASSWORD set', function(done) {
    expect(process.env.TEST_PASSWORD).to.not.be.an('undefined');
    done();
  });

  it('should say password is correct', function(done) {
    let password = process.env.TEST_PASSWORD;
    expect(auth.correctPassword(password, 100)).to.be.true;
    done();
  });

  it('should return a 64 character string', function(done) {
    let result = auth.sha256hex('example text');
    expect(result).to.be.a('string');
    expect(result).to.have.lengthOf(64);
    done();
  });

  it('should return a valid next token', function(done) {
    let time = '100';
    let x = auth.nextToken(time);
    let expected = time +
        auth.sha256hex(process.env.PASSPHRASE + time).substring(time.length);
    expect(x).to.equal(expected);
    done();
  });
});