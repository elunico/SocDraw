let redButton;
let blueButton;
let greenButton;
let yellowButton;
let blackButton;
let eraserButton;
let sizeSlider;
let clearButton;
let sizeSpan;
let colorSpan;
let canvas;
let path;
let currentColor = 'black';

class Path {
  constructor(x, y, lastX, lastY) {
    this.x = x;
    this.y = y;
    this.last = {};
    this.last.x = lastX;
    this.last.y = lastY;
  }
}

path = new Path();
let lineWidth = 10;

let color = [0, 0, 0];

function setup() {
  canvas = createCanvas(800, 600);
  canvas.style('border-style', 'solid');
  canvas.style('border-color', 'black');
  canvas.style('border-width', '1px');

  background(255);
  createP('');
  redButton = createButton("Red");
  greenButton = createButton("Green");
  blueButton = createButton("Blue");
  yellowButton = createButton("Yellow");
  blackButton = createButton("Black");
  eraserButton = createButton("Eraser");
  redButton.style('width', '70px');
  greenButton.style('width', '70px');
  blueButton.style('width', '70px');
  yellowButton.style('width', '70px');
  blackButton.style('width', '70px');
  eraserButton.style('width', '70px');
  colorSpan = createSpan('');
  createP('');
  createSpan('Line Size: ');
  sizeSlider = createSlider(1, 50, 10, 1);
  sizeSpan = createSpan('');
  createP('');
  clearButton = createButton('Clear Canvas');

  redButton.mousePressed(() => {
    currentColor = 'red';
    color = [255, 0, 0];
    fill(...color);
  });
  blueButton.mousePressed(() => {
    currentColor = 'blue';
    color = [0, 0, 255];
    fill(...color);
  });
  greenButton.mousePressed(() => {
    currentColor = 'green';
    color = [0, 255, 0];
    fill(...color);
  });
  yellowButton.mousePressed(() => {
    currentColor = 'yellow';
    color = [255, 255, 0];
    fill(...color);
  });
  blackButton.mousePressed(() => {
    currentColor = 'black';
    color = [0, 0, 0];
    fill(...color);
  });
  eraserButton.mousePressed(() => {
    currentColor = 'eraser';
    color = [255, 255, 255];
    fill(...color);
  });
  clearButton.mousePressed(() => {
    clearCanvas();
    console.log('socket saying clear');
    socket.emit('clear canvas', {});
  });
  noStroke();
  fill(0);
}

function draw() {
  lineWidth = sizeSlider.value();
  sizeSpan.html(lineWidth);
  colorSpan.html(currentColor);
}

let last = { x: undefined, y: undefined };

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function mousePressed(event) {
  mouseDragged(event);
}

function drawIncomingData(data) {
  let oldColor = color;
  let path = data.path;
  let oldWidth = lineWidth;
  lineWidth = data.width;
  color = data.color;
  fill(...color);
  let p = drawData(path);
  path = p;
  color = oldColor;
  lineWidth = oldWidth;
  fill(...color);
}

function clearCanvas() {
  background(255);
}

function drawData(path) {
  let x = path.x // - 6;
  let y = path.y // - 6;
  let px = path.last.x;
  let py = path.last.y;

  if (px && py && distance(x, y, px, py) > lineWidth / 2) {
    stroke(...color);
    strokeWeight(lineWidth);
    line(x, y, px, py);
    strokeWeight(0);
  }

  ellipse(x, y, lineWidth, lineWidth);

  return { lastX: x, lastY: y };
}

function mouseDragged(event) {
  if (event.target != canvas.elt) {
    return;
  }
  path.x = event.x + (window.scrollX ? window.scrollX - 10 : -10);
  path.y = event.y + (window.scrollY ? window.scrollY - 10 : -10);

  let last = drawData(path);
  let mouseData = {
    source: id,
    path: path,
    color: color,
    width: lineWidth
  };
  socket.emit('mouse pressed event', mouseData);
  path.last.x = last.lastX;
  path.last.y = last.lastY;
}

function mouseReleased(event) {
  path.last = { x: undefined, y: undefined };
  socket.emit('mouse released', {});
}

function touchEnd(event) {
  path.last = { x: undefined, y: undefined };
  socket.emit('mouse released', {});
}

function eventFromTouchEvent(e) {
  let touch = e.targetTouches[0];
  if (!touch.target) {
    return;
  }
  let x = touch.clientX;
  let y = touch.clientY;
  return {
    x: x, y: y, target: e.target
  };
}

function touchStart(e) {
  mousePressed(eventFromTouchEvent(e));
}

function touchMoved(e) {
  mouseDragged(eventFromTouchEvent(e));
}
