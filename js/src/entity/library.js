import Base from "./base.js";
import { BaseLevel } from "level/level.js";
import * as pubsub from "util/pubsub.js";
import * as map from "ui/map.js";
import * as log from "ui/log.js";

function color() {
	let base = [[65, 65, 65], [120, 100, 80]].random();
	
	let c = ROT.Color.randomize(base, 10);
	return ROT.Color.toRGB(c);
}

export class Floor extends Base {
	constructor(bg) {
		super({bg});
	}
};

export class Table extends Base {
	constructor(bg) {
		let type = ["", "solid", "old", "shiny"].random();
		if (type) { type = `${type} `; }
		let material = ["", "wooden", "stone", "marble"].random();
		if (material) { material = `${material} `; }
		let name = `${type}${material}table`;

		super({ch:"T", fg:color(), bg, name});
		this.blocks = true;
	}
}

export class Storage extends Base {
	constructor(bg) {
		let type = ["", "old", "shiny"].random();
		if (type) { type = `${type} `; }
		let material = ["", "wooden", "metal", "plastic"].random();
		if (material) { material = `${material} `; }
		let name = ["cupboard", "cabinet"].random();
		name = `${type}${material}${name}`;

		super({ch:"8", fg:color(), bg, name});
		this.blocks = true;
	}
}

export class Plant extends Base {
	constructor(bg) {
		let name = ["ficus plant", "orchid plant", "cactus", "pot flower"].random();

		let c = ROT.Color.randomize([30, 180, 30], [10, 40, 10]);
		super({ch:"\"", fg:ROT.Color.toRGB(c), bg, name});
		this.blocks = true;
	}
}

export class Wall extends Base {
	constructor(visual) {
		visual.fg = "#555";
		visual.name = "wall";
		super(visual);
		this.blocks = true;
	}
}

export class WallCorner extends Wall {
	constructor(bg) {
		super({ch:"+", bg});
	}
}

export class WallH extends Wall {
	constructor(bg) {
		super({ch:"-", bg});
	}
}

export class WallV extends Wall {
	constructor(bg) {
		super({ch:"|", bg});
	}
}

export class Door extends Base {
	constructor(xy, bg) {
		super({fg:"#a50", bg});
		this.xy = xy;
		this.close();
		this.locked = false;
	}
	
	bump(who) {
		if (this.locked) {
			log.add("You try to open the door. The door is locked!");
			return false;
		} else {
			log.add("You open the door.");
			this.open();
			return true;
		}
	}
	
	lock() {
		this.locked = true;
	}
	
	unlock() {
		this.locked = false;
	}

	close() {
		this.blocks = true;
		this.visual.ch = "=";

		map.update(this.xy);
		pubsub.publish("visibility-change", this);
	}

	open() {
		this.blocks = false;
		this.visual.ch = "/";

		map.update(this.xy);
		pubsub.publish("visibility-change", this);
	}
}

export class DoorHome extends Door {
	constructor(xy, bg) {
		super(xy, bg);
		this.visual.fg = "#da2";
		this.lock();
	}
	
	bump() {
		log.add("This is a door to your apartment. Going home is not an option, head to the work instead!");
		return false;
	}
}

export class Staircase extends Base {
	constructor(up, bg) {
		let visual = { 
			ch: (up ? "<" : ">"),
		 	bg,
		 	fg:"#ccc",
		 	name: `staircase leading ${up ? "up" : "down"}`
		 }

		super(visual);

		this._up = up;
		this.target = {
			level: null,
			xy: null
		}
	}

	enter(currentLevel, currentXY) {
		if (!this.target.level) { /* generate and connect */
			let level = new BaseLevel(!this._up);
			this.target.level = level;

			let type = (this._up ? "staircase-down" : "staircase-up");
			let room = level.rooms.filter(room => room.type == type)[0];
			this.target.xy = room.getCenter();

			let opposite = level.cells[room.getCenter()];
			opposite.target.level = currentLevel;
			opposite.target.xy = currentXY;
		}
		map.setLevel(this.target.level, this.target.xy);
	}
}
