import * as keyboard from "./keyboard.js";
import * as pubsub from "./pubsub.js";

let registry = {};

export function register(command, keys, func) {
	function wrap() {
		if (isEnabled(command)) {
			func(command);
			return true;
		} else {
			return false;
		}
	}

	registry[command] = {
		func: wrap,
		enabled: true
	};

	[].concat(keys || []).forEach(key => keyboard.register(wrap, key));

	return command;
}

export function enable(command) {
	Object.keys(registry)
		.filter(c => c.match(command))
		.forEach(c => registry[c].enabled = true);
	pubsub.publish("command-enable", command);
}

export function disable(command) {
	Object.keys(registry)
		.filter(c => c.match(command))
		.forEach(c => registry[c].enabled = false);
	pubsub.publish("command-disable", command);
}

export function isEnabled(command) {
	return registry[command].enabled;
}

export function execute(command) {
	return registry[command].func();
}
