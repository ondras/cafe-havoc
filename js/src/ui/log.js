const node = document.querySelector("#log");
let current = null;

export function add() {
	let str = String.format.apply(String, arguments);
	while (1) {
		let matched = false;
		str = str.replace(/%([cb]?){([^}]*)}/, (match, type, color) => {
			matched = true;
			type = {c:"color", b:"background-color"}[type];
			return (color ? `<span style="${type}: ${color}">` : "</span>");
		});
		if (!matched) { break; }
	}
	
	let item = document.createElement("span");
	item.className = "hidden";
	item.innerHTML = `${str} `;
	current.appendChild(item);
	item.offsetWidth;
	item.className = "";
}

export function pause() {
	if (current && current.childNodes.length == 0) { return; }
	current = document.createElement("p");
	node.appendChild(current);
	
	while (node.childNodes.length > 50) { node.removeChild(node.firstChild); }
}

pause();
