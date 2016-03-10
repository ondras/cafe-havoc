import XY from "util/xy.js";
import player from "entity/player.js";
import * as clock from "clock.js";
import * as rules from "rules.js";

const DIRS = [
	new XY(1, 0),
	new XY(-1, 0),
	new XY(0, 1),
	new XY(0, -1),
	new XY(1, 1),
	new XY(-1, 1),
	new XY(-1, -1),
	new XY(1, -1)
];

function wander(who) {
	if (ROT.RNG.getUniform() > rules.AI_IDLE) { return; }

	let level = who.level;

	let dirs = DIRS.filter(dxy => {
		let entity = level.getEntityAt(who.xy.plus(dxy));
		return !entity.blocks;
	});
	
	if (!dirs.length) { return; }
	
	let dir = dirs.random();
	let xy = who.xy.plus(dir);
	who.moveTo(xy);
}

function attack(who) {
	let dist = who.xy.dist8(player.xy);
	if (dist == 1) {
		who.attack(player);
	} else if (dist <= rules.AI_RANGE) {
		getCloserToPlayer(who);
	} else {
		wander(who);
	}
}

function getCloserToPlayer(who) {
	let best = 1/0;
	let avail = [];

	DIRS.forEach(dxy => {
		let xy = who.xy.plus(dxy);
		let entity = who.level.getEntityAt(xy);
		if (entity.blocks) { return; }
		
		let dist = xy.dist8(player.xy);
		if (dist < best) {
			best = dist;
			avail = [];
		}
		
		if (dist == best) { avail.push(xy); }
	});
	
	if (avail.length) {
		who.moveTo(avail.random());
	}
}

function actCustomer(who) {
	if (clock.isNight() && who.getActiveItem()) {
		attack(who);
	} else {
		wander(who);
	}
	return Promise.resolve();
}

function actCook(who) {
	if (who.angry) {
		attack(who);
	} else {
		wander(who);
	}
	return Promise.resolve();
}

export { actCustomer, actCook };
