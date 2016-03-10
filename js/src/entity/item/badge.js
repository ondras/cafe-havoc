import Item from "./item.js";

const TYPES = {
	"basic": {
		name: "Badge of the apprentice",
		color: "#aaf"
	},

	"damage": {
		name: "Badge of double damage",
		color: "#faa"
	},

	"time": {
		name: "Badge of time dilation",
		color: "#e8e"
	},

	"visibility": {
		name: "Badge of reduced visibility",
		color: "#666"
	},

	"regeneration": {
		name: "Badge of random regeneration",
		color: "#afa"
	}
}

export default class Badge extends Item {
	static create() {
		let list = Object.keys(TYPES).filter(str => str != "basic");
		return new this(list.random());
	}
	
	constructor(type) {
		let def = TYPES[type];
		let visual = {
			ch: "$",
			fg: def.color,
			name: def.name
		}
		super("badge", visual);

		this.badgeType = type;
	}
}
