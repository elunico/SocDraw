class Path {
  constructor(x, y, lastX, lastY) {
    this.x = x;
    this.y = y;
    this.last = {};
    this.last.x = lastX;
    this.last.y = lastY;
  }
}

try {
  module.exports = Path;
} catch (e) {
  if (e instanceof ReferenceError);
  else throw e;
}
