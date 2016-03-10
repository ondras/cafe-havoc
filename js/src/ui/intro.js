import * as command from "util/command.js";

const node = document.querySelector("#intro");
let resolve = null;

function show() {
	command.register("intro:end", "space", hide);
	return new Promise((res, rej) => resolve = res);
}

function hide() {
	command.disable("intro:");
	node.parentNode.removeChild(node);
	resolve();
}

export {show};
