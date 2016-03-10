// FIXME promise polyfill
window.seed = /*145675632246;*/ Date.now();
ROT.RNG.setSeed(window.seed);

import player from "entity/player.js";
import { CentralLevel } from "level/level.js";
import * as map from "ui/map.js";
import * as actors from "actors.js";
import * as inventory from "ui/inventory.js";
import * as bump from "ui/bump.js";
import * as intro from "ui/intro.js";
import * as tutorial from "tutorial.js";
import * as stats from "stats.js";

import Customer from "entity/customer.js";
import Cook from "entity/cook.js";
import XY from "util/xy.js";
import * as items from "entity/item/library.js";

function start() {
	let level = new CentralLevel();
	tutorial.start(level);
	stats.start();

/*
	bump.enable("attack");
	new Customer().moveTo(level.getEntry().plus(new XY(2, 0)), level);
	items.createAll().forEach(item => player.pickItem(item));
*/
	map.setLevel(level, level.getEntry());
	actors.loop();
}

map.init();
inventory.init();
bump.init();
intro.show().then(start);
