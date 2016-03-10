import Room from "./room.js";
import XY from "util/xy.js";

let availableRooms = [
	new Room({type:"", size:new XY(6, 4)}),
	new Room({type:"", size:new XY(8, 5)}),
	new Room({type:"", size:new XY(10, 6)}),
	new Room({type:"", size:new XY(12, 8)}),
	new Room({type:"", size:new XY(14, 10)}),
	new Room({type:"", size:new XY(12, 6)}),
	new Room({type:"", size:new XY(6, 10)}),
	new Room({type:"corridor", size:new XY(4, 8), neighbors:{0:false, 2:false}}),
	new Room({type:"corridor", size:new XY(5, 8), neighbors:{0:false, 2:false}}),
	new Room({type:"corridor", size:new XY(10, 4), neighbors:{1:false, 3:false}}),
	new Room({type:"corridor", size:new XY(10, 5), neighbors:{1:false, 3:false}})
];

export default function generator(limit) {
	let count = 1;
	let allRooms = [
		new Room({position:new XY(0, 0)})
	];

	while (allRooms.filter(room => room.type != "corridor").length < limit) {

		let freeRooms = allRooms.filter(room => room.getFreeEdges().length > 0);
		if (!freeRooms.length) {
			alert("no free rooms :/");
			break;
		}

		let oldRoom = freeRooms.random();
		let edge = oldRoom.getFreeEdges().random();
		let newRoom = availableRooms.random().clone();
		
		if (!(edge in newRoom.neighbors)) { continue; }
		
		newRoom.positionNextTo(oldRoom, edge);
		if (newRoom.position.y > allRooms[0].position.y) { continue; }

		if (newRoom.fitsInto(allRooms)) {
			count++;
			if (ROT.RNG.getUniform() > 0.5 || !oldRoom.mergeWith(newRoom, edge)) { /* add a new different room */
				allRooms.push(newRoom);
				oldRoom.neighbors[edge] = newRoom;
				newRoom.neighbors[(edge + 2) % 4] = oldRoom;
			}
		}
	}

	allRooms = allRooms.filter(room => {
		if (room.type != "corridor") { return true; }
		if (room.getFreeEdges().length > 0) {
			room.getUsedEdges().forEach(edge => {
				let otherRoom = room.neighbors[edge];
				otherRoom.neighbors[(edge+2) % 4] = false;
			});
			return false;
		}
		return true;
	});
	
	return allRooms;
}

