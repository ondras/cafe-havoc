import generator from "./generator.js";
import decorator from "./decorator.js";
import XY from "util/xy.js";
import Room from "./room.js";

function findFurthest(rooms, start) {
	let bestDist = 0;
	let bestRoom = null;

	function visit(room, arrivedDirection, dist) {
		if (dist > bestDist) {
			bestDist = dist;
			bestRoom = room;
		}

		let edges = room.getUsedEdges();
		if (arrivedDirection !== null) {
			arrivedDirection = (arrivedDirection + 2) % 4;
			edges = edges.filter(edge => edge != arrivedDirection);
		}

		edges.forEach(edge => {
			let newRoom = room.neighbors[edge];
			visit(newRoom, edge, dist+1);
		});
	}

	visit(start, null, 0);
	return bestRoom;
}

export class Level {
	constructor() {
		this.id = Math.random().toString();
		this.cells = {};
		this.items = {};
		this.beings = {};
		this.rooms = generator(5 /*20*/);
	}
	
	getEntry() {
		let xy = this.rooms[0].position.clone();
		xy.x += Math.floor(this.rooms[0].size.x / 2);
		xy.y += this.rooms[0].size.y - 1;
		return xy;
	}

	getEntityAt(xy) {
		return this.beings[xy] || this.items[xy] || this.cells[xy];
	}
	
	getRoomsAt(xy) {
		return this.rooms.filter(room => room.contains(xy));
	}

	getVisibleRooms(xy) {
		let rooms = this.getRoomsAt(xy);
		rooms.forEach(room => {
			room.getUsedEdges().forEach(edge => {
				let doors = room.doors[edge];
				if (doors.every(door => door.blocks)) { return; } // every door closed

				let neighbor = room.neighbors[edge];
				if (rooms.indexOf(neighbor) == -1) { rooms.push(neighbor); }
			});
		});

		return rooms;
	}
}

export class BaseLevel extends Level {
	constructor(up) {
		super();

		let root = this.rooms[0];
		let leaf1 = findFurthest(this.rooms, root);
		leaf1.type = `staircase-${up ? "up" : "down"}`;

		let leaf2 = findFurthest(this.rooms, leaf1);
		leaf2.type = `badge-${up ? "damage" : "time"}`;

		decorator(this.rooms, this);
	}
}

export class CentralLevel extends Level {
	constructor() {
		super();

		let root = this.rooms[0];
		root.type = "center";

		let leaf1 = findFurthest(this.rooms, root);
		leaf1.type = "staircase-down";

		let leaf2 = findFurthest(this.rooms, leaf1);
		leaf2.type = "staircase-up";
		
		let introRoom = new Room({type:"intro", size:new XY(6, 16)});
		introRoom.positionNextTo(root, 2);
		root.neighbors[2] = introRoom;
		introRoom.neighbors[0] = root;
		
		this.rooms.shift();
		this.rooms.push(root); // move center room to the end; we need it to have all doors carved
		this.rooms.unshift(introRoom);
		decorator(this.rooms, this);
	}
}