import Base from "./base.js";
import * as map from "ui/map.js";
import * as actors from "actors.js";
import * as log from "ui/log.js";

export default class Being extends Base {
	constructor(visual) {
		super(visual);

		this.blocks = true;
		this.level = null;
		this.xy = null;
		this.hp = 1;
		this.sex = "m";
		this.inventory = {
			foods: [],
			drinks: [],
			badge: null
		};
	}

	describeHe() { return {m:"he", f:"she"}[this.sex]; }
	describeHis() { return {m:"his", f:"hers"}[this.sex]; }
	describeHim() { return {m:"him", f:"her"}[this.sex]; }

	describeStatus() {
		let parts = [];

		if (this.inventory.foods.length) {
			let food = this.inventory.foods[0];
			parts.push("%consume %a".format(food, food));
		}
		
		if (this.inventory.drinks.length) {
			let drink = this.inventory.drinks[0];
			parts.push("%consume %a".format(drink, drink));
		}
		
		if (parts.length) {
			return parts.join(" and ");
		} else {
			return "waiting for something";
		}
	}

	act() {
		return Promise.resolve();
	}
	
	accept(item) {
		return false;
	}

	moveBy(xy) {
		return this.moveTo(this.xy.plus(xy));
	}

	moveTo(xy, level) {
		if (this.xy) {
			delete this.level.beings[this.xy];
			map.update(this.xy);
		}

		if (level) { this.level = level; }

		this.xy = xy;
		this.level.beings[this.xy] = this;
		map.update(this.xy);
		
		return this;
	}
	
	pickItem(item, xy) {		
		if (xy) { 
			log.add("%A pick up %a.", this, item);
			delete this.level.items[xy];
		}
		
		let inv = this.inventory;

		switch (item.type) {
			case "food":
				inv.foods.push(item);
			break;
			
			case "drink":
				inv.drinks.push(item);
			break;
			
			case "badge":
				inv.badge && this.dropItem(inv.badge, xy);
				inv.badge = item;
			break;
		}
	}
	
	dropItem(item, xy) {
		let index;
		let inv = this.inventory;

		index = inv.foods.indexOf(item);
		if (index > -1) { inv.foods.splice(index, 1); }

		index = inv.drinks.indexOf(item);
		if (index > -1) { inv.drinks.splice(index, 1); }

		if (item == inv.badge) { inv.badge = null; }

		if (!xy) { return; }
		log.add("%A drop down %a.", this, item);
		this.level.items[xy] = item;
	}
	
	chat() {}
	
	getSameItem(item) {
		let inv = this.inventory;
		let all = inv.foods.concat(inv.drinks);
		let avail = all.filter(i => i.isSameAs(item));
		return (avail.length > 0 ? avail[0] : null);
	}
	
	getActiveItem() {
		return null;
	}
	
	damage(amount) {
		if (this.hp == 0) { return; }
		this.hp = Math.max(0, this.hp-amount);
		if (this.hp == 0) { this.die(); }
	}
	
	die() {
		delete this.level.beings[this.xy];
		map.update(this.xy);
		// fixme drop stuff?
		actors.remove(this);
	}
}
