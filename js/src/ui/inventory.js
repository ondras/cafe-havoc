const DOM = {
	parent: document.querySelector("#inventory"),
	items: [],
	badge: document.querySelector("#badge")
}

let names = []; // discovered names
let counts = []; // item counts
let active = -1; // currently selected index
let items = []; // item instances in the player's inventory

function findFreeIndex(offset) {
	for (let i=offset; i<names.length; i++) {
		if (!names[i]) { return i; }
	}
	return -1;
}

function discover(what, offset) {
	what.forEach(item => {
		let name = item.visual.short;
		let index = names.indexOf(name);
		
		if (index == -1) { /* not yet found */
			index = findFreeIndex(offset);
			names[index] = name;
			DOM.items[index].style.color = item.visual.fg;
		}
		
		counts[index]++;
	});
}

function redraw() {
	DOM.items.forEach((node, index) => {
		node.innerHTML = "";
		node.className = "";
		if (counts[index] == 0) { return; }

		node.innerHTML = names[index];
		if (index == active) { node.className = "active"; }
	});
}

export function init() {
	DOM.parent.innerHTML = "";
	
	for (let i=0;i<8;i++) {
		let item = document.createElement("li");
		DOM.parent.appendChild(item);
		DOM.items.push(item);
		
		names.push("");
		counts.push(0);
	}
}

export function update(inv) {
	if (inv.badge) {
		DOM.badge.style.color = inv.badge.visual.fg;
		DOM.badge.innerHTML = "%S".format(inv.badge);
	}

	counts = counts.map(count => 0);
	discover(inv.foods, 0);
	discover(inv.drinks, 4);
	items = [].concat(inv.foods).concat(inv.drinks);
	activate(active); // re-activate to sync missing items
	redraw();
}

export function activate(index) {
	if (counts[index] > 0) { 
		active = index;
		redraw();
	} else {
		active = -1;
	}
}

export function getActive() {
	if (active == -1) { return null; }
	let name = names[active];
	return items.filter(item => item.visual.short == name)[0];
}

