export default class Draw {
	constructor(level) {
		this.rooms = level.rooms;

		let min = [1/0, 1/0];
		let max = [-1/0, -1/0];
		this.rooms.forEach(room => {
			min[0] = Math.min(min[0], room.position[0]);
			min[1] = Math.min(min[1], room.position[1]);
			max[0] = Math.max(max[0], room.position[0]+room.size[0]);
			max[1] = Math.max(max[1], room.position[1]+room.size[1]);
		});
		let size = [max[0]-min[0], max[1]-min[1]];
		let scale = 6;

		this.canvas = document.createElement("canvas");
		this.canvas.width = size[0]*scale;
		this.canvas.height = size[1]*scale;

		this.ctx = this.canvas.getContext("2d");
		this.ctx.scale(scale, scale);
		this.ctx.translate(-min[0], -min[1]);

		this._fill(this.rooms.filter(_ => _.role == "center")[0], "blue");
		this._fill(this.rooms.filter(_ => _.role == "begin")[0], "green");
		this._fill(this.rooms.filter(_ => _.role == "end")[0], "red");
		this._outlines();
		this._doors();
	}

	_outlines() {
		this.rooms.forEach(room => {
			this.ctx.strokeRect(room.position[0], room.position[1], room.size[0], room.size[1]);
		});
	}

	_fill(room, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(room.position[0], room.position[1], room.size[0], room.size[1]);
	}

	_doors() {
		this.ctx.beginPath();

		this.rooms.forEach(room => {
			let edges = room.getUsedEdges();
			edges.forEach(edge => {
				this.door(room, edge);
			});
		});

		this.ctx.lineWidth = 0.5;
		this.ctx.strokeStyle = "red";
		this.ctx.lineDashOffset = 2;
		this.ctx.stroke();
	}

	door(room, edge) {
		let otherRoom = room.neighbors[edge];
		let x1, y1, x2, y2;
		switch (edge) {
			case 0:
				y1 = y2 = room.position[1];
				x1 = Math.max(room.position[0], otherRoom.position[0]) + 1;
				x2 = Math.min(room.position[0]+room.size[0], otherRoom.position[0]+otherRoom.size[0]) - 1;
			break;

			case 1:
				x1 = x2 = otherRoom.position[0];
				y1 = Math.max(room.position[1], otherRoom.position[1]) + 1;
				y2 = Math.min(room.position[1]+room.size[1], otherRoom.position[1]+otherRoom.size[1]) - 1;
			break;

			case 2:
				y1 = y2 = otherRoom.position[1];
				x1 = Math.max(room.position[0], otherRoom.position[0]) + 1;
				x2 = Math.min(room.position[0]+room.size[0], otherRoom.position[0]+otherRoom.size[0]) - 1;
			break;

			case 3:
				x1 = x2 = room.position[0];
				y1 = Math.max(room.position[1], otherRoom.position[1]) + 1;
				y2 = Math.min(room.position[1]+room.size[1], otherRoom.position[1]+otherRoom.size[1]) - 1;
			break;
		}
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
	}
}
