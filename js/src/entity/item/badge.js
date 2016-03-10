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
		color: "#afa"
	}
}

export default class Badge extends Item {
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
