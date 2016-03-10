import Base from "../base.js";

export default class Item extends Base {
	constructor(type, visual) {
		super(visual);
		
		this.type = type;
	}

	isSameAs(otherItem) {
		return (this.visual.short == otherItem.visual.short);
	}
	
	describeType() {
		let map = {
			food: ["food", "snack", "delicacy"].random(),
			drink: ["drink", "beverage", "liquid"].random()
		}

		return (this.type in map ? map[this.type] : this.type);
	}
}
