import XY from "util/xy.js";

const TYPES = {
	"storage": 5,
	"kitchen": 4,
	"dining": 5,
	"smoking": 3,
	"pool": 3
}

const NAMES = {
	"storage": "storage room, full of food and beverages",
	"kitchen": "kitchen",
	"dining": "dining area with tables and café guests sitting around", 
	"pool": "billiard room",
	"smoking": "smoking room",
	"wc": "small restroom"
}

export default class Room {
	constructor(props) {
		this.type = "";
		this.neighbors = {
			0: false,
			1: false,
			2: false,
			3: false
		}
		this.doors = {};
		this.size = new XY(8, 5);
		this.position = new XY();

		Object.assign(this, props);
		
		if (this.type == "") {
			if (this.size.x < 9 && this.size.y < 9 && ROT.RNG.getUniform() > 0.5) {
				this.type = "wc";
			} else {
				this.type = ROT.RNG.getWeightedValue(TYPES);
			}
		}
	}
	
	toString() {
		if (this.type == "staircase-up") {
			return "room with a staircase leading up";
		} else if (this.type == "staircase-down") {
			return "room with a staircase leading down";
		} else if (this.type == "corridor") {
			let max = Math.max(this.size.x, this.size.y);
			let min = Math.min(this.size.x, this.size.y);
			if (max/min > 2) {
				return "long corridor";
			} else {
				return "short corridor";
			}
		} else {
			return NAMES[this.type] || "";
		}
	}
	
	clone() {
		return new this.constructor({
			type: this.type,
			size: this.size.clone(),
			position: this.position.clone(),
			neighbors: Object.assign({}, this.neighbors)
		});
	}

	getCenter() {
		return this.size.scale(0.5).plus(this.position);
	}

	forEach(cb) {
		for (let i=0;i<=this.size.x;i++) {
			for (let j=0;j<=this.size.y;j++) {
				let xy = new XY(this.position.x+i, this.position.y+j);
				cb(xy);
			}
		}
	}

	contains(xy) {
		return (xy.x >= this.position.x
			&& xy.x <= this.position.x+this.size.x
			&& xy.y >= this.position.y
			&& xy.y <= this.position.y+this.size.y);
	}
	
	positionNextTo(otherRoom, edge) {
		switch (edge) {
			case 0: // top
				this.align("x", otherRoom);
				this.position.y = otherRoom.position.y - this.size.y;
			break;

			case 1: // right
				this.position.x = otherRoom.position.x + otherRoom.size.x;
				this.align("y", otherRoom);
			break;

			case 2: // bottom
				this.align("x", otherRoom);
				this.position.y = otherRoom.position.y + otherRoom.size.y;
			break;

			case 3: // left
				this.position.x = otherRoom.position.x - this.size.x;
				this.align("y", otherRoom);
			break;
		}
	}
	
	mergeWith(otherRoom, edge) {
		if (otherRoom.type != this.type) { return false; }
		let prop = (edge % 2 ? "y" : "x");
		if (this.size[prop] != otherRoom.size[prop]) { return false; }

		switch (edge) {
			case 0: // top
				this.size.y += otherRoom.size.y;
				this.position.y -= otherRoom.size.y;
			break;

			case 1: // right
				this.size.x += otherRoom.size.x;
			break;

			case 2: // bottom
				this.size.y += otherRoom.size.y;
			break;

			case 3: // left
				this.size.x += otherRoom.size.x;
				this.position.x -= otherRoom.size.x;
			break;
		}
		
		return true;
	}
	
	align(prop, otherRoom) {
		let offset;
		let max = 2;
		if (this.type == "corridor" || otherRoom.type == "corridor") { max = 1; }

		switch (ROT.RNG.getUniformInt(0, max)) {
			case 0:
				offset = 0;
			break;
			
			case 1:
				offset = otherRoom.size[prop] - this.size[prop];
			break;
	
			case 2:
				offset = (otherRoom.size[prop] - this.size[prop])/2;
			break;
		}
		this.position[prop] = otherRoom.position[prop] + Math.round(offset);
	}
	
	fitsInto(rooms) {
		return !rooms.some(otherRoom => otherRoom.intersects(this));
	}
	
	intersects(otherRoom) {
		/* this is left */
		if (this.position.x + this.size.x <= otherRoom.position.x) { return false; }
		/* this is right */
		if (this.position.x >= otherRoom.position.x + otherRoom.size.x) { return false; }
		/* this is top */
		if (this.position.y + this.size.y <= otherRoom.position.y) { return false; }
		/* this is bottom */
		if (this.position.y >= otherRoom.position.y + otherRoom.size.y) { return false; }

		return true;
	}
	
	getFreeEdges() {
		return Object.keys(this.neighbors).filter(edge => !this.neighbors[edge]).map(Number);
	}

	getUsedEdges() {
		return Object.keys(this.neighbors).filter(edge => this.neighbors[edge]).map(Number);
	}
}
