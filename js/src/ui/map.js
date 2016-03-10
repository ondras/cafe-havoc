import XY from "util/xy.js";
import * as command from "util/command.js";
import * as actors from "actors.js";
import player from "entity/player.js";

let level = null;
let options = {
	width: 1,
	height: 1,
	fontSize: 20,
	fontFamily: "metrickal, droid sans mono, monospace"
}
let display = new ROT.Display(options);
let center = new XY(0, 0);
let zooming = false;
let visibleRooms = [];
let memory = {};
let memories = {};

const parent = document.querySelector("#map");
parent.appendChild(display.getContainer());

// data XY to display XY; center = middle point
function dataToDisplay(xy) {
	let half = new XY(options.width, options.height).scale(0.5);

	return xy.minus(center).plus(half);
}

// display XY to data XY; middle point = center
function displayToData(xy) {
	let half = new XY(options.width, options.height).scale(0.5);

	return xy.minus(half).plus(center);
}

function fit() {
	let node = display.getContainer();
	let avail = new XY(parent.offsetWidth, parent.offsetHeight);

	let size = display.computeSize(avail.x, avail.y);
	size[0] += (size[0] % 2 ? 2 : 1);
	size[1] += (size[1] % 2 ? 2 : 1);
	options.width = size[0];
	options.height = size[1];
	display.setOptions(options);

	let current = new XY(node.offsetWidth, node.offsetHeight);
	let offset = avail.minus(current).scale(0.5);
	node.style.left = `${offset.x}px`;
	node.style.top = `${offset.y}px`;
}

function changeZoom(diff) {
	if (zooming) { return; }
	zooming = true;
	let scale = (options.fontSize + diff) / (options.fontSize);
	let delay = 200;

	let oldNode = display.getContainer();
	oldNode.style.transition = `transform ${delay}ms ease-out`;
	oldNode.style.transform = `scale(${scale})`;

	options.fontSize += diff;
	let newDisplay = new ROT.Display(options);
	let newNode = newDisplay.getContainer();

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			display = newDisplay;
			oldNode.parentNode.replaceChild(newNode, oldNode);
			fit();
			setCenter(center); // redraw all
			zooming = false;
			resolve();
		}, delay);
	});
}

function init(parent) {
	fit();
	
	window.addEventListener("resize", e => {
		fit();
		setCenter(center);
	});
}

function setLevel(l, entry) {
	actors.clear();

	if (level) { memories[level.id] = memory; }
	level = l;
	memory = memories[level.id] || {};
	visibleRooms = [];

	player.moveTo(entry, level);

	for (let xy in level.beings) {
		let b = level.beings[xy];
		actors.add(b);
	}
}

function darken(color) {
	if (!color) { return color; }
	return ROT.Color.toRGB(ROT.Color.fromString(color).map(x => x>>1));
}

function memoize(xy) {
	let key = xy.toString();
	let visual = level.cells[key].visual;
	memory[key] = {
		ch: visual.ch,
		fg: darken(visual.fg),
		bg: darken(visual.bg)
	}
	update(xy);
}

function setVisibleRooms(newlyVisibleRooms) {
	visibleRooms.forEach((room, index) => {
		let newIndex = newlyVisibleRooms.indexOf(room);
		if (newIndex > -1) { // remains visible
			newlyVisibleRooms.splice(newIndex, 1); // does not need redraw
		} else { // no longer visible
			visibleRooms[index] = null;
			room.forEach(memoize);
		}
	});

	/* prune no-more-visible rooms */
	for (let i=visibleRooms.length-1;i>=0;i--) {
		if (!visibleRooms[i]) { visibleRooms.splice(i, 1); }
	}

	newlyVisibleRooms.forEach(room => { // newly visible
		visibleRooms.push(room);
		room.forEach(xy => {
			let key = xy.toString();
			if (key in memory) { delete memory[key]; }
			update(xy);
		});
	})
}

function setCenter(newCenter) {
	center = newCenter.clone();
	display.clear();

	let xy = new XY();
	for (let i=0;i<options.width;i++) {
		xy.x = i;
		for (let j=0;j<options.height;j++) {
			xy.y = j;
			update(displayToData(xy));
		}
	}
}

function update(xy) {
	let fgVisual, bgVisual;
	if (visibleRooms.some(room => room /* before pruning in setVisibleRooms */ && room.contains(xy))) { // visible area, draw from current data
		let entity = level.getEntityAt(xy);
		if (!entity) { return; }
		fgVisual = entity.visual;
		bgVisual = level.cells[xy].visual;
	} else if (xy in memory) { // memoized area, draw from memory
		fgVisual = bgVisual = memory[xy];
	} else { // invisible area, abort
		return;
	}

	let displayXY = dataToDisplay(xy);
	display.draw(displayXY.x, displayXY.y, fgVisual.ch, fgVisual.fg, bgVisual.bg);
}

command.register("map:zoom-in", "+", () => changeZoom(+2));
command.register("map:zoom-out", "-", () => changeZoom(-2));

export { init, setLevel, setCenter, setVisibleRooms, update };
