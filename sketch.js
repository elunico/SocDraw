let redButton;
let blueButton;
let greenButton;
let yellowButton;
let blackButton;
let clearButton;
let canvas;



const lineWidth = 10;

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
  createP('');
  clearButton = createButton('Clear Canvas');

  redButton.mousePressed(() => {
    color = [255, 0, 0];
    fill(...color);
  });
  blueButton.mousePressed(() => {
    color = [0, 0, 255];
    fill(...color);
  });
  greenButton.mousePressed(() => {
    color = [0, 255, 0];
    fill(...color);
  });
  yellowButton.mousePressed(() => {
    color = [255, 255, 0];
    fill(...color);
  });
  blackButton.mousePressed(() => {
    color = [0, 0, 0];
    fill(...color);
  });
  clearButton.mousePressed(() => background(255));
  noStroke();
  fill(0);

}

function draw() {


}

let last = { x: undefined, y: undefined };

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function mousePressed(event) {
  mouseDragged(event);
}

function drawIncomingData(data) {
  let event = data.event;
  let last = data.last;
  color = data.color;
  drawData(event, last);
}

function drawData(event, last) {
  let x = event.x - 6;
  let y = event.y - 6;

  console.table({
    event: { x, y },
    last: { x: last.x, y: last.y }
  })

  if (distance(x, y, last.x, last.y) > lineWidth - 4) {
    stroke(...color);
    strokeWeight(lineWidth);
    line(x, y, last.x, last.y);
    strokeWeight(0);
  }

  ellipse(x, y, lineWidth, lineWidth);
  last.x = x;
  last.y = y;
}

function mouseDragged(event) {
  drawData(event, last);
  socket.emit('mouse pressed event', {
    source: id,
    event: {
      x: event.x - 6, y: event.y - 6
    },
    last: last,
    color: color
  });
}

function mouseReleased(event) {
  last = { x: undefined, y: undefined };
}

function touchMoved(event) {
  mouseDragged(event);
}
