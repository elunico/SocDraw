/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');

const CanvasHistory = require('../public/canvas-history.js');

class DummyContext {
  constructor() {
    this.data = [1, 2, 3, 4];
  }

  getImageData() {
    return this.data;
  }

  putImageData(d) {
    this.data = d;
  }
}

class DummyElt {
  constructor() {
    this.context = new DummyContext();
  }

  getContext() {
    return this.context;
  }
}

class DummyCanvas {
  constructor() {
    this.elt = new DummyElt();
  }
}

const canvas = new DummyCanvas();

describe('canvas-history.js', function () {
  it('should allow a willModify', function (done) {
    let h = new CanvasHistory(canvas, 10, 20);
    h.willModify();
    done();
  });

  it('should contain two states after two willModify calls', function (done) {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    expect(h.states).to.have.lengthOf(1);
    h.willModify();
    expect(h.states).to.have.lengthOf(2);
    done();
  });

  it('should have no states after 2 willModify calls then two undo calls', function (done) {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    expect(h.states).to.have.lengthOf(1);
    h.willModify();
    expect(h.states).to.have.lengthOf(2);
    h.undo();
    expect(h.states).to.have.lengthOf(1);
    h.undo();
    expect(h.states).to.have.lengthOf(0);
    done();
  });

  it('should have 1 state after willModify then undo then willModify then willModify then undo', function (done) {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    expect(h.states).to.have.lengthOf(1);
    h.undo();
    expect(h.states).to.have.lengthOf(0);
    h.willModify();
    expect(h.states).to.have.lengthOf(1);
    h.willModify();
    expect(h.states).to.have.lengthOf(2);
    h.undo();
    expect(h.states).to.have.lengthOf(1);
    done();
  });

  it('should have 1 state after 5 calls to willModify then didModify', function (done) {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    h.willModify();
    h.willModify();
    h.willModify();
    h.willModify();
    expect(h.states).to.have.lengthOf(5);
    expect(h.last).equals(-1);
    h.didModify();
    expect(h.states).to.have.lengthOf(1);
    done();
  });

  it('should have 2 states after 4 calls to willModify then didModify then 3 willModify then didModify', function (done) {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    h.willModify();
    h.willModify();
    h.willModify();
    expect(h.states).to.have.lengthOf(4);
    expect(h.last).equals(-1);
    h.didModify();
    expect(h.states).to.have.lengthOf(1);
    h.willModify();
    h.willModify();
    h.willModify();
    expect(h.states).to.have.lengthOf(4);
    expect(h.last).equals(0);
    h.didModify();
    expect(h.states).to.have.lengthOf(2);
    done();
  });

  it('should be empty when calling reset()', (done) => {
    let h = new CanvasHistory(canvas, 10, 10);
    h.willModify();
    h.willModify();
    h.willModify();
    h.willModify();
    expect(h.states).to.have.lengthOf(4);
    expect(h.last).equals(-1);
    h.didModify();
    expect(h.states).to.have.lengthOf(1);
    h.willModify();
    h.willModify();
    h.willModify();
    expect(h.states).to.have.lengthOf(4);
    expect(h.last).equals(0);
    h.didModify();
    expect(h.states).to.have.lengthOf(2);

    h.reset();
    expect(h.canvas).to.equal(canvas);
    expect(h.rows).to.equal(10);
    expect(h.cols).to.equal(10);
    expect(h.states).to.be.empty;
    expect(h.inProgress).to.be.false;
    expect(h.last).to.equal(-1);
    expect(h.timer).to.be.null;
    expect(h.maxStates).to.equal(50);
    expect(h.timeStepMillis).to.equal(350);
    done();
  });

  it('should eliminate old states when calling limitSize() if it is overfiller', (done) => {
    let h = new CanvasHistory(canvas, 10, 10);
    for (let i = 0; i < h.maxStates + 1; i++) {
      h.willModify();
      h.didModify();
    }
    expect(h.states.length).to.equal(h.maxStates);
    done();
  });

});
