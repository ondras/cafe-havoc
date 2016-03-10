import * as log from "ui/log.js";

export default class Base {
	constructor(visual) {
		this.visual = visual || {};
		this.blocks = false;
	}
	
	toString() {
		return this.visual.name;
	}
	
	describeThe() {
		return `the ${this}`;
	}
	
	describeA() {
		let first = this.visual.name.charAt(0);
		let article = (first.match(/[aeiou]/i) ? "an" : "a");
		return `${article} ${this}`;
	}
	
	bump(who) {
		log.add("%A bump into %a.", who, this);
	}
}

String.format.map.the = "describeThe";
String.format.map.a = "describeA";

// being-specific
String.format.map.he = "describeHe";
String.format.map.his = "describeHis";
String.format.map.him = "describeHim";

// customer-specific
String.format.map.status = "describeStatus";

// item-specific
String.format.map.consume = "describeConsume";
String.format.map.type = "describeType";
