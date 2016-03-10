let ts = 0;
let deliveries = 0;
let kills = 0;
let turns = 0;

let node = document.querySelector("#gameover");
node.parentNode.removeChild(node);

export function start() {
	ts = Date.now();
}

export function addDelivery() {
	deliveries++;
}

export function addKill() {
	kills++;
}

export function addTurn() {
	turns++;
}

export function showGameOver(alive) {
	let time = (Date.now()-ts) / (1000*60);

	node.querySelector(".status").classList.add(alive ? "alive" : "dead");
	node.querySelector(".status").innerHTML = (alive ? "ALIVE" : "DEAD");
	node.querySelector(".deliveries").innerHTML = deliveries;
	node.querySelector(".kills").innerHTML = kills;
	node.querySelector(".turns").innerHTML = turns;
	node.querySelector(".time").innerHTML = `${time.toFixed(1)} minutes`;
	
	let parent = document.querySelector("#map");
	node.classList.add("hidden");
	parent.appendChild(node);
	node.offsetWidth;
	node.classList.remove("hidden");
}
