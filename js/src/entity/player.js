import XY from "util/xy.js";
import Being from "./being.js";
import Jenkins from "./jenkins.js";
import Customer from "./customer.js";
import * as command from "util/command.js";
import * as pubsub from "util/pubsub.js";
import * as entities from "entity/library.js";
import * as log from "ui/log.js";
import * as map from "ui/map.js";
import * as inventory from "ui/inventory.js";
import * as bump from "ui/bump.js";
import * as tutorial from "tutorial.js";
import * as clock from "clock.js";
import * as stats from "stats.js";
import * as rules from "rules.js";

class Player extends Being {
	constructor() {
		super({ch:"@", fg:"#fff", name:"you"});
		this.hp = rules.PLAYER_HP;
		this._resolve = null;
		this._days = 0;
		this._visitedRooms = [];

		pubsub.subscribe("visibility-change", this);
		pubsub.subscribe("clock", this);

		this._createCommands();
		this._node = document.querySelector("#health");

		command.disable("player:");
		
		this.updateHealth();
	}
	
	describeThe() { return this.toString(); }
	describeA() { return this.toString(); }

	act() {
		if (this.hp <= 0) { 
			stats.showGameOver(false);
			return new Promise(() => {}); 
		}

		let modifier = 2;
		if (this._hasBadge("time")) { modifier = 1; }
		clock.tick(modifier);
		
		if (this._days == 3) {
			stats.showGameOver(true);
			return new Promise(() => {}); 
		}
		
		if (this._hasBadge("regeneration") && this.hp < rules.PLAYER_HP && ROT.RNG.getUniform() < rules.REGENERATION) {
			this.hp++;
			this.updateHealth();
		}

		stats.addTurn();
		log.pause();

		command.enable("player:");
		return new Promise(resolve => this._resolve = resolve)
			.then(() => command.disable("player:"))
	}

	moveTo(xy, level) {
		let oldLevel = this.level;

		super.moveTo(xy, level);
		
		let rooms = this.level.getRoomsAt(xy);
		rooms.forEach(room => {
			let index = this._visitedRooms.indexOf(room);
			if (index > -1) { return; }
			this._visitedRooms.push(room);
			let name = room.toString();
			if (name) { log.add(`You enter a ${name}.`); }
		});

		let item = this.level.items[xy];
		item && this.pickItem(item, xy);

		let cell = this.level.cells[xy];
		if (cell instanceof entities.Staircase && oldLevel == this.level) { /* entered a staircase while NOT changing level */
			log.add("You climb %the...", cell)
			cell.enter(this.level, xy);
		} else {
			pubsub.publish("visibility-change", this);
			map.setCenter(xy);
			tutorial.moveTo(xy, level);
		}

		return this;
	}

	handleMessage(message, publisher, data) {
		switch (message) {
			case "visibility-change":
				if (!this.xy) { return; }
				let visibleRooms = [];
				if (this._hasBadge("visibility")) {
					visibleRooms = this.level.getRoomsAt(this.xy);
				} else {
					visibleRooms = this.level.getVisibleRooms(this.xy);
				}
				map.setVisibleRooms(visibleRooms);
			break;
			
			case "clock":
				let day = !data;
				if (day) { this._days++; } 
			break;
		}
	}
	
	pickItem(item, xy) {
		super.pickItem(item, xy);
		inventory.update(this.inventory);
		tutorial.pickItem(item);
	}

	dropItem(item, xy) {
		super.dropItem(item, xy);
		inventory.update(this.inventory);
	}
	
	getActiveItem() {
		return inventory.getActive();
	}
	
	damage(amount) {
		super.damage(amount);
		this.updateHealth();
	}

	die() {
		log.add("%c{#f00}You die...%c{}");
	}
	
	updateHealth() {
		let full = new Array(this.hp+1).join("*");
		let empty = new Array(rules.PLAYER_HP - this.hp + 1).join("*");
		this._node.innerHTML = `Health: <span class="full">${full}</span><span class="empty">${empty}</span>`;
	}
	
	_hasBadge(type) {
		return (this.inventory.badge && this.inventory.badge.badgeType == type);
	}

	_bump(dxy) {
		let xy = this.xy.plus(dxy);
		let entity = this.level.beings[xy] || this.level.cells[xy];
		
		if (!entity.blocks) { // free space
			this.moveTo(xy);
			return true;
		}
		
		if (entity instanceof Being) { // interaction
			switch (bump.getActive()) {
				case "describe": return this._describe(entity); break;
				case "chat": return this._chat(entity); break;
				case "give": return this._give(entity); break;
				case "attack": return this._attack(entity); break;
			}
		}
		
		return entity.bump(this);
	}
	
	_createCommands() {
		command.register("player:left", ["left", "h"], () => {
			this._bump(new XY(-1, 0)) && this._resolve();
		});

		command.register("player:right", ["right", "l"], () => {
			this._bump(new XY(1, 0)) && this._resolve();
		});

		command.register("player:up", ["up", "k"], () => {
			this._bump(new XY(0, -1)) && this._resolve();
		});

		command.register("player:down", ["down", "j"], () => {
			this._bump(new XY(0, 1)) && this._resolve();
		});
		
		command.register("player:leftup", ["y", "home"], () => {
			this._bump(new XY(-1, -1)) && this._resolve();
		});

		command.register("player:rightup", ["u", "pgup"], () => {
			this._bump(new XY(1, -1)) && this._resolve();
		});

		command.register("player:leftdown", ["b", "end"], () => {
			this._bump(new XY(-1, 1)) && this._resolve();
		});

		command.register("player:rightdown", ["n", "pgdn"], () => {
			this._bump(new XY(1, 1)) && this._resolve();
		});

		command.register("player:noop", ".", () => {
			this._resolve();
		});

		for (let i=0; i<8; i++) {
			command.register(`player:item${i}`, `${i+1}`, () => this._activateInventory(i));
		}
		
		bump.getDefinition().forEach(item => {
			command.register(`player:bump-${item.id}`, `${item.key}`, () => bump.activate(item.id));
		});
		
		command.register("player:test", "x", () => bump.enable("attack"));
	}
	
	_activateInventory(index) {
		inventory.activate(index);
		let item = this.getActiveItem();
		if (item) { 
			log.add("You ready %a.", item);
			log.pause();
		}
	}
	
	_describe(target) {
		log.add("You look at %the. %He is %status.", target, target, target);
		if (clock.isNight() && !(target instanceof Jenkins)) {
			log.add("%He looks very angry. Approach %him with caution!", target, target);
		}
		log.pause();
		tutorial.describe();
		return false; // does not count as action
	}
	
	_chat(target) {
		if (clock.isNight() && target instanceof Customer) {
			let verb = ["screams", "cries", "howls", "growls"].random();
			log.add(`You talk to %the. Instead of replying, %he ${verb} in anger!`, target, target);
		} else {
			log.add("You talk to %the. %He replies:", target, target);
			target.chat(this);
		}
		return true; // counts as an action
	}
	
	_attack(target) {
		if (target instanceof Jenkins) {
			log.add("Attacking you immediate superior is not a good idea!");
			return true;
		}
		
		if (!clock.isNight() && target instanceof Customer) {
			log.add("A self-respecting waiter is not going to attack his customers! Well, at least not during the day.");
			return true;
		}
		
		let item = this.getActiveItem();
		if (!item) {
			log.add("You have nothing in your hands! If you want to fight, you need to ready something.");
			log.pause();
			return true;
		}
		
		let type = ["", "", "bravely", "courageously", "carefully"].random();
		if (type) { type = `${type} `; }
		log.add(`You ${type}attack %the, with %a.`, target, item);

		let defense = target.getSameItem(item);
		if (defense) { // defended
			let verb = ["parry", "dodge", "deflect"].random();
			log.add(`Unfortunately, %he also has %a, so %he is able to ${verb} the attack.`, target, defense, target);
		} else { // attack success

			let amount = 1;
			if (this._hasBadge("damage")) { amount = 2; }

			target.damage(amount);
			if (target.hp > 0) {
				log.add("You manage to wound %him with the %type.", target, item);
			} else {
				log.add("You hit %him and kill %him!", target, target);
				stats.addKill();
			}
			
			if (ROT.RNG.getUniform() < rules.ITEM_DESTRUCT) {
				this.dropItem(item);
				log.add("Unfortunately, your %s is destroyed during the vicious fight.", item);
			}
		}
		return true;
	}
	
	_give(target) {
		let item = this.getActiveItem();
		if (!item) {
			log.add("You have nothing in your hands! Pick up items and ready them by pressing the corresponding number.");
			log.pause();
			return false;
		}

		log.add("You give %a to %the.", item, target);

		if (target.accept(item)) {
			this.dropItem(item);
			stats.addDelivery();

			let adv = ["happily", "eagerly", "contentedly"].random();
			let verb = ["accepts", "takes"].random();
			log.add(`%He ${verb} it ${adv}.`, target);

			map.update(target.xy);
		} else {
			let verb = ["accept", "want"].random();
			log.add(`%He does not ${verb} it!`, target);
		}
		return true;
	}
}

export default new Player();
