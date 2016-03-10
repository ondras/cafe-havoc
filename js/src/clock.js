import * as log from "ui/log.js";
import * as pubsub from "util/pubsub.js";

const node = document.querySelector("#clock");
const tickAmount = 1;
let minutes = null;
let night = false;
let days = 0;

function sync() {
	let m = minutes % (60*24);
	let h = Math.floor(m / 60);
	m = Math.round(minutes % 60);
	
	if (h < 10) { h = `0${h}`; }
	if (m < 10) { m = `0${m}`; }
	
	let n = (h < 8 || h >= 20);
	if (n != night) {
		night = n;
		if (night) {
			document.body.classList.add("night");
		} else {
			document.body.classList.remove("night");
			days++;
		}
		pubsub.publish("clock", null, night);
	}
	
	node.innerHTML = `Time: ${h}:${m} (${night ? "night" : "day"} ${days+1})`;
}

function isNight() {
	return night;
}

function tick(modifier) {
	if (minutes == null) { return; }
	minutes += modifier * tickAmount;
	sync();
}

function init() {
	minutes = 8*60;
	sync();
	
	document.querySelector("#status").classList.remove("hidden");
}

export { init, tick, isNight };
