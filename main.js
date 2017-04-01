//ID of the canvas element to draw simulator on
var CANVAS_ID = "physics_cart_sim_main_canvas";
//The dimensions of the cart as a percentage of the canvas width
var CART_WIDTH = .125;
var CART_HEIGHT = .04;
var CART_MASS = 5; //kg
//Percentage of the cart on each side that should register a push
//Should not be greater than .5
var HITBOX_RATIO = .5;
//Maximum force of the push. Scales up or down depending on how far into the cart the pointer is.
var PUSH_FORCE = 25; //N
//Font size as a percentage of screen height
var FONT_RATIO = .025;
var LABEL_FONT_RATIO = .015;
//Number of meters wide the canvas is
var SCALE = 35;
//Percentage of the width / height the tick marks on the histogram should take up
var TICK_RATIO = .02;
//Histogram colors
var HISTOGRAM_POSITIVE = "blue";
var HISTOGRAM_NEGATIVE = "maroon";
var HISTOGRAM_OUTLINE = "blue";

var canvas;
var height;
var width;
var dpi_ratio;

var cart = {};

//Pointer image by Viktor Fedyuk
var pointerImg = new Image();
pointerImg.src = "pointer.svg";
console.log("Pointer image provided by Viktor Fedyuk");

var mousePos = {x: 0, y: 0};

//Keeps track of the time of the last update
var lastUpdate;

var histogram = [];

window.onload = init;

function init() {
	canvas = document.getElementById(CANVAS_ID).getContext("2d");

	hiDefCanvas();

	width = canvas.canvas.width;// = document.body.clientWidth;
	height = canvas.canvas.height;// = document.body.clientHeight;

	cart.width = width * CART_WIDTH;
	cart.height = height * CART_HEIGHT;
	cart.velocity = 0;
	cart.acceleration = 0;
	cart.mass = CART_MASS;

	//Keep track of the mouse
	canvas.canvas.addEventListener("mousemove", mouseHandler);

	//Cart should start in the middle
	cart.x = width / 2;

	histogram.push({x: cart.x, y: 0});

	lastUpdate = (new Date).getTime();

	window.requestAnimationFrame(update);
}

//Corrects for high-DPI monitors, making text look smooth
function hiDefCanvas() {
	var dpr = window.devicePixelRatio || 1,
        bsr = canvas.webkitBackingStorePixelRatio ||
              canvas.mozBackingStorePixelRatio ||
              canvas.msBackingStorePixelRatio ||
              canvas.oBackingStorePixelRatio ||
              canvas.backingStorePixelRatio || 1;

    dpi_ratio = dpr / bsr;
    canvas.canvas.style.width = canvas.canvas.width;
    canvas.canvas.style.height = canvas.canvas.height;
    canvas.canvas.width *= dpi_ratio;
    canvas.canvas.height *= dpi_ratio;
}

function update() {
	updatePhysics();
	draw();

	window.requestAnimationFrame(update);
}

//Main physics function
function updatePhysics() {
	//Keep track of where the simulator portion starts and ends
	var top = height / 2;
	var simHeight = height / 5;

	var currentTime = new Date;
	var timePassed = currentTime.getTime() - lastUpdate;
	lastUpdate = currentTime.getTime();

	var push = 0;

	if(mousePos.x > cart.x - cart.width / 2 && mousePos.x < cart.x + cart.width / 2
		&& mousePos.y < top + simHeight * (4 / 5) - cart.height * .1 && mousePos.y > top + simHeight * (4 / 5) - cart.height * 1.1) {
		
		//Left push
		if(mousePos.x < cart.x - cart.width / 2 + cart.width * HITBOX_RATIO) {
			//Scale up to maximum based on how far into the hitbox the pointer is
			push += PUSH_FORCE / (cart.width * HITBOX_RATIO / (mousePos.x - (cart.x - cart.width / 2)));
		}
		//Right push
		else if (mousePos.x > cart.x + cart.width / 2 - cart.width * HITBOX_RATIO) {
			push -= PUSH_FORCE / (cart.width * HITBOX_RATIO / ((cart.x + cart.width / 2) - mousePos.x));
		}

	}

	cart.acceleration = push / cart.mass;

	cart.velocity += cart.acceleration * timePassed / 1000;

	cart.x += cart.velocity * timePassed / 1000 * (width / SCALE);

	updateHistogram(cart.x, push * cart.velocity / Math.abs(cart.velocity));
}

//Adds a new point to the histogram
function updateHistogram(x, y) {
	if(histogram[histogram.length - 1].x == x) return;
	if(x > width || x < 0) return;

	if(histogram.length > 1) {
		//If the previous two points are the same y value, then overwrite the previous one with the new one
		if(histogram[histogram.length - 1].y == y && histogram[histogram.length - 2].y == y) {
			histogram[histogram.length - 1].x = x;
			return;
		}
	}

	histogram.push({x: x, y: y});
}

function draw() {
	canvas.clearRect(0, 0, width, height);

	canvas.font = "12pt Calibri";
	canvas.fillStyle = "black";

	drawGraph();
	drawSimulator();
	drawMeters();
}

function drawGraph() {
	var top = 0;
	var graphHeight = height / 2;
	var start = histogram[0];
	var end = histogram[histogram.length - 1];
	var positive = true;

	var widthModifier = .85;
	var heightModifier = .825;

	var histoLoc = {
		x: 0 + width * .1,
		y: top + graphHeight * .05,
		width: width * .85,
		height: graphHeight * heightModifier};

	//Draw histogram fill
	canvas.fillStyle = HISTOGRAM_POSITIVE;
	canvas.globalAlpha = .5;
	canvas.beginPath();
	canvas.moveTo(start.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2 - (start.y * histoLoc.height / PUSH_FORCE / 2));
	for(var point of histogram) {
		if(positive && point.y < 0) {
			canvas.lineTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2);
			canvas.closePath();
			canvas.fill();
			canvas.fillStyle = HISTOGRAM_NEGATIVE;
			canvas.beginPath();
			canvas.moveTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2);
			positive = false;
		} else if(!positive && point.y > 0) {
			canvas.lineTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2);
			canvas.closePath();
			canvas.fill();
			canvas.fillStyle = HISTOGRAM_POSITIVE;
			canvas.beginPath();
			canvas.moveTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2);
			positive = true;
		}

		canvas.lineTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2 - (point.y * histoLoc.height / PUSH_FORCE / 2));
	}

	canvas.lineTo(end.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2);
	canvas.closePath();
	canvas.fill();

	canvas.globalAlpha = 1;

	//Draw Histogram outline
	canvas.lineWidth = 1;
	canvas.strokeStyle = HISTOGRAM_OUTLINE;
	canvas.beginPath();
	canvas.moveTo(start.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2 - (start.y * histoLoc.height / PUSH_FORCE / 2));
	for(var point of histogram) {
		canvas.lineTo(point.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2 - (point.y * histoLoc.height / PUSH_FORCE / 2));
	}
	canvas.stroke();

	//Draw graph outline
	canvas.lineWidth = 1;
	canvas.strokeStyle = "black";
	canvas.strokeRect(histoLoc.x, histoLoc.y, histoLoc.width, histoLoc.height);

	//Axis labels
	canvas.font = height * FONT_RATIO + "px Courier New";
	canvas.fillStyle = "black";
	canvas.fillText("Position (m)", histoLoc.x + histoLoc.width / 2 - canvas.measureText("Position (m)").width / 2, histoLoc.y + histoLoc.height * 1.1);

	canvas.save();
	//Move to where I want to print the Y axis label, and then rotate so I don't have to do any complicated coordinate math
	canvas.translate(width * .03, histoLoc.y + histoLoc.height / 2 + canvas.measureText("|F|cos(" + String.fromCharCode(952) + ") (N)").width / 2);
	canvas.rotate(-Math.PI / 2);
	canvas.fillText("|F|cos(" + String.fromCharCode(952) + ") (N)", 0, 0);
	canvas.restore();

	//Axis key points
	canvas.font = height * LABEL_FONT_RATIO + "px Courier New";
	//y-axis
	canvas.fillText(PUSH_FORCE.toFixed(2), histoLoc.x - canvas.measureText(PUSH_FORCE.toFixed(2)).width * 1.1, histoLoc.y + height * LABEL_FONT_RATIO / 2);
	canvas.fillText("0.00", histoLoc.x - canvas.measureText("0.00").width * 1.1, histoLoc.y + histoLoc.height / 2 + height * LABEL_FONT_RATIO / 4);
	canvas.fillText("-" + PUSH_FORCE.toFixed(2), histoLoc.x - canvas.measureText("-" + PUSH_FORCE.toFixed(2)).width * 1.1, histoLoc.y + histoLoc.height);
	//x-axis
	canvas.fillText("-" + (SCALE / 2).toFixed(2), histoLoc.x - canvas.measureText("-" + (SCALE / 2).toFixed(2)).width / 2, histoLoc.y + histoLoc.height + height * LABEL_FONT_RATIO);
	canvas.fillText("-" + (SCALE / 4).toFixed(2), histoLoc.x + histoLoc.width / 4 - canvas.measureText("-" + (SCALE / 4).toFixed(2)).width / 2, histoLoc.y + histoLoc.height + height * LABEL_FONT_RATIO);
	canvas.fillText("0.00", histoLoc.x + histoLoc.width / 2 - canvas.measureText("0.00").width / 2, histoLoc.y + histoLoc.height + height * LABEL_FONT_RATIO);
	canvas.fillText((SCALE / 4).toFixed(2), histoLoc.x + histoLoc.width * .75 - canvas.measureText((SCALE / 4).toFixed(2)).width / 2, histoLoc.y + histoLoc.height + height * LABEL_FONT_RATIO);
	canvas.fillText((SCALE / 2).toFixed(2), histoLoc.x + histoLoc.width - canvas.measureText((SCALE / 2).toFixed(2)).width / 2, histoLoc.y + histoLoc.height + height * LABEL_FONT_RATIO);

	//Draw key point tick marks
	canvas.strokeStyle = "black";

	//y-axis
	canvas.beginPath();
	canvas.moveTo(histoLoc.x, histoLoc.y + histoLoc.height * .25);
	canvas.lineTo(histoLoc.x + histoLoc.width * TICK_RATIO / 2, histoLoc.y + histoLoc.height / 4);
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x, histoLoc.y + histoLoc.height * .5);
	canvas.lineTo(histoLoc.x + histoLoc.width * TICK_RATIO, histoLoc.y + histoLoc.height / 2);
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x, histoLoc.y + histoLoc.height * .75);
	canvas.lineTo(histoLoc.x + histoLoc.width * TICK_RATIO / 2, histoLoc.y + histoLoc.height * .75);
	canvas.stroke();

	//x-axis
	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .125, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .125, histoLoc.y + histoLoc.height * (1 - TICK_RATIO / 2));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .25, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .25, histoLoc.y + histoLoc.height * (1 - TICK_RATIO));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .375, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .375, histoLoc.y + histoLoc.height * (1 - TICK_RATIO / 2));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .5, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .5, histoLoc.y + histoLoc.height * (1 - TICK_RATIO));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .625, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .625, histoLoc.y + histoLoc.height * (1 - TICK_RATIO / 2));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .75, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .75, histoLoc.y + histoLoc.height * (1 - TICK_RATIO));
	canvas.stroke();

	canvas.beginPath();
	canvas.moveTo(histoLoc.x + histoLoc.width * .875, histoLoc.y + histoLoc.height);
	canvas.lineTo(histoLoc.x + histoLoc.width * .875, histoLoc.y + histoLoc.height * (1 - TICK_RATIO / 2));
	canvas.stroke();

	//Draw cursor
	canvas.fillStyle = "red";
	canvas.beginPath();
	canvas.arc(end.x * widthModifier + histoLoc.x, histoLoc.y + histoLoc.height / 2 - (end.y * histoLoc.height / PUSH_FORCE / 2), height * .005, 0, 2 * Math.PI);
	canvas.fill();

	//Draw Border
	canvas.strokeStyle = "black";
	canvas.lineWidth = 2;
	canvas.strokeRect(0 + canvas.lineWidth / 2, top + canvas.lineWidth / 2, width - canvas.lineWidth, graphHeight - canvas.lineWidth);
}

function drawSimulator() {
	//Keep track of where the simulator portion starts and ends
	var top = height / 2;
	var simHeight = height / 5;

	//Draw Pointer
	//How far to offset the pointer image to line up with the tip of the finger
	var offsetX = width / 9;
	var offsetY = height / 27;

	var drawPos = {x: mousePos.x, y: mousePos.y};

	//Clamp the pointer to our simulator
	if(drawPos.y < top) {
		drawPos.y = top;
		canvas.canvas.style.cursor = "auto";
	} else if (drawPos.y > top + simHeight - simHeight / 5) {
		drawPos.y = top + simHeight;
		canvas.canvas.style.cursor = "auto";
	} else {
		canvas.canvas.style.cursor = "none";
	}

	if(drawPos.x < cart.x) {
		canvas.drawImage(pointerImg, drawPos.x - offsetX, drawPos.y - offsetY, width / 7.5, height / 7.5);
	} else {
		canvas.save();
		canvas.scale(-1, 1);

		canvas.drawImage(pointerImg, 0 - (drawPos.x + offsetX), drawPos.y - offsetY, width / 7.5, height / 7.5);

		canvas.restore();
	}

	//Draw cart
	var wheelRadius = cart.height / 5;
	
	canvas.fillStyle = "silver";
	canvas.fillRect(cart.x - cart.width / 2, top + simHeight * (4 / 5) - cart.height - cart.height * .1, cart.width, cart.height);

	canvas.fillStyle = "black";
	canvas.beginPath();
	canvas.arc(cart.x - cart.width / 2 + wheelRadius * 1.75, top + simHeight * (4 / 5) - wheelRadius, wheelRadius, 0, 2 * Math.PI);
	canvas.fill();
	canvas.beginPath();
	canvas.arc(cart.x + cart.width / 2 - wheelRadius * 1.75, top + simHeight * (4 / 5) - wheelRadius, wheelRadius, 0, 2 * Math.PI);
	canvas.fill();

	//If the pointer image is bleeding over, erase the bottom portion
	if(drawPos.y - offsetY + height / 7.5 > top + simHeight) {
		canvas.clearRect(0, top + simHeight, width, height - top - simHeight);
	}
	
	//Draw table
	canvas.fillStyle = "grey";
	canvas.fillRect(0, top + simHeight * (4 / 5), width, simHeight / 5);

	//Instructions
	canvas.fillStyle = "black";
	canvas.font = height * FONT_RATIO + "px Verdana";
	canvas.fillText( "Push Cart Left and Right", width / 2 - canvas.measureText("Push Cart Left and Right").width / 2, top + simHeight / 5);

	//Border
	canvas.strokeStyle = "black";
	canvas.lineWidth = 2;
	canvas.strokeRect(0 + canvas.lineWidth / 2, top, width - canvas.lineWidth, simHeight);

	
}

function drawMeters() {
	drawVelocityMeter();
	drawEnergyMeter();
}

function drawVelocityMeter() {
	var top = height * .7;
	var left = 0;
	var velocityHeight = height * .3;

	var meterTop = top + height * .07;
	var meterHeight = velocityHeight * .75;
	var meterCenter = {x: left + width / 4, y: meterTop + meterHeight / 2};
	var meterRadius = meterHeight / 2;

	canvas.font = height * FONT_RATIO * .95 + "px Verdana";
	canvas.fillStyle = "black";
	canvas.fillText("Velocity", width / 4 - canvas.measureText("Velocity").width / 2, top + height * FONT_RATIO);
	canvas.font = height * FONT_RATIO * .95 + "px Courier New";
	canvas.fillText(cart.velocity.toFixed(2) + " m/s", width / 4 - canvas.measureText(cart.velocity.toFixed(2) + " m/s").width / 2, top + height * FONT_RATIO * 2);

	canvas.strokeStyle = "black";
	canvas.lineWidth = 2;
	canvas.beginPath();
	canvas.moveTo(meterCenter.x + meterRadius * .75 * Math.cos(5 * Math.PI / 4), meterCenter.y - meterRadius * .75 * Math.sin(5 * Math.PI / 4));
	canvas.lineTo(meterCenter.x + meterRadius * Math.sin(5 * Math.PI / 4), meterCenter.y - meterRadius * Math.cos(5 * Math.PI / 4));
	canvas.arc(meterCenter.x, meterCenter.y, meterRadius, -5 * Math.PI / 4, Math.PI / 4);
	canvas.lineTo(meterCenter.x + meterRadius * .75 * Math.cos(-Math.PI / 4), meterCenter.y - meterRadius * .75 * Math.sin(-Math.PI / 4));
	canvas.stroke();

	for(var angle = 9 * Math.PI / 8; angle > -Math.PI / 4; angle -= Math.PI / 8) {
		canvas.beginPath();
		canvas.moveTo(meterCenter.x + meterRadius * .9 * Math.cos(angle), meterCenter.y - meterRadius * .9 * Math.sin(angle));
		canvas.lineTo(meterCenter.x + meterRadius * Math.cos(angle), meterCenter.y - meterRadius * Math.sin(angle));
		canvas.stroke();
	}

	canvas.fillStyle = "black";
	canvas.beginPath();
	canvas.arc(meterCenter.x, meterCenter.y, meterRadius * .1, 0, 2 * Math.PI);
	canvas.fill();

	var maxVelocity = Math.sqrt(PUSH_FORCE * SCALE / cart.mass);
	var angleRange = 5 * Math.PI / 4 + Math.PI / 4;

	var angle = 5 * Math.PI / 4 - Math.abs(cart.velocity) / maxVelocity * angleRange;

	canvas.strokeStyle = "red";
	canvas.lineWidth = 4;
	canvas.beginPath();
	canvas.moveTo(meterCenter.x, meterCenter.y);
	canvas.lineTo(meterCenter.x + meterRadius * Math.cos(angle), meterCenter.y - meterRadius * Math.sin(angle));
	canvas.stroke();

}

function drawEnergyMeter() {
	var top = height * .7;
	var left = width / 2;
	var energyHeight = height * .3;

	canvas.font = height * FONT_RATIO * .95 + "px Verdana";
	canvas.fillStyle = "black";
	canvas.fillText("Kinetic Energy", width * .75 - canvas.measureText("Kinetic Energy").width / 2, top + height * FONT_RATIO);
	canvas.font = height * FONT_RATIO * .95 + "px Courier New";
	canvas.fillText((0.5 * cart.mass * cart.velocity * cart.velocity).toFixed(2) + " J", width * .75 - canvas.measureText((0.5 * cart.mass * cart.velocity * cart.velocity).toFixed(2) + " J").width / 2, top + height * FONT_RATIO * 2);
}

function mouseHandler(event) {
	var rect = canvas.canvas.getBoundingClientRect();
	mousePos.x = (event.clientX - rect.left) * dpi_ratio;
	mousePos.y = (event.clientY - rect.top) * dpi_ratio;
}