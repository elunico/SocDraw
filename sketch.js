
let pinkButton;
let redButton;
let blueButton;
let greenButton;
let yellowButton;
let orangeButton;
let purpleButton;
let blackButton;
let eraserButton;
let indigoButton;
let clearButton;
let sizeSlider;
let sizeSpan;
// let colorSpan;
let canvas;
let imageP;
let saveButton;
let redSlider;
let greenSlider;
let blueSlider;
let path;
let imageShowing = false;
let currentColor = 'black';

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
  pinkButton = createButton("Pink");
  redButton = createButton("Red");
  orangeButton = createButton("Orange");
  yellowButton = createButton("Yellow");
  greenButton = createButton("Green");
  blueButton = createButton("Blue");
  indigoButton = createButton("Indigo");
  purpleButton = createButton("Purple");
  blackButton = createButton("Black");
  eraserButton = createButton("Eraser");
  createP('');
  createSpan('Red');
  redSlider = createSlider(0, 255, 127, 1);
  createSpan('Green');
  greenSlider = createSlider(0, 255, 127, 1);
  createSpan('Blue');
  blueSlider = createSlider(0, 255, 127, 1);
  redSlider.style('width', '200px');
  blueSlider.style('width', '200px');
  greenSlider.style('width', '200px');
  customColorP = createP('Color Preview');
  customColorP.style('margin-left', '5px');
  customColorP.style('font-size', '1.1em');
  customColorP.style('line-height', '1.2em');
  customColorP.style('width', '800px');
  redButton.style('width', '70px');
  pinkButton.style('width', '70px');
  greenButton.style('width', '70px');
  blueButton.style('width', '70px');
  yellowButton.style('width', '70px');
  blackButton.style('width', '70px');
  eraserButton.style('width', '70px');
  purpleButton.style('width', '70px');
  indigoButton.style('width', '70px');
  orangeButton.style('width', '70px');
  // colorSpan = createSpan('');
  createP('');
  createSpan('Line Size: ');
  sizeSlider = createSlider(1, 100, 10, 1);
  sizeSlider.style('width', '250');
  sizeSpan = createSpan('');
  createP('');
  saveButton = createButton('Save Canvas');
  imageP = createP('');
  clearButton = createButton('Clear Canvas');

  saveButton.mousePressed(() => {
    if (imageShowing) {
      saveButton.html('Save Image');
      let place = select('#save-img');
      place.elt.setAttribute('hidden', 'true');
      place.elt.src = '';
      imageP.html('');
    } else {
      saveButton.html('Hide Image');
      let url = canvas.elt.toDataURL("image/png").replace("image/png", "image/octet-stream");
      imageP.html('The image you want to save appears above the canvas. Right click (or tap and hold) and choose the save option.<br> Press the hide image button when done.')
      let place = select('#save-img');
      place.elt.src = url;
      place.elt.removeAttribute('hidden');
    }
    imageShowing = !imageShowing;
  });

  function colorChanger(colorName, colorArray) {
    return () => {
      currentColor = colorName;
      color = colorArray;
      fill(...color);
      stroke(...color);
      redSlider.value(color[0]);
      greenSlider.value(color[1]);
      blueSlider.value(color[2]);
      customColorP.style('background-color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`)
    }
  }

  pinkButton.mousePressed(colorChanger('pink', [255, 143, 180]));
  redButton.mousePressed(colorChanger('red', [255, 0, 0]));
  blueButton.mousePressed(colorChanger('blue', [0, 0, 255]));
  greenButton.mousePressed(colorChanger('green', [0, 255, 0]));
  yellowButton.mousePressed(colorChanger('yellow', [255, 255, 0]));
  indigoButton.mousePressed(colorChanger('indigo', [75, 0, 130]));
  purpleButton.mousePressed(colorChanger('purple', [255, 0, 255]));
  orangeButton.mousePressed(colorChanger('orange', [252, 121, 13]));
  blackButton.mousePressed(colorChanger('black', [0, 0, 0]));
  eraserButton.mousePressed(colorChanger('eraser', [255, 255, 255]));
  clearButton.mousePressed(() => {
    clearCanvas();
    console.log('socket saying clear');
    socket.emit('clear canvas', {});
  });
  redSlider.input(() => {
    currentColor = '&lt;custom&gt;';
  });
  blueSlider.input(() => {
    currentColor = '&lt;custom&gt;';
  });
  greenSlider.input(() => {
    currentColor = '&lt;custom&gt;';
  });
  strokeWeight(0);
  fill(0);
  socket.emit('setup done', {});
}

function draw() {
  lineWidth = sizeSlider.value();
  sizeSpan.html(lineWidth);
  // colorSpan.html(currentColor);
  if (currentColor === '&lt;custom&gt;') {
    let red = redSlider.value();
    let green = greenSlider.value();
    let blue = blueSlider.value();
    color = [red, green, blue];
    customColorP.style('background-color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`)
    fill(...color);
    stroke(...color);
  }
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
    strokeWeight(lineWidth);
    line(x, y, px, py);
    strokeWeight(0);
  }

  ellipse(x, y, lineWidth, lineWidth);

  return { lastX: x, lastY: y };
}

const OFFSET = 0;

function mouseDragged(event) {
  if (event.target != canvas.elt) {
    return;
  }

  let canvasOffsetTop = canvas.elt.offsetTop;
  let canvasOffsetLeft = canvas.elt.offsetLeft;

  path.x = event.x - canvasOffsetLeft + (window.scrollX ? window.scrollX - OFFSET : -OFFSET);
  path.y = event.y - canvasOffsetTop + (window.scrollY ? window.scrollY - OFFSET : -OFFSET);

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
