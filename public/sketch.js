/* eslint-disable no-console */
/* eslint-disable no-undef */

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
let undoButton;
let sizeSlider;
let sizeSpan;
let fillBox;
let canvas;
let imageP;
let saveButton;
let redSlider;
let greenSlider;
let blueSlider;
let path;
let imageShowing = false;
let currentColor = 'black';
let canvasHistory;
let firstClear = true;

path = new Path();
let lineWidth = 10;

let color = [0, 0, 0];

function createElements() {
  createP('');
  pinkButton = createButton('Pink');
  redButton = createButton('Red');
  orangeButton = createButton('Orange');
  yellowButton = createButton('Yellow');
  greenButton = createButton('Green');
  blueButton = createButton('Blue');
  indigoButton = createButton('Indigo');
  purpleButton = createButton('Purple');
  blackButton = createButton('Black');
  eraserButton = createButton('Eraser');
  undoButton = createButton('Undo');
  createP('');
  fillBox = createCheckbox('Fill');
  createSpan('Red');
  redSlider = createSlider(0, 255, 127, 1);
  createSpan('Green');
  greenSlider = createSlider(0, 255, 127, 1);
  createSpan('Blue');
  blueSlider = createSlider(0, 255, 127, 1);
  customColorP = createP('Color Preview');
  createP('');
  createSpan('Line Size: ');
  sizeSlider = createSlider(1, 100, 10, 1);
  sizeSpan = createSpan('');
  createP('');
  saveButton = createButton('Save Canvas');
  imageP = createP('');
  clearButton = createButton('Clear Canvas');
}

function styleElements() {
  redSlider.style('width', '200px');
  blueSlider.style('width', '200px');
  greenSlider.style('width', '200px');
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
  sizeSlider.style('width', '250');
}

function registerHandlers() {
  saveButton.mousePressed(() => {
    if (imageShowing) {
      saveButton.html('Save Image');
      let place = select('#save-img');
      place.elt.setAttribute('hidden', 'true');
      place.elt.src = '';
      imageP.html('');
    } else {
      saveButton.html('Hide Image');
      let url = canvas.elt.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      imageP.html('The image you want to save appears above the canvas. Right click (or tap and hold) and choose the save option.<br> Press the hide image button when done.');
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
      customColorP.style('background-color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    };
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
  undoButton.mousePressed(() => {
    console.log('socket emits undo');
    socket.emit('undo', {});
    canvasHistory.undo();
  });
  clearButton.mousePressed(() => {
    if (clearCanvas()) {
      console.log('socket saying clear');
      socket.emit('clear canvas', {});
    }
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
}

// eslint-disable-next-line no-unused-vars
function setup() {
  pixelDensity(1);
  canvas = createCanvas(800, 600);
  canvas.style('border-style', 'solid');
  canvas.style('border-color', 'black');
  canvas.style('border-width', '1px');

  background(255);

  createElements();
  styleElements();
  registerHandlers();

  canvasHistory = new CanvasHistory(canvas, 20, 15);

  strokeWeight(0);
  fill(0);
  socket.emit('setup done', {});
}

// eslint-disable-next-line no-unused-vars
function draw() {
  lineWidth = sizeSlider.value();
  sizeSpan.html(lineWidth);
  if (currentColor === '&lt;custom&gt;') {
    let red = redSlider.value();
    let green = greenSlider.value();
    let blue = blueSlider.value();
    color = [red, green, blue];
    customColorP.style('background-color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    fill(...color);
    stroke(...color);
  }
}

function colorsEqual(pix, x, y, color) {
  let d = pixelDensity();
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let idx = 4 * ((y * d + j) * width * d + (x * d + i));
      if (pix[idx] != color[0]) return false;
      if (pix[idx + 1] != color[1]) return false;
      if (pix[idx + 2] != color[2]) return false;
      if (pix[idx + 3] != color[3]) return false;
    }
  }
  return true;
}

/**
 * @param {number} x the x coordinate to start
 * @param {number} y the y coordinate to start
 * @param {number[4]} color color that is filling
 * @param {number[4]} base color that started
 * @param {object} options optional argument containing optionally one key `transient` indicating whether data should be logged for undoing
 */
function floodFill(x, y, color, base, options) {
  options = options || {};
  if (colorsEqual(pixels, x, y, color)) {
    return;
  }
  if (!options.transient) {
    canvasHistory.willModify();
  }
  let stack = [];
  stack.push({ x, y });
  while (stack.length != 0) {
    let coord = stack.pop();
    let x = coord.x;
    let y = coord.y;
    let d = pixelDensity();
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        let idx = 4 * ((y * d + j) * width * d + (x * d + i));
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }

    if (x < width && colorsEqual(pixels, x + 1, y, base)) {
      stack.push({ x: x + 1, y: y });
      // floodFill(x + 1, y, color, base);
    }
    if (x >= 0 && colorsEqual(pixels, x - 1, y, base)) {
      stack.push({ x: x - 1, y: y });
      // floodFill(x - 1, y, color, base);
    }
    if (y < height && colorsEqual(pixels, x, y + 1, base)) {
      stack.push({ x: x, y: y + 1 });
      // floodFill(x, y, color, base);
    }
    if (y >= 0 && colorsEqual(pixels, x, y - 1, base)) {
      stack.push({ x: x, y: y - 1 });
      // floodFill(x, y - 1, color, base);
    }
  }
}

function canvasCoordinates(event) {
  let canvasOffsetTop = canvas.elt.offsetTop;
  let canvasOffsetLeft = canvas.elt.offsetLeft;
  let scrollX = window.scrollX;
  let scrollY = window.scrollY;
  let x = event.x - canvasOffsetLeft + scrollX;
  let y = event.y - canvasOffsetTop + scrollY;
  return { x, y };
}

function colorAt(x, y) {
  let idx = 4 * ((y) * width + (x));
  return [pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]];
}

function mousePressed(event) {
  if (fillBox.checked() && event.target == canvas.elt) {
    canvasHistory.willModify();
    let { x, y } = canvasCoordinates(event);
    loadPixels();
    let targetColor = [...color];
    targetColor.push(255);
    let baseColor = colorAt(x, y);
    floodFill(x, y, targetColor, baseColor);
    updatePixels();
    socket.emit('flood fill', {
      type: 'flood fill',
      x: x,
      y: y,
      color: targetColor,
      base: baseColor
    });
    // fillBox.checked(false);
  } else {
    mouseDragged(event);
  }
}

// eslint-disable-next-line no-unused-vars
function drawIncomingData(data, options) {
  options = options || {};
  let oldColor = color;
  let path = data.path;
  let oldWidth = lineWidth;
  lineWidth = data.width;
  color = data.color;
  fill(...color);
  stroke(...color);
  let p = drawData(path, { transient: options.transient });
  path = p;
  color = oldColor;
  lineWidth = oldWidth;
  fill(...color);
  stroke(...color);
}

function clearCanvas(options) {
  options = options || {};
  if (firstClear && !options.force) {
    firstClear = false;
    let doClear = confirm('Warning: Clearing the canvas cannot be undone.\nContinue Clearing Canvas? (You will not be asked again)');
    if (!doClear) {
      return false;
    }
  }
  background(255);
  canvasHistory.reset();
  return true;
}

function drawData(path, options) {
  options = options || {};
  let x = path.x;
  let y = path.y;
  let px = path.last.x;
  let py = path.last.y;

  if (!options.transient) {
    canvasHistory.willModify();
  }
  if (px && py && dist(x, y, px, py) > lineWidth / 2) {
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

  let { x, y } = canvasCoordinates(event);
  path.x = x;
  path.y = y;

  let last = drawData(path);
  let mouseData = {
    source: id,
    path: path,
    color: color,
    width: lineWidth,
    type: 'paint'
  };
  socket.emit('mouse pressed event', mouseData);
  path.last.x = last.lastX;
  path.last.y = last.lastY;
}

// eslint-disable-next-line no-unused-vars
function mouseReleased(event) {
  if (event.target == canvas.elt) {
    canvasHistory.didModify();
    path.last = { x: undefined, y: undefined };
    socket.emit('mouse released', {});
  }
}

// eslint-disable-next-line no-unused-vars
function touchEnd(event) {
  if (event.target == canvas.elt) {
    canvasHistory.didModify();
    path.last = { x: undefined, y: undefined };
    socket.emit('mouse released', {});
  }
}

function eventFromTouchEvent(e) {
  let touch = e.targetTouches[0];
  let x = touch.clientX;
  let y = touch.clientY;
  return {
    x: x, y: y, target: e.target
  };
}

// eslint-disable-next-line no-unused-vars
function touchStart(e) {
  mousePressed(eventFromTouchEvent(e));
}

// eslint-disable-next-line no-unused-vars
function touchMoved(e) {
  mouseDragged(eventFromTouchEvent(e));
}


module.exports = { colorsEqual, eventFromTouchEvent, floodFill };
