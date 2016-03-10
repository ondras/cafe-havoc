import XY from "util/xy.js";
import Customer from "entity/customer.js";
import Jenkins from "entity/jenkins.js";
import Cook from "entity/cook.js";
import Badge from "entity/item/badge.js";
import * as entities from "entity/library.js";
import * as items from "entity/item/library.js";
import * as rules from "rules.js";

function carvePlants(room, level, bg) {
	room.forEach(xy => {
		let entity = level.getEntityAt(xy);
		if (entity.blocks) { return; }
		
		let local = xy.minus(room.position);

		let left = (local.x == 1);
		let right = (local.x == room.size.x-1);
		let top = (local.y == 1);
		let bottom = (local.y == room.size.y-1);
		let corner = (left || right) && (top || bottom); 
		
		if (corner && ROT.RNG.getUniform() < 0.3) {
			level.cells[xy] = new entities.Plant(bg);
		}
	});
}

function carveDoor(room, level, bg, edge) {
	let otherRoom = room.neighbors[edge];
	let a = 0, b = 0;
	let positions = [];

	switch (edge) {
		case 0:
			a = Math.max(room.position.x, otherRoom.position.x) + 1;
			b = Math.min(room.position.x+room.size.x, otherRoom.position.x+otherRoom.size.x) - 1;
		break;

		case 3:
			a = Math.max(room.position.y, otherRoom.position.y) + 1;
			b = Math.min(room.position.y+room.size.y, otherRoom.position.y+otherRoom.size.y) - 1;
		break;
	}

	if ((b-a) % 2) {
		positions.push(Math.floor((a+b)/2));
		positions.push(Math.ceil((a+b)/2));
	} else {
		positions.push((a+b)/2);
	}

	positions = positions.map(pos => {
		switch (edge) {
			case 0: return new XY(pos, room.position.y); break;
			case 3: return new XY(room.position.x, pos); break;
		}
	});

	let doors = positions.map(xy => level.cells[xy] = new entities.Door(xy, bg));
	room.doors[edge] = doors;
	otherRoom.doors[(edge + 2) % 4] = doors;
}

function carveStaircase(room, level, bg, up) {
	level.cells[room.getCenter()] = new entities.Staircase(up, bg);
}

/* carve:
  - floor tiles if empty
  - walls if empty
  - top/left doors
*/
function carveCommon(room, level, bg) {
	let floor = new entities.Floor(bg);
	let wallCorner = new entities.WallCorner(bg);
	let wallH = new entities.WallH(bg);
	let wallV = new entities.WallV(bg);

	room.forEach(xy => {
		if (xy in level.cells) { return; }
		let local = xy.minus(room.position);

		let left = (local.x == 0);
		let right = (local.x == room.size.x);
		let top = (local.y == 0);
		let bottom = (local.y == room.size.y);

		if (left || right) {
			if (top || bottom) {
				level.cells[xy] = wallCorner;
			} else {
				level.cells[xy] = wallV;
			}
			return;
		} 
		
		if (top || bottom) {
			level.cells[xy] = wallH;
			return;
		}

		level.cells[xy] = floor;

	});

	if (room.neighbors[0]) { carveDoor(room, level, bg, 0); }
	if (room.neighbors[3]) { carveDoor(room, level, bg, 3); }
}

function carve(room, level) {
	let bg;

	/* pick a bg color */
	switch (room.type) {
		case "intro": bg = "#333"; break;
		case "smoking": bg = "#222"; break;
		case "wc": bg = "#224"; break;
		default:
			let base = [50, 30, 10];
			bg = ROT.Color.randomize(base, 10);
			bg = ROT.Color.toRGB(bg);
		break;
	}

	/* walls, floor, doors */
	carveCommon(room, level, bg);

	if (!(room.type in carve)) return; // FIXME implement
	carve[room.type](room, level, bg);
}

function decorate(rooms, level) {
	rooms.forEach(room => carve(room, level));
}

carve.dining = function(room, level, bg) {
	let corners = [
		new XY(2, 2),
		new XY(-2, 2),
		new XY(-2, -2),
		new XY(2, -2)
	];
	let center = room.size.scale(0.5);
	
	if (room.size.x >= 8) { 
		corners.push(new XY(center.x, 2));
		corners.push(new XY(center.x, -2));
	}

	if (room.size.y >= 8) { 
		corners.push(new XY(2, center.y));
		corners.push(new XY(-2, center.y));
	}

	let sides = [
		new XY(0, 1),
		new XY(0, -1),
		new XY(1, 0),
		new XY(-1, 0)
	];

	corners.forEach(dxy => {
		let txy = dxy.plus(room.position);
		if (dxy.x < 0) { txy.x += room.size.x; }
		if (dxy.y < 0) { txy.y += room.size.y; }
		level.cells[txy] = new entities.Table(bg);

		sides.forEach(dxy => {
			let cxy = dxy.plus(txy);
			let entity = level.getEntityAt(cxy);
			if (entity.blocks || ROT.RNG.getUniform() > rules.CUSTOMER_SPAWN_TABLE) { return; }

			let customer = new Customer();
			customer.moveTo(cxy, level);
		});
	});

	carvePlants(room, level, bg);
}

carve.kitchen = function(room, level, bg) {
	let half = room.size.scale(0.5);
	let start, diff, normal, length;

	if (room.size.x > room.size.y) { // horizontal
		start = new XY(2, half.y);
		diff = new XY(1, 0);
		length = room.size.x - 4;
	} else { // vertical
		start = new XY(half.x, 2);
		diff = new XY(0, 1);
		length = room.size.y - 4;
	}
	
	for (let i=0;i<=length;i++) {
		let xy = room.position.plus(start).plus(diff.scale(i));
		let item = new entities.Table(bg);
		item.visual.name = "kitchen appliance";
		item.visual.ch = ["#", "&"].random();
		level.cells[xy] = item;
	}
	
	room.forEach(xy => {
		let entity = level.getEntityAt(xy);
		if (entity.blocks || ROT.RNG.getUniform() > rules.COOK_SPAWN) { return; }

		let cook = new Cook();
		cook.moveTo(xy, level);
	});

	carvePlants(room, level, bg);
}

carve.corridor = function(room, level, bg) {
	carve.random(room, level, bg);
}

carve.storage = function(room, level, bg) {
	let half = room.size.scale(0.5);
	let start, diff, normal, length;

	if (room.size.x > room.size.y) { // horizontal
		start = new XY(2, half.y);
		diff = new XY(1, 0);
		length = room.size.x - 4;
	} else { // vertical
		start = new XY(half.x, 2);
		diff = new XY(0, 1);
		length = room.size.y - 4;
	}

	if (room.size.y < 6) { 
		normal = new XY(0, 0);
	} else {
		normal = new XY(-diff.y, diff.x);
	}

	for (let i=0;i<=length;i++) {
		let mid = room.position.plus(start).plus(diff.scale(i));
		let xy1 = mid.plus(new XY(normal.x, normal.y));
		let xy2 = mid.plus(new XY(-normal.x, -normal.y));
		level.cells[xy1] = new entities.Storage(bg);
		level.cells[xy2] = new entities.Storage(bg);
	}

	room.forEach(xy => {
		let entity = level.getEntityAt(xy);
		if (entity.blocks || ROT.RNG.getUniform() > rules.ITEM_SPAWN_STORAGE) { return; }

		level.items[xy] = items.create();
	});

	carvePlants(room, level, bg);
}

carve.wc = function(room, level, bg) {
	function toilet() {
		let t = new entities.Table(bg);
		t.visual.name = "toilet";
		t.visual.fg = "#fff";
		t.visual.ch = "o";
		return t;
	}
	
	function sink() {
		let s = new entities.Table(bg);
		s.visual.name = "sink";
		s.visual.fg = "#ccf";
		s.visual.ch = "o";
		return s;
	}
	
	let free = room.getFreeEdges();
	if (free.length) {
		let start, dir, count, sxy;

		switch (free[0]) {
			case 0:
				start = new XY(1, 1);
				dir = new XY(1, 0);
				count = room.size.x-1;
				sxy = new XY(room.size.x-1, room.size.y-1);
			break;

			case 1:
				start = new XY(room.size.x-1, 1);
				dir = new XY(0, 1);
				count = room.size.y-1;
				sxy = new XY(1, room.size.y-1);
			break;

			case 2:
				start = new XY(1, room.size.y-1);
				dir = new XY(1, 0);
				count = room.size.x-1;
				sxy = new XY(1, 1);
			break;

			case 3:
				start = new XY(1, 1);
				dir = new XY(0, 1);
				count = room.size.y-1;
				sxy = new XY(room.size.x-1, 1);
			break;
		}
		
		start = start.plus(room.position);
		
		for (let i=0;i<count;i+=2) {
			let xy = start.plus(dir.scale(i));
			level.cells[xy] = toilet();
		}
		
		level.cells[sxy.plus(room.position)] = sink();
		
	} else {
		let corners = [
			new XY(-1, -1),
			new XY(1, 1),
			new XY(1, -1),
			new XY(-1, 1)
		];
		
		corners.forEach(dxy => {
			let xy = dxy.plus(room.position);
			if (dxy.x < 0) { xy.x += room.size.x; }
			if (dxy.y < 0) { xy.y += room.size.y; }
			level.cells[xy] = (ROT.RNG.getUniform() > 0.75 ? sink() : toilet());
		});
	}
}

carve.pool = function(room, level, bg) {
	let size = new XY(2, 2);
	if (room.size.y > room.size.y) { size.x++; }
	if (room.size.x > room.size.y) { size.x++; }
	if (room.size.y <= 4) { size.y = 1; }
	
	let pos = room.position.plus(room.size.minus(size).scale(0.5));
	pos.x++;
	pos.y++;
	
	for (let i=0;i<size.x;i++) {
		for (let j=0;j<size.y;j++) {
			let xy = new XY(pos.x+i, pos.y+j);
			let table = new entities.Table(bg);
			table.visual.name = "billiard table";
			table.visual.fg = "#282";
			level.cells[xy] = table;
		}
	}

	carve.random(room, level, bg);
}

carve.smoking = function(room, level, bg) {
	let chairs = [
		new XY(-1, -1),
		new XY(1, 1),
		new XY(1, -1),
		new XY(-1, 1)
	];
	
	let center = room.getCenter();
	chairs.forEach(dxy => {
		let xy = center.plus(dxy);
		let chair = new entities.Table(bg);
		chair.visual.ch = "h";
		chair.visual.name = "comfortable chair";
		level.cells[xy] = chair;
	});

	carve.random(room, level, bg);
}

carve.intro = function(room, level, bg) {
	let xy = room.position.plus(new XY(1, 1));
	let floor = level.cells[xy];
	floor.visual.ch = ".";
	floor.visual.fg = "#282828";
	
	let doorXY = room.position.clone();
	doorXY.x += Math.floor(room.size.x/2);
	doorXY.y += room.size.y;
	level.cells[doorXY] = new entities.DoorHome(doorXY, bg);
}

carve.center = function(room, level, bg) {
	let corners = [
		new XY(1, 1),
		new XY(-1, 1)
	];
	let corner = corners.random();
	let xy = room.position.plus(corner);
	if (corner.x < 0) { xy.x += room.size.x; }
	if (corner.y < 0) { xy.y += room.size.y; }

	let doors = [];
	for (let dir in room.doors) {
		if (dir == 2) { continue; } // do not lock entry door
		let d = room.doors[dir];
		if (d) { doors = doors.concat(d); }
	}

	let jenkins = new Jenkins(doors);
	jenkins.moveTo(xy, level);
	
	let desk = new entities.Table(bg);;
	desk.visual.name = "desk";
	xy = xy.plus(corner);
	level.cells[xy] = desk;

	carvePlants(room, level, bg);
}

carve.random = function(room, level, bg) {
	carvePlants(room, level, bg);

	room.forEach(xy => {
		let entity = level.getEntityAt(xy);
		if (entity.blocks) { return; }
		
		if (ROT.RNG.getUniform() < rules.CUSTOMER_SPAWN_RANDOM) { 
			let customer = new Customer();
			customer.moveTo(xy, level);
		} else if (ROT.RNG.getUniform() < rules.ITEM_SPAWN_RANDOM) {
			level.items[xy] = items.create();
		} else if (ROT.RNG.getUniform() < rules.BADGE_SPAWN) {
			level.items[xy] = Badge.create();
		}
	});
}

carve["staircase-up"] = function(room, level, bg) {
	carvePlants(room, level, bg);
	carveStaircase(room, level, bg, true);
}

carve["staircase-down"] = function(room, level, bg) {
	carvePlants(room, level, bg);
	carveStaircase(room, level, bg, false);
}

carve["badge"] = function(room, level, bg) {
	carvePlants(room, level, bg);
	level.items[room.getCenter()] = Badge.create();
}

export default decorate;
