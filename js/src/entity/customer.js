import Being from "./being.js";
import * as command from "util/command.js";
import * as pubsub from "util/pubsub.js";
import * as entities from "entity/library.js";
import * as log from "ui/log.js";
import * as items from "entity/item/library.js";
import * as ai from "ai.js";

const SEXES = ["m", "f"];
const NAMES = ["Smith", "Jones", "Blueberry", "Remington", "Hogwart", "Goobers", "Teapot", "Vandelay", "Smithers", "Jackson", "Claus", "Hummer", "Petrof", "Weinerslav", "Spaceman", "Hustler", "Zoidberg", "Wienerschnitzel", "Dipstick"];
const JOB = ["astronaut", "accountant", "janitor", "librarian", "lumberjack", "consultant", "importer", "exporter", "magician", "counselor", "contractor", "archaeologist", "copywriter"];
const ADJECTIVES = ["elderly", "retired", "good-looking", "young", "middle-aged", "attractive", "resigned", "weird-looking", "relaxed"];
const HAPPY = ["I am happy and satisfied right now.", "There is nothing I need.", "No more orders."];
const UNHAPPY = ["I am still waiting for my %s.", "I would like to order %a.", "Bring me %a, please."];

export default class Customer extends Being {
	constructor() {
		let sex = SEXES.random();
		let adjective = ADJECTIVES.random();
		let prefix = {m:"Mr", f:"Ms"}[sex];
		let article = adjective.charAt(0).match(/[aeiou]/i) ? "an" : "a";
		let name = NAMES.random();
		let ch = name.charAt(0).toLowerCase();
		
		name = `${prefix}. ${name}, ${article} ${adjective} ${JOB.random()}`;
		
		super({ch, name});
		this.sex = sex;
		this.hp = (sex == "m" ? 2 : 1);
		
		this._setWanted(null);
		this._initInventory();
	}
	
	act() {
		log.pause();
		return ai.actCustomer(this);
	}
	
	chat() {
		if (this._wants) {
			log.add(`%c{#fff}${UNHAPPY.random()}%c{}`, this._wants);
		} else {
			log.add(`%c{#fff}${HAPPY.random()}%c{}`);
		}
	}
	
	accept(item) {
		if (!this._wants) { return false; }
		if (!item.isSameAs(this._wants)) { return false; }
		
		this.pickItem(item);
		
		if (!this.inventory.foods.length) { 
			this._setWanted(items.createFood());
		} else if (!this.inventory.drinks.length) {
			this._setWanted(items.createDrink());
		} else {
			this._setWanted(null);
		}
		
		return true;
	}
	
	getActiveItem() {
		let inv = this.inventory;
		if (inv.foods.length) { return inv.foods[0]; }
		if (inv.drinks.length) { return inv.drinks[0]; }
		return null;
	}
	
	describeThe() { return this.toString(); }
	describeA() { return this.toString(); }
		
	attack(target) {
		let item = this.getActiveItem();

		let type = ["", "", "cowardly", "treacherously", "deviously"].random();
		if (type) { type = `${type} `; }
		log.add(`%s, ${type}attacks you with %a.`, this, item);

		let defense = target.getActiveItem();
		if (defense && !defense.isSameAs(item)) { defense = null; }

		if (defense) { // defended
			let verb = ["parry", "dodge", "deflect"].random();
			log.add(`Fortunately, you also hold %a, so you are able to ${verb} the attack.`, defense);
		} else { // attack success
			
			let color = "#faa";
			if (target.getActiveItem()) {
				log.add(`%c{${color}}Your %s does not provide enough defense. You are hit!%c{}`, target.getActiveItem());
			} else {
				log.add(`%c{${color}}You are not holding anything, so you are hit!%c{}`);
			}

			target.damage(1);
		}
	}

	_setWanted(item) {
		this._wants = item;
		this.visual.fg = (item ? item.visual.fg : "#aaa");
	}

	_initInventory() {
		let modes = {
			"food": 5,
			"drink": 5,
			"both": 1,
			"none": 1
		}
		let mode = ROT.RNG.getWeightedValue(modes);
		
		switch (mode) {
			case "food":
				this.pickItem(items.createFood());
				this._setWanted(items.createDrink());
			break;
			
			case "drink":
				this.pickItem(items.createDrink());
				this._setWanted(items.createFood());
			break;
			
			case "both":
				this.pickItem(items.createFood());
				this.pickItem(items.createDrink());
			break;
			
			case "none":
				this._setWanted(items.create());
			break;
		}
	}
}
