import Item from "./item.js";

let DRINKS = [
	{short:"Espresso", hot:true},
	{short:"Americano", hot:true},
	{short:"Cappuccino", hot:true},
	{short:"Cafe latte", hot:true},
	{short:"Macchiato", hot:true},
	{short:"Black tea", hot:true},
	{short:"Rooibos tea", hot:true},
	{short:"Herbal tea", hot:true},
	{short:"Oolong tea", hot:true},
	{short:"Pu-erh tea", hot:true},
	{short:"Masala chai", hot:true},
	{short:"Apple juice", hot:false},
	{short:"Pear juice", hot:false},
	{short:"Plum juice", hot:false},
	{short:"Kiwi juice", hot:false},
	{short:"Fig juice", hot:false},
	{short:"Soda water", hot:false},
	{short:"Red Bull", hot:false},
	{short:"Club Mate", hot:false},
	{short:"Fresh milk", hot:false}
].randomize().slice(0, 4);

let FOODS = [
	{short:"Apple cake"},
	{short:"Marble cake"},
	{short:"Cheesecake"},
	{short:"Brownie"},
	{short:"Sachertorte"},
	{short:"Carrot cake"},
	{short:"Cupcake"},
	{short:"Macaron"},
	{short:"Tiramisu"},
	{short:"Cherry pie"},
	{short:"Gingerbread"},
	{short:"Chocolate"},
	{short:"Pudding"},
	{short:"Lutefisk"}
].randomize().slice(0, 4);

let COLORS = [
	[255, 30, 30],
	[30, 255, 30],
	[0, 0, 255],
	[200, 200, 0]
];

let HOT = ["", "hot", "warm"];
let COLD = ["", "cold", "ice-cold"];
let TASTE = ["", "delicious", "tasty"];

function tint(c1, c2) {
	return ROT.Color.toRGB(ROT.Color.interpolate(c1, c2));
}

COLORS.forEach((color, index) => {
	DRINKS[index].color = color;
	FOODS[index].color = color;
});

class Food extends Item {
	constructor(template) {
		let color = tint(template.color, [255, 255, 255]);

		let taste = TASTE.random();
		if (taste) { taste = `${taste} `; }
		let name = `${taste}${template.short}`;
		name = `piece of %c{${color}}${name}%c{}`;
		
		let visual = {
			ch: "%",
			fg: color,
			name: name,
			short: template.short
		};
		super("food", visual);

		this._consume = ["eating", "nibbling", "chewing", "swallowing", "enjoying"].random();
	}
	
	describeConsume() {
		return this._consume;
	}
}

class Drink extends Item {
	constructor(template) {
		let color = tint(template.color, [255, 255, 255]);

		let container = (template.hot ? "cup" : "glass");
		let temp = (template.hot ? HOT.random() : COLD.random());
		if (temp) { temp = `${temp} `; }
		let name = `${container} of ${temp}%c{${color}}${template.short}%c{}`;
		
		let visual = {
			ch: "~",
			fg: color,
			name: name,
			short: template.short
		};
		super("drink", visual);

		this._consume = ["drinking", "sipping", "quaffing", "gulping", "sucking", "enjoying"].random();
	}

	describeConsume() {
		return this._consume;
	}
}

export function createFood(index) {
	let template = (arguments.length ? FOODS[index] : FOODS.random());
	return new Food(template);
}

export function createDrink(index) {
	let template = (arguments.length ? DRINKS[index] : DRINKS.random());
	return new Drink(template);
}

export function create() {
	if (ROT.RNG.getUniform() > .5) {
		return createFood();
	} else {
		return createDrink();
	}
}

export function createAll() {
	let result = [];
	FOODS.forEach((template, index) => {
		result.push(createFood(index));
	});
	DRINKS.forEach((template, index) => {
		result.push(createDrink(index));
	});
	return result;
}
