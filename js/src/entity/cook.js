import Being from "./being.js";
import * as command from "util/command.js";
import * as log from "ui/log.js";
import * as ai from "ai.js";
import * as rules from "rules.js";

export default class Cook extends Being {
	constructor() {
		let visual = {
			ch: "C",
			fg: "#fff",
			name: "cook"
		}
		super(visual);

		this.hp = 3;

		this._healed = false;
		this.angry = false;
	}

	describeStatus() {
		return "busy organizing the kitchen and preparing delicious snacks and drinks for all customers";
	}
	
	act() {
		log.pause();
		return ai.actCook(this);
	}
	
	chat(player) {
		if (this._angry) {
			log.add("%c{#fff}Aaargh!%c{}");
		} else if (this._healed) {
			log.add("%c{#fff}Sorry, I already healed you once.%c{}");
		} else if (player.hp == rules.PLAYER_HP) {
			log.add("%c{#fff}There is nothing I can do for you know. Come back if you get hurt.%c{}");
		} else {
			log.add("%c{#fff}You look damaged, let me heal you with my magical cooking power.%c{}");
			player.hp++;
			player.updateHealth();
			this._healed = true;
		}
	}
	
	getActiveItem() {
		return null;
	}
	
	attack(target) {
		log.add("%The pulls out a very large knife and stabs you!", this);
		target.damage(5);
	}
	
	damage(amount) {
		this.angry = true;
		super.damage(amount);
	}
}
