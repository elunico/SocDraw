const mocha = require('mocha');
const request = require('supertest');
const { expect } = require('chai');

const Path = require('../public/path.js');
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

describe('path', function () {
  it('should have all properties', function (done) {
    let path = new Path(1, 2, 3, 4);
    expect(path.x).to.equal(1);
    expect(path.y).to.equal(2);
    expect(path.last).to.deep.equal({ x: 3, y: 4 });
    done();
  });
});

describe('canvas-history', function () {
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
});
