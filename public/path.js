class Path {
  constructor(x, y, lastX, lastY) {
    this.x = x;
    this.y = y;
    this.last = {};
    this.last.x = lastX;
    this.last.y = lastY;
  }
}

module.exports = Path;
