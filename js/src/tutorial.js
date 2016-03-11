import * as uilog from "ui/log.js";
import * as entities from "entity/library.js";
import * as bump from "ui/bump.js";
import XY from "util/xy.js";
import * as pubsub from "util/pubsub.js";
import { BaseLevel } from "level/level.js";

let turns = 0;
let level = null;
let flags = {
	seenDoor: false,
	seenJenkins: false,
	pickedItem: false,
	nightSeen: false,
	levelChanged: false
}

function log() {
	for (let i=0;i<arguments.length;i++) {
		uilog.add(`<span class="tutorial">${arguments[i]}</span>`);
	}
	uilog.pause();
}

function clock(message, publisher, night) {
	if (night) {
		log("%c{#f00}Night falls!%c{}");
	} else {
		log("%c{#00f}A new day dawns.%c{}");
	}
	
	if (!night) { return; }
	if (flags.nightSeen) { return; }

	flags.nightSeen = true;
	bump.enable("attack");
	log("Word has it that during the night, working in Café Havoc might be a bit tricky.",
		"That is why you can now use the %c{#fff}a%c{}ttack interaction mode, just in case.");
	
}

function start(l) {
	level = l;
	pubsub.subscribe("clock", clock);

	log("Good morning!");
	
	log("This is it, your grand day, first day in a new job.",
		"Working in this big Café is going to be exciting!");

	log("Let's get to work as soon as possible.",
		"It would be a shame to come late...");
}

function describe() {
	if (flags.seenJenkins) { return; }
	
	flags.seenJenkins = true;
	bump.enable("chat");

	log("When you bump into people, different things can happen based on the current interaction mode.",
		"The bottom menu shows available actions.",
		"Try switching to the %c{#fff}c%c{}hat mode to talk to Jenkins.");
}

function pickItem(item) {
	if (flags.pickedItem || item.type == "badge") { return; }
	
	flags.pickedItem = true;
	bump.enable("give");

	uilog.pause();

	log("You just picked up an item!",
		"This means you can give it to someone else.");
	
	log("All your items are available in the bottom menu.",
		"Additionally, you can have one of them readied to be given away.",
		"To give stuff away, do not forget to change your interaction mode to %c{#fff}g%c{}ive!");
}

function moveTo(xy, l) {
	turns++;

	if (turns == 5) {
		log("As you already found out, movement is controlled with %c{#fff}arrow keys%c{} or %c{#fff}vi-keys%c{}.",
			"Press %c{#fff}.%c{} to wait (skip a turn).");
	}

	if (turns == 10) {
		log("By the way, the game map can be zoomed using the %c{#fff}<strong>+</strong>%c{} and %c{#fff}<strong>&minus;</strong>%c{} keys.");
	}
	
	let topCell = level.cells[xy.plus(new XY(0, -1))];
	if (!flags.seenDoor && topCell instanceof entities.Door) {
		flags.seenDoor = true;
		log("You stand in front of a large door labeled %c{#aaf}Café Havoc%c{}.",
			"Good luck on your first day!"); 
	}

	if (!flags.levelChanged && l instanceof BaseLevel) {
		flags.levelChanged = true;
		uilog.pause();

		log("A-ha! Café Havoc apparently has more floors.",
			"More specifically, three: a starting central-level, one upper and one lower.",
			"You just entered one of these terminal levels.");
	}
}

export { start, describe, moveTo, pickItem };
