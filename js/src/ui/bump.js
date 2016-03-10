const DOM = {
	parent: document.querySelector("#bump"),
	items: {}
}

const DEF = [
	{id:"describe", key:"d", label:"<em>d</em>escribe", enabled:true}, 
	{id:"chat", key:"c", label:"<em>c</em>hat", enabled:false}, 
	{id:"give", key:"g", label:"<em>g</em>ive", enabled:false}, 
	{id:"attack", key:"a", label:"<em>a</em>ttack", enabled:false}
];

let active = "";

export function init() {
	DOM.parent.classList.add("hidden");
	DEF.forEach(item => {
		let node = document.createElement("li");
		if (!item.enabled) { node.classList.add("hidden"); }
		node.innerHTML = item.label;
		DOM.parent.appendChild(node);
		DOM.items[item.id] = node;
	});
	
	activate("describe");
}

export function getDefinition() {
	return DEF;
}

export function activate(id) {
	let item = DEF.filter(item => item.id == id)[0];
	if (!item.enabled) { return; }
	active = id;
	
	for (let id in DOM.items) {
		let node = DOM.items[id];
		node.classList[id == active ? "add" : "remove"]("active");
	}
}

export function getActive() {
	return active;
}

export function enable(id) {
	DOM.parent.classList.remove("hidden");
	DOM.items[id].classList.remove("hidden");
	let item = DEF.filter(item => item.id == id)[0];
	item.enabled = true;
}
