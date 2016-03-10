import Being from "./being.js";
import Badge from "entity/item/badge.js";
import * as log from "ui/log.js";
import * as clock from "clock.js";
import player from "entity/player.js";

export default class Jenkins extends Being {
	constructor(doors) {
		super({ch:"J", fg:"#c3c", name:"Jenkins, the chief steward"}); // fixme color
		this.sex = "m";
		
		this.doors = doors;
		this._chatted = false;
		doors.forEach(door => door.lock());
	}
	
	describeThe() { return this.toString(); }
	describeA() { return this.toString(); }
	
	describeStatus() {
		return "busy doing paperwork and managing the whole Café Havoc";
	}
	
	chat() {
		if (this._chatted) {
			this._say("Back to your work! There is no time for chit-chat.");
			return;
		}
		
		this._chatted = true;
		this._say("Ah, you must be the new waiter! Well, let's get you started.");
		log.pause();
		
		this._say("You see, Café Havoc is a big business and a big brand.");
		this._say("We serve many people and they expect top-level services.");
		this._say("In particular, we have to satisfy their orders properly.");
		log.pause();
		
		this._say("You will start with a simple assignment:");
		this._say("do your best during three days (and three nights) and we will assess your performance afterwards.");
		log.pause();
		
		this._say("...and, uhm, if you hear people talking about some shady night-murder-death-blood stuff, please be assured that it is only gossip going on.");
		this._say("Understood?");
		log.pause();

		let badge = new Badge("basic");
		log.add("%S, hands you %a.", this, badge);
		player.pickItem(badge);
	
		this.doors.forEach(door => door.unlock());
		clock.init();
	}
	
	_say(stuff) {
		log.add(`%c{#fff}${stuff}%c{}`);
	}
}
