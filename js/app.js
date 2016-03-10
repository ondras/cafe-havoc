"use strict";

System.register("actors.js", [], function (_export, _context) {
	var queue;
	return {
		setters: [],
		execute: function () {
			queue = [];
			function add(actor) {
				queue.push(actor);
			}

			_export("add", add);

			function clear() {
				queue = [];
			}

			_export("clear", clear);

			function remove(actor) {
				var index = queue.indexOf(actor);
				if (index > -1) {
					queue.splice(index, 1);
				}
			}

			_export("remove", remove);

			function loop() {
				var actor = queue.shift();
				queue.push(actor);
				actor.act().then(loop);
			}

			_export("loop", loop);
		}
	};
});

"use strict";

System.register("ai.js", ["util/xy.js", "entity/player.js", "clock.js", "rules.js"], function (_export, _context) {
	var XY, player, clock, rules, DIRS;


	function wander(who) {
		if (ROT.RNG.getUniform() > rules.AI_IDLE) {
			return;
		}

		var level = who.level;

		var dirs = DIRS.filter(function (dxy) {
			var entity = level.getEntityAt(who.xy.plus(dxy));
			return !entity.blocks;
		});

		if (!dirs.length) {
			return;
		}

		var dir = dirs.random();
		var xy = who.xy.plus(dir);
		who.moveTo(xy);
	}

	function attack(who) {
		var dist = who.xy.dist8(player.xy);
		if (dist == 1) {
			who.attack(player);
		} else if (dist <= rules.AI_RANGE) {
			getCloserToPlayer(who);
		} else {
			wander(who);
		}
	}

	function getCloserToPlayer(who) {
		var best = 1 / 0;
		var avail = [];

		DIRS.forEach(function (dxy) {
			var xy = who.xy.plus(dxy);
			var entity = who.level.getEntityAt(xy);
			if (entity.blocks) {
				return;
			}

			var dist = xy.dist8(player.xy);
			if (dist < best) {
				best = dist;
				avail = [];
			}

			if (dist == best) {
				avail.push(xy);
			}
		});

		if (avail.length) {
			who.moveTo(avail.random());
		}
	}

	function actCustomer(who) {
		if (clock.isNight() && who.getActiveItem()) {
			attack(who);
		} else {
			wander(who);
		}
		return Promise.resolve();
	}

	function actCook(who) {
		if (who.angry) {
			attack(who);
		} else {
			wander(who);
		}
		return Promise.resolve();
	}

	return {
		setters: [function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_entityPlayerJs) {
			player = _entityPlayerJs.default;
		}, function (_clockJs) {
			clock = _clockJs;
		}, function (_rulesJs) {
			rules = _rulesJs;
		}],
		execute: function () {
			DIRS = [new XY(1, 0), new XY(-1, 0), new XY(0, 1), new XY(0, -1), new XY(1, 1), new XY(-1, 1), new XY(-1, -1), new XY(1, -1)];

			_export("actCustomer", actCustomer);

			_export("actCook", actCook);
		}
	};
});

"use strict";

System.register("app.js", ["entity/player.js", "level/level.js", "ui/map.js", "actors.js", "ui/inventory.js", "ui/bump.js", "ui/intro.js", "tutorial.js", "stats.js", "entity/customer.js", "entity/cook.js", "util/xy.js", "entity/item/library.js"], function (_export, _context) {
	var player, CentralLevel, map, actors, inventory, bump, intro, tutorial, stats, Customer, Cook, XY, items;


	function start() {
		var level = new CentralLevel();
		tutorial.start(level);
		stats.start();

		/*
  	bump.enable("attack");
  	new Customer().moveTo(level.getEntry().plus(new XY(2, 0)), level);
  	items.createAll().forEach(item => player.pickItem(item));
  */
		map.setLevel(level, level.getEntry());
		actors.loop();
	}

	return {
		setters: [function (_entityPlayerJs) {
			player = _entityPlayerJs.default;
		}, function (_levelLevelJs) {
			CentralLevel = _levelLevelJs.CentralLevel;
		}, function (_uiMapJs) {
			map = _uiMapJs;
		}, function (_actorsJs) {
			actors = _actorsJs;
		}, function (_uiInventoryJs) {
			inventory = _uiInventoryJs;
		}, function (_uiBumpJs) {
			bump = _uiBumpJs;
		}, function (_uiIntroJs) {
			intro = _uiIntroJs;
		}, function (_tutorialJs) {
			tutorial = _tutorialJs;
		}, function (_statsJs) {
			stats = _statsJs;
		}, function (_entityCustomerJs) {
			Customer = _entityCustomerJs.default;
		}, function (_entityCookJs) {
			Cook = _entityCookJs.default;
		}, function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_entityItemLibraryJs) {
			items = _entityItemLibraryJs;
		}],
		execute: function () {
			// FIXME promise polyfill
			window.seed = /*145675632246;*/Date.now();
			ROT.RNG.setSeed(window.seed);

			map.init();
			inventory.init();
			bump.init();
			intro.show().then(start);
		}
	};
});

"use strict";

System.register("clock.js", ["ui/log.js", "util/pubsub.js", "rules.js"], function (_export, _context) {
	var log, pubsub, rules, node, minutes, night, days;


	function sync() {
		var m = minutes % (60 * 24);
		var h = Math.floor(m / 60);
		m = Math.round(minutes % 60);

		if (h < 10) {
			h = "0" + h;
		}
		if (m < 10) {
			m = "0" + m;
		}

		var n = h < 8 || h >= 20;
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

		node.innerHTML = "Time: " + h + ":" + m + " (" + (night ? "night" : "day") + " " + (days + 1) + ")";
	}

	function isNight() {
		return night;
	}

	function tick(modifier) {
		if (minutes == null) {
			return;
		}
		minutes += modifier * rules.TICK_MINUTES;
		sync();
	}

	function init() {
		minutes = 8 * 60;
		sync();

		document.querySelector("#status").classList.remove("hidden");
	}

	return {
		setters: [function (_uiLogJs) {
			log = _uiLogJs;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}, function (_rulesJs) {
			rules = _rulesJs;
		}],
		execute: function () {
			node = document.querySelector("#clock");
			minutes = null;
			night = false;
			days = 0;

			_export("init", init);

			_export("tick", tick);

			_export("isNight", isNight);
		}
	};
});

"use strict";

System.register("debug/draw.js", [], function (_export, _context) {
	var _createClass, Draw;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Draw = function () {
				function Draw(level) {
					_classCallCheck(this, Draw);

					this.rooms = level.rooms;

					var min = [1 / 0, 1 / 0];
					var max = [-1 / 0, -1 / 0];
					this.rooms.forEach(function (room) {
						min[0] = Math.min(min[0], room.position[0]);
						min[1] = Math.min(min[1], room.position[1]);
						max[0] = Math.max(max[0], room.position[0] + room.size[0]);
						max[1] = Math.max(max[1], room.position[1] + room.size[1]);
					});
					var size = [max[0] - min[0], max[1] - min[1]];
					var scale = 6;

					this.canvas = document.createElement("canvas");
					this.canvas.width = size[0] * scale;
					this.canvas.height = size[1] * scale;

					this.ctx = this.canvas.getContext("2d");
					this.ctx.scale(scale, scale);
					this.ctx.translate(-min[0], -min[1]);

					this._fill(this.rooms.filter(function (_) {
						return _.role == "center";
					})[0], "blue");
					this._fill(this.rooms.filter(function (_) {
						return _.role == "begin";
					})[0], "green");
					this._fill(this.rooms.filter(function (_) {
						return _.role == "end";
					})[0], "red");
					this._outlines();
					this._doors();
				}

				_createClass(Draw, [{
					key: "_outlines",
					value: function _outlines() {
						var _this = this;

						this.rooms.forEach(function (room) {
							_this.ctx.strokeRect(room.position[0], room.position[1], room.size[0], room.size[1]);
						});
					}
				}, {
					key: "_fill",
					value: function _fill(room, color) {
						this.ctx.fillStyle = color;
						this.ctx.fillRect(room.position[0], room.position[1], room.size[0], room.size[1]);
					}
				}, {
					key: "_doors",
					value: function _doors() {
						var _this2 = this;

						this.ctx.beginPath();

						this.rooms.forEach(function (room) {
							var edges = room.getUsedEdges();
							edges.forEach(function (edge) {
								_this2.door(room, edge);
							});
						});

						this.ctx.lineWidth = 0.5;
						this.ctx.strokeStyle = "red";
						this.ctx.lineDashOffset = 2;
						this.ctx.stroke();
					}
				}, {
					key: "door",
					value: function door(room, edge) {
						var otherRoom = room.neighbors[edge];
						var x1 = void 0,
						    y1 = void 0,
						    x2 = void 0,
						    y2 = void 0;
						switch (edge) {
							case 0:
								y1 = y2 = room.position[1];
								x1 = Math.max(room.position[0], otherRoom.position[0]) + 1;
								x2 = Math.min(room.position[0] + room.size[0], otherRoom.position[0] + otherRoom.size[0]) - 1;
								break;

							case 1:
								x1 = x2 = otherRoom.position[0];
								y1 = Math.max(room.position[1], otherRoom.position[1]) + 1;
								y2 = Math.min(room.position[1] + room.size[1], otherRoom.position[1] + otherRoom.size[1]) - 1;
								break;

							case 2:
								y1 = y2 = otherRoom.position[1];
								x1 = Math.max(room.position[0], otherRoom.position[0]) + 1;
								x2 = Math.min(room.position[0] + room.size[0], otherRoom.position[0] + otherRoom.size[0]) - 1;
								break;

							case 3:
								x1 = x2 = room.position[0];
								y1 = Math.max(room.position[1], otherRoom.position[1]) + 1;
								y2 = Math.min(room.position[1] + room.size[1], otherRoom.position[1] + otherRoom.size[1]) - 1;
								break;
						}
						this.ctx.moveTo(x1, y1);
						this.ctx.lineTo(x2, y2);
					}
				}]);

				return Draw;
			}();

			_export("default", Draw);
		}
	};
});

"use strict";

System.register("entity/base.js", ["ui/log.js"], function (_export, _context) {
	var log, _createClass, Base;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_uiLogJs) {
			log = _uiLogJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Base = function () {
				function Base(visual) {
					_classCallCheck(this, Base);

					this.visual = visual || {};
					this.blocks = false;
				}

				_createClass(Base, [{
					key: "toString",
					value: function toString() {
						return this.visual.name;
					}
				}, {
					key: "describeThe",
					value: function describeThe() {
						return "the " + this;
					}
				}, {
					key: "describeA",
					value: function describeA() {
						var first = this.visual.name.charAt(0);
						var article = first.match(/[aeiou]/i) ? "an" : "a";
						return article + " " + this;
					}
				}, {
					key: "bump",
					value: function bump(who) {
						log.add("%A bump into %a.", who, this);
					}
				}]);

				return Base;
			}();

			_export("default", Base);

			String.format.map.the = "describeThe";
			String.format.map.a = "describeA";

			// being-specific
			String.format.map.he = "describeHe";
			String.format.map.his = "describeHis";
			String.format.map.him = "describeHim";

			// customer-specific
			String.format.map.status = "describeStatus";

			// item-specific
			String.format.map.consume = "describeConsume";
			String.format.map.type = "describeType";
		}
	};
});

"use strict";

System.register("entity/being.js", ["./base.js", "ui/map.js", "actors.js", "ui/log.js"], function (_export, _context) {
	var Base, map, actors, log, _createClass, Being;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_baseJs) {
			Base = _baseJs.default;
		}, function (_uiMapJs) {
			map = _uiMapJs;
		}, function (_actorsJs) {
			actors = _actorsJs;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Being = function (_Base) {
				_inherits(Being, _Base);

				function Being(visual) {
					_classCallCheck(this, Being);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Being).call(this, visual));

					_this.blocks = true;
					_this.level = null;
					_this.xy = null;
					_this.hp = 1;
					_this.sex = "m";
					_this.inventory = {
						foods: [],
						drinks: [],
						badge: null
					};
					return _this;
				}

				_createClass(Being, [{
					key: "describeHe",
					value: function describeHe() {
						return { m: "he", f: "she" }[this.sex];
					}
				}, {
					key: "describeHis",
					value: function describeHis() {
						return { m: "his", f: "hers" }[this.sex];
					}
				}, {
					key: "describeHim",
					value: function describeHim() {
						return { m: "him", f: "her" }[this.sex];
					}
				}, {
					key: "describeStatus",
					value: function describeStatus() {
						var parts = [];

						if (this.inventory.foods.length) {
							var food = this.inventory.foods[0];
							parts.push("%consume %a".format(food, food));
						}

						if (this.inventory.drinks.length) {
							var drink = this.inventory.drinks[0];
							parts.push("%consume %a".format(drink, drink));
						}

						if (parts.length) {
							return parts.join(" and ");
						} else {
							return "waiting for something";
						}
					}
				}, {
					key: "act",
					value: function act() {
						return Promise.resolve();
					}
				}, {
					key: "accept",
					value: function accept(item) {
						return false;
					}
				}, {
					key: "moveBy",
					value: function moveBy(xy) {
						return this.moveTo(this.xy.plus(xy));
					}
				}, {
					key: "moveTo",
					value: function moveTo(xy, level) {
						if (this.xy) {
							delete this.level.beings[this.xy];
							map.update(this.xy);
						}

						if (level) {
							this.level = level;
						}

						this.xy = xy;
						this.level.beings[this.xy] = this;
						map.update(this.xy);

						return this;
					}
				}, {
					key: "pickItem",
					value: function pickItem(item, xy) {
						if (xy) {
							log.add("%A pick up %a.", this, item);
							delete this.level.items[xy];
						}

						var inv = this.inventory;

						switch (item.type) {
							case "food":
								inv.foods.push(item);
								break;

							case "drink":
								inv.drinks.push(item);
								break;

							case "badge":
								inv.badge && this.dropItem(inv.badge, xy);
								inv.badge = item;
								break;
						}
					}
				}, {
					key: "dropItem",
					value: function dropItem(item, xy) {
						var index = void 0;
						var inv = this.inventory;

						index = inv.foods.indexOf(item);
						if (index > -1) {
							inv.foods.splice(index, 1);
						}

						index = inv.drinks.indexOf(item);
						if (index > -1) {
							inv.drinks.splice(index, 1);
						}

						if (item == inv.badge) {
							inv.badge = null;
						}

						if (!xy) {
							return;
						}
						log.add("%A drop %a.", this, item);
						this.level.items[xy] = item;
					}
				}, {
					key: "chat",
					value: function chat() {}
				}, {
					key: "getSameItem",
					value: function getSameItem(item) {
						var inv = this.inventory;
						var all = inv.foods.concat(inv.drinks);
						var avail = all.filter(function (i) {
							return i.isSameAs(item);
						});
						return avail.length > 0 ? avail[0] : null;
					}
				}, {
					key: "getActiveItem",
					value: function getActiveItem() {
						return null;
					}
				}, {
					key: "damage",
					value: function damage(amount) {
						if (this.hp == 0) {
							return;
						}
						this.hp = Math.max(0, this.hp - amount);
						if (this.hp == 0) {
							this.die();
						}
					}
				}, {
					key: "die",
					value: function die() {
						delete this.level.beings[this.xy];
						map.update(this.xy);
						// fixme drop stuff?
						actors.remove(this);
					}
				}]);

				return Being;
			}(Base);

			_export("default", Being);
		}
	};
});

"use strict";

System.register("entity/cook.js", ["./being.js", "util/command.js", "ui/log.js", "ai.js", "rules.js"], function (_export, _context) {
	var Being, command, log, ai, rules, _createClass, _get, Cook;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_beingJs) {
			Being = _beingJs.default;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}, function (_aiJs) {
			ai = _aiJs;
		}, function (_rulesJs) {
			rules = _rulesJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_get = function get(object, property, receiver) {
				if (object === null) object = Function.prototype;
				var desc = Object.getOwnPropertyDescriptor(object, property);

				if (desc === undefined) {
					var parent = Object.getPrototypeOf(object);

					if (parent === null) {
						return undefined;
					} else {
						return get(parent, property, receiver);
					}
				} else if ("value" in desc) {
					return desc.value;
				} else {
					var getter = desc.get;

					if (getter === undefined) {
						return undefined;
					}

					return getter.call(receiver);
				}
			};

			Cook = function (_Being) {
				_inherits(Cook, _Being);

				function Cook() {
					_classCallCheck(this, Cook);

					var visual = {
						ch: "C",
						fg: "#fff",
						name: "cook"
					};

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Cook).call(this, visual));

					_this.hp = 3;

					_this._healed = false;
					_this.angry = false;
					return _this;
				}

				_createClass(Cook, [{
					key: "describeStatus",
					value: function describeStatus() {
						return "busy organizing the kitchen and preparing delicious snacks and drinks for all customers";
					}
				}, {
					key: "act",
					value: function act() {
						log.pause();
						return ai.actCook(this);
					}
				}, {
					key: "chat",
					value: function chat(player) {
						if (this._angry) {
							log.add("%c{#fff}Aaargh!%c{}");
						} else if (this._healed) {
							log.add("%c{#fff}Sorry, I already healed you once.%c{}");
						} else if (player.hp == rules.PLAYER_HP) {
							log.add("%c{#fff}There is nothing I can do for you know. Come back if you get hurt.%c{}");
						} else {
							log.add("%c{#fff}You look damaged, let me heal you with my magical cooking power.%c{}");
							player.hp++;
							player.updateHealth();
							this._healed = true;
						}
					}
				}, {
					key: "getActiveItem",
					value: function getActiveItem() {
						return null;
					}
				}, {
					key: "attack",
					value: function attack(target) {
						log.add("%The pulls out a very large knife and stabs you!", this);
						target.damage(5);
					}
				}, {
					key: "damage",
					value: function damage(amount) {
						this.angry = true;
						_get(Object.getPrototypeOf(Cook.prototype), "damage", this).call(this, amount);
					}
				}]);

				return Cook;
			}(Being);

			_export("default", Cook);
		}
	};
});

"use strict";

System.register("entity/customer.js", ["./being.js", "util/command.js", "util/pubsub.js", "entity/library.js", "ui/log.js", "entity/item/library.js", "ai.js"], function (_export, _context) {
	var Being, command, pubsub, entities, log, items, ai, _createClass, SEXES, NAMES, JOB, ADJECTIVES, HAPPY, UNHAPPY, Customer;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_beingJs) {
			Being = _beingJs.default;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}, function (_entityLibraryJs) {
			entities = _entityLibraryJs;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}, function (_entityItemLibraryJs) {
			items = _entityItemLibraryJs;
		}, function (_aiJs) {
			ai = _aiJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			SEXES = ["m", "f"];
			NAMES = ["Smith", "Jones", "Blueberry", "Remington", "Hogwart", "Goobers", "Teapot", "Vandelay", "Smithers", "Jackson", "Claus", "Hummer", "Petrof", "Weinerslav", "Spaceman", "Hustler", "Zoidberg", "Wienerschnitzel", "Dipstick"];
			JOB = ["astronaut", "accountant", "janitor", "librarian", "lumberjack", "consultant", "importer", "exporter", "magician", "counselor", "contractor", "archaeologist"];
			ADJECTIVES = ["elderly", "retired", "good-looking", "young", "middle-aged", "attractive", "resigned", "weird-looking", "relaxed"];
			HAPPY = ["I am happy and satisfied right now.", "There is nothing I need.", "No more orders."];
			UNHAPPY = ["I am still waiting for my %s.", "I would like to order %a.", "Bring me %a, please."];

			Customer = function (_Being) {
				_inherits(Customer, _Being);

				function Customer() {
					_classCallCheck(this, Customer);

					var sex = SEXES.random();
					var adjective = ADJECTIVES.random();
					var prefix = { m: "Mr", f: "Ms" }[sex];
					var article = adjective.charAt(0).match(/[aeiou]/i) ? "an" : "a";
					var name = NAMES.random();
					var ch = name.charAt(0).toLowerCase();

					name = prefix + ". " + name + ", " + article + " " + adjective + " " + JOB.random();

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Customer).call(this, { ch: ch, name: name }));

					_this.sex = sex;
					_this.hp = sex == "m" ? 2 : 1;

					_this._setWanted(null);
					_this._initInventory();
					return _this;
				}

				_createClass(Customer, [{
					key: "act",
					value: function act() {
						log.pause();
						return ai.actCustomer(this);
					}
				}, {
					key: "chat",
					value: function chat() {
						if (this._wants) {
							log.add("%c{#fff}" + UNHAPPY.random() + "%c{}", this._wants);
						} else {
							log.add("%c{#fff}" + HAPPY.random() + "%c{}");
						}
					}
				}, {
					key: "accept",
					value: function accept(item) {
						if (!this._wants) {
							return false;
						}
						if (!item.isSameAs(this._wants)) {
							return false;
						}

						this.pickItem(item);

						if (!this.inventory.foods.length) {
							this._setWanted(items.createFood());
						} else if (!this.inventory.drinks.length) {
							this._setWanted(items.createDrink());
						} else {
							this._setWanted(null);
						}

						return true;
					}
				}, {
					key: "getActiveItem",
					value: function getActiveItem() {
						var inv = this.inventory;
						if (inv.foods.length) {
							return inv.foods[0];
						}
						if (inv.drinks.length) {
							return inv.drinks[0];
						}
						return null;
					}
				}, {
					key: "describeThe",
					value: function describeThe() {
						return this.toString();
					}
				}, {
					key: "describeA",
					value: function describeA() {
						return this.toString();
					}
				}, {
					key: "attack",
					value: function attack(target) {
						var item = this.getActiveItem();

						var type = ["", "", "cowardly", "treacherously", "deviously"].random();
						if (type) {
							type = type + " ";
						}
						log.add("%s, " + type + "attacks you with %a.", this, item);

						var defense = target.getActiveItem();
						if (defense && !defense.isSameAs(item)) {
							defense = null;
						}

						if (defense) {
							// defended
							var verb = ["parry", "dodge", "deflect"].random();
							log.add("Fortunately, you also hold %a, so you are able to " + verb + " the attack.", defense);
						} else {
							// attack success

							var color = "#faa";
							if (target.getActiveItem()) {
								log.add("%c{" + color + "}Your %s does not provide enough defense. You are hit!%c{}", target.getActiveItem());
							} else {
								log.add("%c{" + color + "}You are not holding anything, so you are hit!%c{}");
							}

							target.damage(1);
						}
					}
				}, {
					key: "_setWanted",
					value: function _setWanted(item) {
						this._wants = item;
						this.visual.fg = item ? item.visual.fg : "#aaa";
					}
				}, {
					key: "_initInventory",
					value: function _initInventory() {
						var modes = {
							"food": 5,
							"drink": 5,
							"both": 1,
							"none": 1
						};
						var mode = ROT.RNG.getWeightedValue(modes);

						switch (mode) {
							case "food":
								this.pickItem(items.createFood());
								this._setWanted(items.createDrink());
								break;

							case "drink":
								this.pickItem(items.createDrink());
								this._setWanted(items.createFood());
								break;

							case "both":
								this.pickItem(items.createFood());
								this.pickItem(items.createDrink());
								break;

							case "none":
								this._setWanted(items.create());
								break;
						}
					}
				}]);

				return Customer;
			}(Being);

			_export("default", Customer);
		}
	};
});

"use strict";

System.register("entity/item/badge.js", ["./item.js"], function (_export, _context) {
	var Item, _createClass, TYPES, Badge;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_itemJs) {
			Item = _itemJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			TYPES = {
				"basic": {
					name: "Badge of the apprentice",
					color: "#aaf"
				},

				"damage": {
					name: "Badge of double damage",
					color: "#faa"
				},

				"time": {
					name: "Badge of time dilation",
					color: "#e8e"
				},

				"regeneration": {
					name: "Badge of random regeneration",
					color: "#afa"
				},

				"visibility": {
					name: "Badge of reduced visibility",
					color: "#666"
				},

				"peace": {
					name: "Badge of peace",
					color: "#eee"
				}
			};

			Badge = function (_Item) {
				_inherits(Badge, _Item);

				_createClass(Badge, null, [{
					key: "create",
					value: function create() {
						var list = Object.keys(TYPES).filter(function (str) {
							return str != "basic";
						});
						return new this(list.random());
					}
				}]);

				function Badge(type) {
					_classCallCheck(this, Badge);

					var def = TYPES[type];
					var visual = {
						ch: "$",
						fg: def.color,
						name: def.name
					};

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Badge).call(this, "badge", visual));

					_this.badgeType = type;
					return _this;
				}

				return Badge;
			}(Item);

			_export("default", Badge);
		}
	};
});

"use strict";

System.register("entity/item/item.js", ["../base.js"], function (_export, _context) {
	var Base, _createClass, Item;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_baseJs) {
			Base = _baseJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Item = function (_Base) {
				_inherits(Item, _Base);

				function Item(type, visual) {
					_classCallCheck(this, Item);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Item).call(this, visual));

					_this.type = type;
					return _this;
				}

				_createClass(Item, [{
					key: "isSameAs",
					value: function isSameAs(otherItem) {
						return this.visual.short == otherItem.visual.short;
					}
				}, {
					key: "describeType",
					value: function describeType() {
						var map = {
							food: ["food", "snack", "delicacy"].random(),
							drink: ["drink", "beverage", "liquid"].random()
						};

						return this.type in map ? map[this.type] : this.type;
					}
				}]);

				return Item;
			}(Base);

			_export("default", Item);
		}
	};
});

"use strict";

System.register("entity/item/library.js", ["./item.js"], function (_export, _context) {
	var Item, _createClass, DRINKS, FOODS, COLORS, HOT, COLD, TASTE, Food, Drink;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	function tint(c1, c2) {
		return ROT.Color.toRGB(ROT.Color.interpolate(c1, c2));
	}

	return {
		setters: [function (_itemJs) {
			Item = _itemJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			DRINKS = [{ short: "Espresso", hot: true }, { short: "Americano", hot: true }, { short: "Cappuccino", hot: true }, { short: "Cafe latte", hot: true }, { short: "Macchiato", hot: true }, { short: "Black tea", hot: true }, { short: "Rooibos tea", hot: true }, { short: "Herbal tea", hot: true }, { short: "Oolong tea", hot: true }, { short: "Pu-erh tea", hot: true }, { short: "Masala chai", hot: true }, { short: "Apple juice", hot: false }, { short: "Pear juice", hot: false }, { short: "Plum juice", hot: false }, { short: "Kiwi juice", hot: false }, { short: "Fig juice", hot: false }, { short: "Soda water", hot: false }, { short: "Red Bull", hot: false }, { short: "Club Mate", hot: false }, { short: "Fresh milk", hot: false }].randomize().slice(0, 4);
			FOODS = [{ short: "Apple cake" }, { short: "Marble cake" }, { short: "Cheesecake" }, { short: "Brownie" }, { short: "Sachertorte" }, { short: "Carrot cake" }, { short: "Cupcake" }, { short: "Macaron" }, { short: "Tiramisu" }, { short: "Cherry pie" }, { short: "Gingerbread" }, { short: "Chocolate" }, { short: "Pudding" }, { short: "Lutefisk" }].randomize().slice(0, 4);
			COLORS = [[255, 30, 30], [30, 255, 30], [0, 0, 255], [200, 200, 0]];
			HOT = ["", "hot", "warm"];
			COLD = ["", "cold", "ice-cold"];
			TASTE = ["", "delicious", "tasty"];
			COLORS.forEach(function (color, index) {
				DRINKS[index].color = color;
				FOODS[index].color = color;
			});

			Food = function (_Item) {
				_inherits(Food, _Item);

				function Food(template) {
					_classCallCheck(this, Food);

					var color = tint(template.color, [255, 255, 255]);

					var taste = TASTE.random();
					if (taste) {
						taste = taste + " ";
					}
					var name = "" + taste + template.short;
					name = "piece of %c{" + color + "}" + name + "%c{}";

					var visual = {
						ch: "%",
						fg: color,
						name: name,
						short: template.short
					};

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Food).call(this, "food", visual));

					_this._consume = ["eating", "nibbling", "chewing", "swallowing", "enjoying"].random();
					return _this;
				}

				_createClass(Food, [{
					key: "describeConsume",
					value: function describeConsume() {
						return this._consume;
					}
				}]);

				return Food;
			}(Item);

			Drink = function (_Item2) {
				_inherits(Drink, _Item2);

				function Drink(template) {
					_classCallCheck(this, Drink);

					var color = tint(template.color, [255, 255, 255]);

					var container = template.hot ? "cup" : "glass";
					var temp = template.hot ? HOT.random() : COLD.random();
					if (temp) {
						temp = temp + " ";
					}
					var name = container + " of " + temp + "%c{" + color + "}" + template.short + "%c{}";

					var visual = {
						ch: "~",
						fg: color,
						name: name,
						short: template.short
					};

					var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Drink).call(this, "drink", visual));

					_this2._consume = ["drinking", "sipping", "quaffing", "gulping", "sucking", "enjoying"].random();
					return _this2;
				}

				_createClass(Drink, [{
					key: "describeConsume",
					value: function describeConsume() {
						return this._consume;
					}
				}]);

				return Drink;
			}(Item);

			function createFood(index) {
				var template = arguments.length ? FOODS[index] : FOODS.random();
				return new Food(template);
			}

			_export("createFood", createFood);

			function createDrink(index) {
				var template = arguments.length ? DRINKS[index] : DRINKS.random();
				return new Drink(template);
			}

			_export("createDrink", createDrink);

			function create() {
				if (ROT.RNG.getUniform() > .5) {
					return createFood();
				} else {
					return createDrink();
				}
			}

			_export("create", create);

			function createAll() {
				var result = [];
				FOODS.forEach(function (template, index) {
					result.push(createFood(index));
				});
				DRINKS.forEach(function (template, index) {
					result.push(createDrink(index));
				});
				return result;
			}

			_export("createAll", createAll);
		}
	};
});

"use strict";

System.register("entity/jenkins.js", ["./being.js", "entity/item/badge.js", "ui/log.js", "clock.js", "entity/player.js"], function (_export, _context) {
	var Being, Badge, log, clock, player, _createClass, Jenkins;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_beingJs) {
			Being = _beingJs.default;
		}, function (_entityItemBadgeJs) {
			Badge = _entityItemBadgeJs.default;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}, function (_clockJs) {
			clock = _clockJs;
		}, function (_entityPlayerJs) {
			player = _entityPlayerJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Jenkins = function (_Being) {
				_inherits(Jenkins, _Being);

				function Jenkins(doors) {
					_classCallCheck(this, Jenkins);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Jenkins).call(this, { ch: "J", fg: "#c3c", name: "Jenkins, the chief steward" }));

					// fixme color
					_this.sex = "m";

					_this.doors = doors;
					_this._chatted = false;
					doors.forEach(function (door) {
						return door.lock();
					});
					return _this;
				}

				_createClass(Jenkins, [{
					key: "describeThe",
					value: function describeThe() {
						return this.toString();
					}
				}, {
					key: "describeA",
					value: function describeA() {
						return this.toString();
					}
				}, {
					key: "describeStatus",
					value: function describeStatus() {
						return "busy doing paperwork and managing the whole Café Havoc";
					}
				}, {
					key: "chat",
					value: function chat() {
						if (this._chatted) {
							this._say("Back to your work! There is no time for chit-chat.");
							return;
						}

						this._chatted = true;
						this._say("Ah, you must be the new waiter! Well, let's get you started.");
						log.pause();

						this._say("You see, Café Havoc is a big business and a big brand.");
						this._say("We serve many people and they expect top-level services.");
						this._say("In particular, we have to satisfy their orders properly.");
						log.pause();

						this._say("You will start with a simple assignment:");
						this._say("do your best during three days (and three nights) and we will assess your performance afterwards.");
						log.pause();

						this._say("...and, uhm, if you hear people talking about some shady night-murder-death-blood stuff, please be assured that it is only gossip going on.");
						this._say("Understood?");
						log.pause();

						var badge = new Badge("basic");
						log.add("%S, hands you %a.", this, badge);
						player.pickItem(badge);

						this.doors.forEach(function (door) {
							return door.unlock();
						});
						clock.init();
					}
				}, {
					key: "_say",
					value: function _say(stuff) {
						log.add("%c{#fff}" + stuff + "%c{}");
					}
				}]);

				return Jenkins;
			}(Being);

			_export("default", Jenkins);
		}
	};
});

"use strict";

System.register("entity/library.js", ["./base.js", "level/level.js", "util/pubsub.js", "ui/map.js", "ui/log.js"], function (_export, _context) {
	var Base, BaseLevel, pubsub, map, log, _createClass, Floor, Table, Storage, Plant, Wall, WallCorner, WallH, WallV, Door, DoorHome, Staircase;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	function color() {
		var base = [[65, 65, 65], [120, 100, 80]].random();

		var c = ROT.Color.randomize(base, 10);
		return ROT.Color.toRGB(c);
	}

	return {
		setters: [function (_baseJs) {
			Base = _baseJs.default;
		}, function (_levelLevelJs) {
			BaseLevel = _levelLevelJs.BaseLevel;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}, function (_uiMapJs) {
			map = _uiMapJs;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_export("Floor", Floor = function (_Base) {
				_inherits(Floor, _Base);

				function Floor(bg) {
					_classCallCheck(this, Floor);

					return _possibleConstructorReturn(this, Object.getPrototypeOf(Floor).call(this, { bg: bg }));
				}

				return Floor;
			}(Base));

			_export("Floor", Floor);

			;

			_export("Table", Table = function (_Base2) {
				_inherits(Table, _Base2);

				function Table(bg) {
					_classCallCheck(this, Table);

					var type = ["", "solid", "old", "shiny"].random();
					if (type) {
						type = type + " ";
					}
					var material = ["", "wooden", "stone", "marble"].random();
					if (material) {
						material = material + " ";
					}
					var name = "" + type + material + "table";

					var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Table).call(this, { ch: "T", fg: color(), bg: bg, name: name }));

					_this2.blocks = true;
					return _this2;
				}

				return Table;
			}(Base));

			_export("Table", Table);

			_export("Storage", Storage = function (_Base3) {
				_inherits(Storage, _Base3);

				function Storage(bg) {
					_classCallCheck(this, Storage);

					var type = ["", "old", "shiny"].random();
					if (type) {
						type = type + " ";
					}
					var material = ["", "wooden", "metal", "plastic"].random();
					if (material) {
						material = material + " ";
					}
					var name = ["cupboard", "cabinet"].random();
					name = "" + type + material + name;

					var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Storage).call(this, { ch: "8", fg: color(), bg: bg, name: name }));

					_this3.blocks = true;
					return _this3;
				}

				return Storage;
			}(Base));

			_export("Storage", Storage);

			_export("Plant", Plant = function (_Base4) {
				_inherits(Plant, _Base4);

				function Plant(bg) {
					_classCallCheck(this, Plant);

					var name = ["ficus plant", "orchid plant", "cactus", "pot flower"].random();

					var c = ROT.Color.randomize([30, 180, 30], [10, 40, 10]);

					var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(Plant).call(this, { ch: "\"", fg: ROT.Color.toRGB(c), bg: bg, name: name }));

					_this4.blocks = true;
					return _this4;
				}

				return Plant;
			}(Base));

			_export("Plant", Plant);

			_export("Wall", Wall = function (_Base5) {
				_inherits(Wall, _Base5);

				function Wall(visual) {
					_classCallCheck(this, Wall);

					visual.fg = "#555";
					visual.name = "wall";

					var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(Wall).call(this, visual));

					_this5.blocks = true;
					return _this5;
				}

				return Wall;
			}(Base));

			_export("Wall", Wall);

			_export("WallCorner", WallCorner = function (_Wall) {
				_inherits(WallCorner, _Wall);

				function WallCorner(bg) {
					_classCallCheck(this, WallCorner);

					return _possibleConstructorReturn(this, Object.getPrototypeOf(WallCorner).call(this, { ch: "+", bg: bg }));
				}

				return WallCorner;
			}(Wall));

			_export("WallCorner", WallCorner);

			_export("WallH", WallH = function (_Wall2) {
				_inherits(WallH, _Wall2);

				function WallH(bg) {
					_classCallCheck(this, WallH);

					return _possibleConstructorReturn(this, Object.getPrototypeOf(WallH).call(this, { ch: "-", bg: bg }));
				}

				return WallH;
			}(Wall));

			_export("WallH", WallH);

			_export("WallV", WallV = function (_Wall3) {
				_inherits(WallV, _Wall3);

				function WallV(bg) {
					_classCallCheck(this, WallV);

					return _possibleConstructorReturn(this, Object.getPrototypeOf(WallV).call(this, { ch: "|", bg: bg }));
				}

				return WallV;
			}(Wall));

			_export("WallV", WallV);

			_export("Door", Door = function (_Base6) {
				_inherits(Door, _Base6);

				function Door(xy, bg) {
					_classCallCheck(this, Door);

					var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(Door).call(this, { fg: "#a50", bg: bg }));

					_this9.xy = xy;
					_this9.close();
					_this9.locked = false;
					return _this9;
				}

				_createClass(Door, [{
					key: "bump",
					value: function bump(who) {
						if (this.locked) {
							log.add("You try to open the door. The door is locked!");
							return false;
						} else {
							log.add("You open the door.");
							this.open();
							return true;
						}
					}
				}, {
					key: "lock",
					value: function lock() {
						this.locked = true;
					}
				}, {
					key: "unlock",
					value: function unlock() {
						this.locked = false;
					}
				}, {
					key: "close",
					value: function close() {
						this.blocks = true;
						this.visual.ch = "=";

						map.update(this.xy);
						pubsub.publish("visibility-change", this);
					}
				}, {
					key: "open",
					value: function open() {
						this.blocks = false;
						this.visual.ch = "/";

						map.update(this.xy);
						pubsub.publish("visibility-change", this);
					}
				}]);

				return Door;
			}(Base));

			_export("Door", Door);

			_export("DoorHome", DoorHome = function (_Door) {
				_inherits(DoorHome, _Door);

				function DoorHome(xy, bg) {
					_classCallCheck(this, DoorHome);

					var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(DoorHome).call(this, xy, bg));

					_this10.visual.fg = "#da2";
					_this10.lock();
					return _this10;
				}

				_createClass(DoorHome, [{
					key: "bump",
					value: function bump() {
						log.add("This is a door to your apartment. Going home is not an option, head to the work instead!");
						return false;
					}
				}]);

				return DoorHome;
			}(Door));

			_export("DoorHome", DoorHome);

			_export("Staircase", Staircase = function (_Base7) {
				_inherits(Staircase, _Base7);

				function Staircase(up, bg) {
					_classCallCheck(this, Staircase);

					var visual = {
						ch: up ? "<" : ">",
						bg: bg,
						fg: "#ccc",
						name: "staircase leading " + (up ? "up" : "down")
					};

					var _this11 = _possibleConstructorReturn(this, Object.getPrototypeOf(Staircase).call(this, visual));

					_this11._up = up;
					_this11.target = {
						level: null,
						xy: null
					};
					return _this11;
				}

				_createClass(Staircase, [{
					key: "enter",
					value: function enter(currentLevel, currentXY) {
						var _this12 = this;

						if (!this.target.level) {
							(function () {
								/* generate and connect */
								var level = new BaseLevel(!_this12._up);
								_this12.target.level = level;

								var type = _this12._up ? "staircase-down" : "staircase-up";
								var room = level.rooms.filter(function (room) {
									return room.type == type;
								})[0];
								_this12.target.xy = room.getCenter();

								var opposite = level.cells[room.getCenter()];
								opposite.target.level = currentLevel;
								opposite.target.xy = currentXY;
							})();
						}
						map.setLevel(this.target.level, this.target.xy);
					}
				}]);

				return Staircase;
			}(Base));

			_export("Staircase", Staircase);
		}
	};
});

"use strict";

System.register("entity/player.js", ["util/xy.js", "./being.js", "./jenkins.js", "./customer.js", "util/command.js", "util/pubsub.js", "entity/library.js", "ui/log.js", "ui/map.js", "ui/inventory.js", "ui/bump.js", "tutorial.js", "clock.js", "stats.js", "rules.js"], function (_export, _context) {
	var XY, Being, Jenkins, Customer, command, pubsub, entities, log, map, inventory, bump, tutorial, clock, stats, rules, _createClass, _get, Player;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_beingJs) {
			Being = _beingJs.default;
		}, function (_jenkinsJs) {
			Jenkins = _jenkinsJs.default;
		}, function (_customerJs) {
			Customer = _customerJs.default;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}, function (_entityLibraryJs) {
			entities = _entityLibraryJs;
		}, function (_uiLogJs) {
			log = _uiLogJs;
		}, function (_uiMapJs) {
			map = _uiMapJs;
		}, function (_uiInventoryJs) {
			inventory = _uiInventoryJs;
		}, function (_uiBumpJs) {
			bump = _uiBumpJs;
		}, function (_tutorialJs) {
			tutorial = _tutorialJs;
		}, function (_clockJs) {
			clock = _clockJs;
		}, function (_statsJs) {
			stats = _statsJs;
		}, function (_rulesJs) {
			rules = _rulesJs;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_get = function get(object, property, receiver) {
				if (object === null) object = Function.prototype;
				var desc = Object.getOwnPropertyDescriptor(object, property);

				if (desc === undefined) {
					var parent = Object.getPrototypeOf(object);

					if (parent === null) {
						return undefined;
					} else {
						return get(parent, property, receiver);
					}
				} else if ("value" in desc) {
					return desc.value;
				} else {
					var getter = desc.get;

					if (getter === undefined) {
						return undefined;
					}

					return getter.call(receiver);
				}
			};

			Player = function (_Being) {
				_inherits(Player, _Being);

				function Player() {
					_classCallCheck(this, Player);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Player).call(this, { ch: "@", fg: "#fff", name: "you" }));

					_this.hp = rules.PLAYER_HP;
					_this._resolve = null;
					_this._days = 0;
					_this._visitedRooms = [];

					pubsub.subscribe("visibility-change", _this);
					pubsub.subscribe("clock", _this);

					_this._createCommands();
					_this._node = document.querySelector("#health");

					command.disable("player:");

					_this.updateHealth();
					return _this;
				}

				_createClass(Player, [{
					key: "describeThe",
					value: function describeThe() {
						return this.toString();
					}
				}, {
					key: "describeA",
					value: function describeA() {
						return this.toString();
					}
				}, {
					key: "act",
					value: function act() {
						var _this2 = this;

						if (this.hp <= 0) {
							stats.showGameOver(false);
							return new Promise(function () {});
						}

						var modifier = 2;
						if (this._hasBadge("time")) {
							modifier = 1;
						}
						clock.tick(modifier);

						if (this._days == 3) {
							stats.showGameOver(true);
							return new Promise(function () {});
						}

						if (this._hasBadge("regeneration") && this.hp < rules.PLAYER_HP && ROT.RNG.getUniform() < rules.REGENERATION) {
							this.hp++;
							this.updateHealth();
						}

						stats.addTurn();
						log.pause();

						command.enable("player:");
						return new Promise(function (resolve) {
							return _this2._resolve = resolve;
						}).then(function () {
							return command.disable("player:");
						});
					}
				}, {
					key: "moveTo",
					value: function moveTo(xy, level) {
						var _this3 = this;

						var oldLevel = this.level;

						_get(Object.getPrototypeOf(Player.prototype), "moveTo", this).call(this, xy, level);

						var rooms = this.level.getRoomsAt(xy);
						rooms.forEach(function (room) {
							var index = _this3._visitedRooms.indexOf(room);
							if (index > -1) {
								return;
							}
							_this3._visitedRooms.push(room);
							var name = room.toString();
							if (name) {
								log.add("You enter a " + name + ".");
							}
						});

						var item = this.level.items[xy];
						item && this.pickItem(item, xy);

						var cell = this.level.cells[xy];
						if (cell instanceof entities.Staircase && oldLevel == this.level) {
							/* entered a staircase while NOT changing level */
							log.add("You climb %the...", cell);
							cell.enter(this.level, xy);
						} else {
							pubsub.publish("visibility-change", this);
							map.setCenter(xy);
							tutorial.moveTo(xy, level);
						}

						return this;
					}
				}, {
					key: "handleMessage",
					value: function handleMessage(message, publisher, data) {
						switch (message) {
							case "visibility-change":
								if (!this.xy) {
									return;
								}
								var visibleRooms = [];
								if (this._hasBadge("visibility")) {
									visibleRooms = this.level.getRoomsAt(this.xy);
								} else {
									visibleRooms = this.level.getVisibleRooms(this.xy);
								}
								map.setVisibleRooms(visibleRooms);
								break;

							case "clock":
								var day = !data;
								if (day) {
									this._days++;
								}
								break;
						}
					}
				}, {
					key: "pickItem",
					value: function pickItem(item, xy) {
						_get(Object.getPrototypeOf(Player.prototype), "pickItem", this).call(this, item, xy);
						inventory.update(this.inventory);
						tutorial.pickItem(item);
					}
				}, {
					key: "dropItem",
					value: function dropItem(item, xy) {
						_get(Object.getPrototypeOf(Player.prototype), "dropItem", this).call(this, item, xy);
						inventory.update(this.inventory);
					}
				}, {
					key: "getActiveItem",
					value: function getActiveItem() {
						return inventory.getActive();
					}
				}, {
					key: "damage",
					value: function damage(amount) {
						_get(Object.getPrototypeOf(Player.prototype), "damage", this).call(this, amount);
						this.updateHealth();
					}
				}, {
					key: "die",
					value: function die() {
						log.add("%c{#f00}You die...%c{}");
					}
				}, {
					key: "updateHealth",
					value: function updateHealth() {
						var full = new Array(this.hp + 1).join("*");
						var empty = new Array(rules.PLAYER_HP - this.hp + 1).join("*");
						this._node.innerHTML = "Health: <span class=\"full\">" + full + "</span><span class=\"empty\">" + empty + "</span>";
					}
				}, {
					key: "_hasBadge",
					value: function _hasBadge(type) {
						return this.inventory.badge && this.inventory.badge.badgeType == type;
					}
				}, {
					key: "_bump",
					value: function _bump(dxy) {
						var xy = this.xy.plus(dxy);
						var entity = this.level.beings[xy] || this.level.cells[xy];

						if (!entity.blocks) {
							// free space
							this.moveTo(xy);
							return true;
						}

						if (entity instanceof Being) {
							// interaction
							switch (bump.getActive()) {
								case "describe":
									return this._describe(entity);break;
								case "chat":
									return this._chat(entity);break;
								case "give":
									return this._give(entity);break;
								case "attack":
									return this._attack(entity);break;
							}
						}

						return entity.bump(this);
					}
				}, {
					key: "_createCommands",
					value: function _createCommands() {
						var _this4 = this;

						command.register("player:left", ["left", "h"], function () {
							_this4._bump(new XY(-1, 0)) && _this4._resolve();
						});

						command.register("player:right", ["right", "l"], function () {
							_this4._bump(new XY(1, 0)) && _this4._resolve();
						});

						command.register("player:up", ["up", "k"], function () {
							_this4._bump(new XY(0, -1)) && _this4._resolve();
						});

						command.register("player:down", ["down", "j"], function () {
							_this4._bump(new XY(0, 1)) && _this4._resolve();
						});

						command.register("player:leftup", ["y", "home"], function () {
							_this4._bump(new XY(-1, -1)) && _this4._resolve();
						});

						command.register("player:rightup", ["u", "pgup"], function () {
							_this4._bump(new XY(1, -1)) && _this4._resolve();
						});

						command.register("player:leftdown", ["b", "end"], function () {
							_this4._bump(new XY(-1, 1)) && _this4._resolve();
						});

						command.register("player:rightdown", ["n", "pgdn"], function () {
							_this4._bump(new XY(1, 1)) && _this4._resolve();
						});

						command.register("player:noop", ".", function () {
							_this4._resolve();
						});

						var _loop = function _loop(i) {
							command.register("player:item" + i, "" + (i + 1), function () {
								return _this4._activateInventory(i);
							});
						};

						for (var i = 0; i < 8; i++) {
							_loop(i);
						}

						bump.getDefinition().forEach(function (item) {
							command.register("player:bump-" + item.id, "" + item.key, function () {
								return bump.activate(item.id);
							});
						});

						command.register("player:test", "x", function () {
							return bump.enable("attack");
						});
					}
				}, {
					key: "_activateInventory",
					value: function _activateInventory(index) {
						inventory.activate(index);
						var item = this.getActiveItem();
						if (item) {
							log.add("You ready %a.", item);
							log.pause();
						}
					}
				}, {
					key: "_describe",
					value: function _describe(target) {
						log.add("You look at %the. %He is %status.", target, target, target);
						if (clock.isNight() && !(target instanceof Jenkins)) {
							log.add("%He looks very angry. Approach %him with caution!", target, target);
						}
						log.pause();
						tutorial.describe();
						return false; // does not count as action
					}
				}, {
					key: "_chat",
					value: function _chat(target) {
						if (clock.isNight() && target instanceof Customer) {
							var verb = ["screams", "cries", "howls", "growls"].random();
							log.add("You talk to %the. Instead of replying, %he " + verb + " in anger!", target, target);
						} else {
							log.add("You talk to %the. %He replies:", target, target);
							target.chat(this);
						}
						return true; // counts as an action
					}
				}, {
					key: "_attack",
					value: function _attack(target) {
						if (this._hasBadge("peace")) {
							log.add("You cannot bring yourself to attack anyone because of the badge you are wearing!");
							return;
						}

						if (target instanceof Jenkins) {
							log.add("Attacking you immediate superior is not a good idea!");
							return true;
						}

						if (!clock.isNight() && target instanceof Customer) {
							log.add("A self-respecting waiter is not going to attack his customers! Well, at least not during the day.");
							return true;
						}

						var item = this.getActiveItem();
						if (!item) {
							log.add("You have nothing in your hands! If you want to fight, you need to ready something.");
							log.pause();
							return true;
						}

						var type = ["", "", "bravely", "courageously", "carefully"].random();
						if (type) {
							type = type + " ";
						}
						log.add("You " + type + "attack %the, with %a.", target, item);

						var defense = target.getSameItem(item);
						if (defense) {
							// defended
							var verb = ["parry", "dodge", "deflect"].random();
							log.add("Unfortunately, %he also has %a, so %he is able to " + verb + " the attack.", target, defense, target);
						} else {
							// attack success

							var amount = 1;
							if (this._hasBadge("damage")) {
								amount = 2;
							}

							target.damage(amount);
							if (target.hp > 0) {
								log.add("You manage to wound %him with the %type.", target, item);
							} else {
								log.add("You hit %him and kill %him!", target, target);
								stats.addKill();
							}

							if (ROT.RNG.getUniform() < rules.ITEM_DESTRUCT) {
								this.dropItem(item);
								log.add("Unfortunately, your %s is destroyed during the vicious fight.", item);
							}
						}
						return true;
					}
				}, {
					key: "_give",
					value: function _give(target) {
						var item = this.getActiveItem();
						if (!item) {
							log.add("You have nothing in your hands! Pick up items and ready them by pressing the corresponding number.");
							log.pause();
							return false;
						}

						log.add("You give %a to %the.", item, target);

						if (target.accept(item)) {
							this.dropItem(item);
							stats.addDelivery();

							var adv = ["happily", "eagerly", "contentedly"].random();
							var verb = ["accepts", "takes"].random();
							log.add("%He " + verb + " it " + adv + ".", target);

							map.update(target.xy);
						} else {
							var _verb = ["accept", "want"].random();
							log.add("%He does not " + _verb + " it!", target);
						}
						return true;
					}
				}]);

				return Player;
			}(Being);

			_export("default", new Player());
		}
	};
});

"use strict";

System.register("level/decorator.js", ["util/xy.js", "entity/customer.js", "entity/jenkins.js", "entity/cook.js", "entity/item/badge.js", "entity/library.js", "entity/item/library.js", "rules.js"], function (_export, _context) {
	var XY, Customer, Jenkins, Cook, Badge, entities, items, rules;


	function carvePlants(room, level, bg) {
		room.forEach(function (xy) {
			var entity = level.getEntityAt(xy);
			if (entity.blocks) {
				return;
			}

			var local = xy.minus(room.position);

			var left = local.x == 1;
			var right = local.x == room.size.x - 1;
			var top = local.y == 1;
			var bottom = local.y == room.size.y - 1;
			var corner = (left || right) && (top || bottom);

			if (corner && ROT.RNG.getUniform() < 0.3) {
				level.cells[xy] = new entities.Plant(bg);
			}
		});
	}

	function carveDoor(room, level, bg, edge) {
		var otherRoom = room.neighbors[edge];
		var a = 0,
		    b = 0;
		var positions = [];

		switch (edge) {
			case 0:
				a = Math.max(room.position.x, otherRoom.position.x) + 1;
				b = Math.min(room.position.x + room.size.x, otherRoom.position.x + otherRoom.size.x) - 1;
				break;

			case 3:
				a = Math.max(room.position.y, otherRoom.position.y) + 1;
				b = Math.min(room.position.y + room.size.y, otherRoom.position.y + otherRoom.size.y) - 1;
				break;
		}

		if ((b - a) % 2) {
			positions.push(Math.floor((a + b) / 2));
			positions.push(Math.ceil((a + b) / 2));
		} else {
			positions.push((a + b) / 2);
		}

		positions = positions.map(function (pos) {
			switch (edge) {
				case 0:
					return new XY(pos, room.position.y);break;
				case 3:
					return new XY(room.position.x, pos);break;
			}
		});

		var doors = positions.map(function (xy) {
			return level.cells[xy] = new entities.Door(xy, bg);
		});
		room.doors[edge] = doors;
		otherRoom.doors[(edge + 2) % 4] = doors;
	}

	function carveStaircase(room, level, bg, up) {
		level.cells[room.getCenter()] = new entities.Staircase(up, bg);
	}

	/* carve:
   - floor tiles if empty
   - walls if empty
   - top/left doors
 */
	function carveCommon(room, level, bg) {
		var floor = new entities.Floor(bg);
		var wallCorner = new entities.WallCorner(bg);
		var wallH = new entities.WallH(bg);
		var wallV = new entities.WallV(bg);

		room.forEach(function (xy) {
			if (xy in level.cells) {
				return;
			}
			var local = xy.minus(room.position);

			var left = local.x == 0;
			var right = local.x == room.size.x;
			var top = local.y == 0;
			var bottom = local.y == room.size.y;

			if (left || right) {
				if (top || bottom) {
					level.cells[xy] = wallCorner;
				} else {
					level.cells[xy] = wallV;
				}
				return;
			}

			if (top || bottom) {
				level.cells[xy] = wallH;
				return;
			}

			level.cells[xy] = floor;
		});

		if (room.neighbors[0]) {
			carveDoor(room, level, bg, 0);
		}
		if (room.neighbors[3]) {
			carveDoor(room, level, bg, 3);
		}
	}

	function carve(room, level) {
		var bg = void 0;

		/* pick a bg color */
		switch (room.type) {
			case "intro":
				bg = "#333";break;
			case "smoking":
				bg = "#222";break;
			case "wc":
				bg = "#224";break;
			default:
				var base = [50, 30, 10];
				bg = ROT.Color.randomize(base, 10);
				bg = ROT.Color.toRGB(bg);
				break;
		}

		/* walls, floor, doors */
		carveCommon(room, level, bg);

		if (!(room.type in carve)) return; // FIXME implement
		carve[room.type](room, level, bg);
	}

	function decorate(rooms, level) {
		rooms.forEach(function (room) {
			return carve(room, level);
		});
	}

	return {
		setters: [function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_entityCustomerJs) {
			Customer = _entityCustomerJs.default;
		}, function (_entityJenkinsJs) {
			Jenkins = _entityJenkinsJs.default;
		}, function (_entityCookJs) {
			Cook = _entityCookJs.default;
		}, function (_entityItemBadgeJs) {
			Badge = _entityItemBadgeJs.default;
		}, function (_entityLibraryJs) {
			entities = _entityLibraryJs;
		}, function (_entityItemLibraryJs) {
			items = _entityItemLibraryJs;
		}, function (_rulesJs) {
			rules = _rulesJs;
		}],
		execute: function () {
			carve.dining = function (room, level, bg) {
				var corners = [new XY(2, 2), new XY(-2, 2), new XY(-2, -2), new XY(2, -2)];
				var center = room.size.scale(0.5);

				if (room.size.x >= 8) {
					corners.push(new XY(center.x, 2));
					corners.push(new XY(center.x, -2));
				}

				if (room.size.y >= 8) {
					corners.push(new XY(2, center.y));
					corners.push(new XY(-2, center.y));
				}

				var sides = [new XY(0, 1), new XY(0, -1), new XY(1, 0), new XY(-1, 0)];

				corners.forEach(function (dxy) {
					var txy = dxy.plus(room.position);
					if (dxy.x < 0) {
						txy.x += room.size.x;
					}
					if (dxy.y < 0) {
						txy.y += room.size.y;
					}
					level.cells[txy] = new entities.Table(bg);

					sides.forEach(function (dxy) {
						var cxy = dxy.plus(txy);
						var entity = level.getEntityAt(cxy);
						if (entity.blocks || ROT.RNG.getUniform() > rules.CUSTOMER_SPAWN_TABLE) {
							return;
						}

						var customer = new Customer();
						customer.moveTo(cxy, level);
					});
				});

				carvePlants(room, level, bg);
			};

			carve.kitchen = function (room, level, bg) {
				var half = room.size.scale(0.5);
				var start = void 0,
				    diff = void 0,
				    normal = void 0,
				    length = void 0;

				if (room.size.x > room.size.y) {
					// horizontal
					start = new XY(2, half.y);
					diff = new XY(1, 0);
					length = room.size.x - 4;
				} else {
					// vertical
					start = new XY(half.x, 2);
					diff = new XY(0, 1);
					length = room.size.y - 4;
				}

				for (var i = 0; i <= length; i++) {
					var xy = room.position.plus(start).plus(diff.scale(i));
					var item = new entities.Table(bg);
					item.visual.name = "kitchen appliance";
					item.visual.ch = ["#", "&"].random();
					level.cells[xy] = item;
				}

				room.forEach(function (xy) {
					var entity = level.getEntityAt(xy);
					if (entity.blocks || ROT.RNG.getUniform() > rules.COOK_SPAWN) {
						return;
					}

					var cook = new Cook();
					cook.moveTo(xy, level);
				});

				carvePlants(room, level, bg);
			};

			carve.corridor = function (room, level, bg) {
				carve.random(room, level, bg);
			};

			carve.storage = function (room, level, bg) {
				var half = room.size.scale(0.5);
				var start = void 0,
				    diff = void 0,
				    normal = void 0,
				    length = void 0;

				if (room.size.x > room.size.y) {
					// horizontal
					start = new XY(2, half.y);
					diff = new XY(1, 0);
					length = room.size.x - 4;
				} else {
					// vertical
					start = new XY(half.x, 2);
					diff = new XY(0, 1);
					length = room.size.y - 4;
				}

				if (room.size.y < 6) {
					normal = new XY(0, 0);
				} else {
					normal = new XY(-diff.y, diff.x);
				}

				for (var i = 0; i <= length; i++) {
					var mid = room.position.plus(start).plus(diff.scale(i));
					var xy1 = mid.plus(new XY(normal.x, normal.y));
					var xy2 = mid.plus(new XY(-normal.x, -normal.y));
					level.cells[xy1] = new entities.Storage(bg);
					level.cells[xy2] = new entities.Storage(bg);
				}

				room.forEach(function (xy) {
					var entity = level.getEntityAt(xy);
					if (entity.blocks || ROT.RNG.getUniform() > rules.ITEM_SPAWN_STORAGE) {
						return;
					}

					level.items[xy] = items.create();
				});

				carvePlants(room, level, bg);
			};

			carve.wc = function (room, level, bg) {
				function toilet() {
					var t = new entities.Table(bg);
					t.visual.name = "toilet";
					t.visual.fg = "#fff";
					t.visual.ch = "o";
					return t;
				}

				function sink() {
					var s = new entities.Table(bg);
					s.visual.name = "sink";
					s.visual.fg = "#ccf";
					s.visual.ch = "o";
					return s;
				}

				var free = room.getFreeEdges();
				if (free.length) {
					var start = void 0,
					    dir = void 0,
					    count = void 0,
					    sxy = void 0;

					switch (free[0]) {
						case 0:
							start = new XY(1, 1);
							dir = new XY(1, 0);
							count = room.size.x - 1;
							sxy = new XY(room.size.x - 1, room.size.y - 1);
							break;

						case 1:
							start = new XY(room.size.x - 1, 1);
							dir = new XY(0, 1);
							count = room.size.y - 1;
							sxy = new XY(1, room.size.y - 1);
							break;

						case 2:
							start = new XY(1, room.size.y - 1);
							dir = new XY(1, 0);
							count = room.size.x - 1;
							sxy = new XY(1, 1);
							break;

						case 3:
							start = new XY(1, 1);
							dir = new XY(0, 1);
							count = room.size.y - 1;
							sxy = new XY(room.size.x - 1, 1);
							break;
					}

					start = start.plus(room.position);

					for (var i = 0; i < count; i += 2) {
						var xy = start.plus(dir.scale(i));
						level.cells[xy] = toilet();
					}

					level.cells[sxy.plus(room.position)] = sink();
				} else {
					var corners = [new XY(-1, -1), new XY(1, 1), new XY(1, -1), new XY(-1, 1)];

					corners.forEach(function (dxy) {
						var xy = dxy.plus(room.position);
						if (dxy.x < 0) {
							xy.x += room.size.x;
						}
						if (dxy.y < 0) {
							xy.y += room.size.y;
						}
						level.cells[xy] = ROT.RNG.getUniform() > 0.75 ? sink() : toilet();
					});
				}
			};

			carve.pool = function (room, level, bg) {
				var size = new XY(2, 2);
				if (room.size.y > room.size.y) {
					size.x++;
				}
				if (room.size.x > room.size.y) {
					size.x++;
				}
				if (room.size.y <= 4) {
					size.y = 1;
				}

				var pos = room.position.plus(room.size.minus(size).scale(0.5));
				pos.x++;
				pos.y++;

				for (var i = 0; i < size.x; i++) {
					for (var j = 0; j < size.y; j++) {
						var xy = new XY(pos.x + i, pos.y + j);
						var table = new entities.Table(bg);
						table.visual.name = "billiard table";
						table.visual.fg = "#282";
						level.cells[xy] = table;
					}
				}

				carve.random(room, level, bg);
			};

			carve.smoking = function (room, level, bg) {
				var chairs = [new XY(-1, -1), new XY(1, 1), new XY(1, -1), new XY(-1, 1)];

				var center = room.getCenter();
				chairs.forEach(function (dxy) {
					var xy = center.plus(dxy);
					var chair = new entities.Table(bg);
					chair.visual.ch = "h";
					chair.visual.name = "comfortable chair";
					level.cells[xy] = chair;
				});

				carve.random(room, level, bg);
			};

			carve.intro = function (room, level, bg) {
				var xy = room.position.plus(new XY(1, 1));
				var floor = level.cells[xy];
				floor.visual.ch = ".";
				floor.visual.fg = "#282828";

				var doorXY = room.position.clone();
				doorXY.x += Math.floor(room.size.x / 2);
				doorXY.y += room.size.y;
				level.cells[doorXY] = new entities.DoorHome(doorXY, bg);
			};

			carve.center = function (room, level, bg) {
				var corners = [new XY(1, 1), new XY(-1, 1)];
				var corner = corners.random();
				var xy = room.position.plus(corner);
				if (corner.x < 0) {
					xy.x += room.size.x;
				}
				if (corner.y < 0) {
					xy.y += room.size.y;
				}

				var doors = [];
				for (var dir in room.doors) {
					if (dir == 2) {
						continue;
					} // do not lock entry door
					var d = room.doors[dir];
					if (d) {
						doors = doors.concat(d);
					}
				}

				var jenkins = new Jenkins(doors);
				jenkins.moveTo(xy, level);

				var desk = new entities.Table(bg);;
				desk.visual.name = "desk";
				xy = xy.plus(corner);
				level.cells[xy] = desk;

				carvePlants(room, level, bg);
			};

			carve.random = function (room, level, bg) {
				carvePlants(room, level, bg);

				room.forEach(function (xy) {
					var entity = level.getEntityAt(xy);
					if (entity.blocks) {
						return;
					}

					if (ROT.RNG.getUniform() < rules.CUSTOMER_SPAWN_RANDOM) {
						var customer = new Customer();
						customer.moveTo(xy, level);
					} else if (ROT.RNG.getUniform() < rules.ITEM_SPAWN_RANDOM) {
						level.items[xy] = items.create();
					} else if (ROT.RNG.getUniform() < rules.BADGE_SPAWN) {
						level.items[xy] = Badge.create();
					}
				});
			};

			carve["staircase-up"] = function (room, level, bg) {
				carvePlants(room, level, bg);
				carveStaircase(room, level, bg, true);
			};

			carve["staircase-down"] = function (room, level, bg) {
				carvePlants(room, level, bg);
				carveStaircase(room, level, bg, false);
			};

			carve["badge"] = function (room, level, bg) {
				carvePlants(room, level, bg);
				level.items[room.getCenter()] = Badge.create();
			};

			_export("default", decorate);
		}
	};
});

"use strict";

System.register("level/generator.js", ["./room.js", "util/xy.js"], function (_export, _context) {
	var Room, XY, availableRooms;
	function generator(limit) {
		var count = 1;
		var allRooms = [new Room({ position: new XY(0, 0) })];

		while (allRooms.filter(function (room) {
			return room.type != "corridor";
		}).length < limit) {

			var freeRooms = allRooms.filter(function (room) {
				return room.getFreeEdges().length > 0;
			});
			if (!freeRooms.length) {
				alert("no free rooms :/");
				break;
			}

			var oldRoom = freeRooms.random();
			var edge = oldRoom.getFreeEdges().random();
			var newRoom = availableRooms.random().clone();

			if (!(edge in newRoom.neighbors)) {
				continue;
			}

			newRoom.positionNextTo(oldRoom, edge);
			if (newRoom.position.y > allRooms[0].position.y) {
				continue;
			}

			if (newRoom.fitsInto(allRooms)) {
				count++;
				if (ROT.RNG.getUniform() > 0.5 || !oldRoom.mergeWith(newRoom, edge)) {
					/* add a new different room */
					allRooms.push(newRoom);
					oldRoom.neighbors[edge] = newRoom;
					newRoom.neighbors[(edge + 2) % 4] = oldRoom;
				}
			}
		}

		allRooms = allRooms.filter(function (room) {
			if (room.type != "corridor") {
				return true;
			}
			if (room.getFreeEdges().length > 0) {
				room.getUsedEdges().forEach(function (edge) {
					var otherRoom = room.neighbors[edge];
					otherRoom.neighbors[(edge + 2) % 4] = false;
				});
				return false;
			}
			return true;
		});

		return allRooms;
	}

	_export("default", generator);

	return {
		setters: [function (_roomJs) {
			Room = _roomJs.default;
		}, function (_utilXyJs) {
			XY = _utilXyJs.default;
		}],
		execute: function () {
			availableRooms = [new Room({ type: "", size: new XY(6, 4) }), new Room({ type: "", size: new XY(8, 5) }), new Room({ type: "", size: new XY(10, 6) }), new Room({ type: "", size: new XY(12, 8) }), new Room({ type: "", size: new XY(14, 10) }), new Room({ type: "", size: new XY(12, 6) }), new Room({ type: "", size: new XY(6, 10) }), new Room({ type: "corridor", size: new XY(4, 8), neighbors: { 0: false, 2: false } }), new Room({ type: "corridor", size: new XY(5, 8), neighbors: { 0: false, 2: false } }), new Room({ type: "corridor", size: new XY(10, 4), neighbors: { 1: false, 3: false } }), new Room({ type: "corridor", size: new XY(10, 5), neighbors: { 1: false, 3: false } })];
		}
	};
});

"use strict";

System.register("level/level.js", ["./generator.js", "./decorator.js", "util/xy.js", "./room.js"], function (_export, _context) {
	var generator, decorator, XY, Room, _createClass, Level, BaseLevel, CentralLevel;

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function findFurthest(rooms, start) {
		var bestDist = 0;
		var bestRoom = null;

		function visit(room, arrivedDirection, dist) {
			if (dist > bestDist) {
				bestDist = dist;
				bestRoom = room;
			}

			var edges = room.getUsedEdges();
			if (arrivedDirection !== null) {
				arrivedDirection = (arrivedDirection + 2) % 4;
				edges = edges.filter(function (edge) {
					return edge != arrivedDirection;
				});
			}

			edges.forEach(function (edge) {
				var newRoom = room.neighbors[edge];
				visit(newRoom, edge, dist + 1);
			});
		}

		visit(start, null, 0);
		return bestRoom;
	}

	return {
		setters: [function (_generatorJs) {
			generator = _generatorJs.default;
		}, function (_decoratorJs) {
			decorator = _decoratorJs.default;
		}, function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_roomJs) {
			Room = _roomJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_export("Level", Level = function () {
				function Level() {
					_classCallCheck(this, Level);

					this.id = Math.random().toString();
					this.cells = {};
					this.items = {};
					this.beings = {};
					this.rooms = generator(20);
				}

				_createClass(Level, [{
					key: "getEntry",
					value: function getEntry() {
						var xy = this.rooms[0].position.clone();
						xy.x += Math.floor(this.rooms[0].size.x / 2);
						xy.y += this.rooms[0].size.y - 1;
						return xy;
					}
				}, {
					key: "getEntityAt",
					value: function getEntityAt(xy) {
						return this.beings[xy] || this.items[xy] || this.cells[xy];
					}
				}, {
					key: "getRoomsAt",
					value: function getRoomsAt(xy) {
						return this.rooms.filter(function (room) {
							return room.contains(xy);
						});
					}
				}, {
					key: "getVisibleRooms",
					value: function getVisibleRooms(xy) {
						var rooms = this.getRoomsAt(xy);
						rooms.forEach(function (room) {
							room.getUsedEdges().forEach(function (edge) {
								var doors = room.doors[edge];
								if (doors.every(function (door) {
									return door.blocks;
								})) {
									return;
								} // every door closed

								var neighbor = room.neighbors[edge];
								if (rooms.indexOf(neighbor) == -1) {
									rooms.push(neighbor);
								}
							});
						});

						return rooms;
					}
				}]);

				return Level;
			}());

			_export("Level", Level);

			_export("BaseLevel", BaseLevel = function (_Level) {
				_inherits(BaseLevel, _Level);

				function BaseLevel(up) {
					_classCallCheck(this, BaseLevel);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BaseLevel).call(this));

					var root = _this.rooms[0];
					var leaf1 = findFurthest(_this.rooms, root);
					leaf1.type = "staircase-" + (up ? "up" : "down");

					var leaf2 = findFurthest(_this.rooms, leaf1);
					leaf2.type = "badge";

					decorator(_this.rooms, _this);
					return _this;
				}

				return BaseLevel;
			}(Level));

			_export("BaseLevel", BaseLevel);

			_export("CentralLevel", CentralLevel = function (_Level2) {
				_inherits(CentralLevel, _Level2);

				function CentralLevel() {
					_classCallCheck(this, CentralLevel);

					var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(CentralLevel).call(this));

					var root = _this2.rooms[0];
					root.type = "center";

					var leaf1 = findFurthest(_this2.rooms, root);
					leaf1.type = "staircase-down";

					var leaf2 = findFurthest(_this2.rooms, leaf1);
					leaf2.type = "staircase-up";

					var introRoom = new Room({ type: "intro", size: new XY(6, 16) });
					introRoom.positionNextTo(root, 2);
					root.neighbors[2] = introRoom;
					introRoom.neighbors[0] = root;

					_this2.rooms.shift();
					_this2.rooms.push(root); // move center room to the end; we need it to have all doors carved
					_this2.rooms.unshift(introRoom);
					decorator(_this2.rooms, _this2);
					return _this2;
				}

				return CentralLevel;
			}(Level));

			_export("CentralLevel", CentralLevel);
		}
	};
});

"use strict";

System.register("level/room.js", ["util/xy.js"], function (_export, _context) {
	var XY, _createClass, TYPES, NAMES, Room;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_utilXyJs) {
			XY = _utilXyJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			TYPES = {
				"storage": 5,
				"kitchen": 4,
				"dining": 5,
				"smoking": 3,
				"pool": 3
			};
			NAMES = {
				"storage": "storage room, full of food and beverages",
				"kitchen": "kitchen",
				"dining": "dining area with tables and café guests sitting around",
				"pool": "billiard room",
				"smoking": "smoking room",
				"wc": "small restroom"
			};

			Room = function () {
				function Room(props) {
					_classCallCheck(this, Room);

					this.type = "";
					this.neighbors = {
						0: false,
						1: false,
						2: false,
						3: false
					};
					this.doors = {};
					this.size = new XY(8, 5);
					this.position = new XY();

					Object.assign(this, props);

					if (this.type == "") {
						if (this.size.x < 9 && this.size.y < 9 && ROT.RNG.getUniform() > 0.5) {
							this.type = "wc";
						} else {
							this.type = ROT.RNG.getWeightedValue(TYPES);
						}
					}
				}

				_createClass(Room, [{
					key: "toString",
					value: function toString() {
						if (this.type == "staircase-up") {
							return "room with a staircase leading up";
						} else if (this.type == "staircase-down") {
							return "room with a staircase leading down";
						} else if (this.type == "corridor") {
							var max = Math.max(this.size.x, this.size.y);
							var min = Math.min(this.size.x, this.size.y);
							if (max / min > 2) {
								return "long corridor";
							} else {
								return "short corridor";
							}
						} else {
							return NAMES[this.type] || "";
						}
					}
				}, {
					key: "clone",
					value: function clone() {
						return new this.constructor({
							type: this.type,
							size: this.size.clone(),
							position: this.position.clone(),
							neighbors: Object.assign({}, this.neighbors)
						});
					}
				}, {
					key: "getCenter",
					value: function getCenter() {
						return this.size.scale(0.5).plus(this.position);
					}
				}, {
					key: "forEach",
					value: function forEach(cb) {
						for (var i = 0; i <= this.size.x; i++) {
							for (var j = 0; j <= this.size.y; j++) {
								var xy = new XY(this.position.x + i, this.position.y + j);
								cb(xy);
							}
						}
					}
				}, {
					key: "contains",
					value: function contains(xy) {
						return xy.x >= this.position.x && xy.x <= this.position.x + this.size.x && xy.y >= this.position.y && xy.y <= this.position.y + this.size.y;
					}
				}, {
					key: "positionNextTo",
					value: function positionNextTo(otherRoom, edge) {
						switch (edge) {
							case 0:
								// top
								this.align("x", otherRoom);
								this.position.y = otherRoom.position.y - this.size.y;
								break;

							case 1:
								// right
								this.position.x = otherRoom.position.x + otherRoom.size.x;
								this.align("y", otherRoom);
								break;

							case 2:
								// bottom
								this.align("x", otherRoom);
								this.position.y = otherRoom.position.y + otherRoom.size.y;
								break;

							case 3:
								// left
								this.position.x = otherRoom.position.x - this.size.x;
								this.align("y", otherRoom);
								break;
						}
					}
				}, {
					key: "mergeWith",
					value: function mergeWith(otherRoom, edge) {
						if (otherRoom.type != this.type) {
							return false;
						}
						var prop = edge % 2 ? "y" : "x";
						if (this.size[prop] != otherRoom.size[prop]) {
							return false;
						}

						switch (edge) {
							case 0:
								// top
								this.size.y += otherRoom.size.y;
								this.position.y -= otherRoom.size.y;
								break;

							case 1:
								// right
								this.size.x += otherRoom.size.x;
								break;

							case 2:
								// bottom
								this.size.y += otherRoom.size.y;
								break;

							case 3:
								// left
								this.size.x += otherRoom.size.x;
								this.position.x -= otherRoom.size.x;
								break;
						}

						return true;
					}
				}, {
					key: "align",
					value: function align(prop, otherRoom) {
						var offset = void 0;
						var max = 2;
						if (this.type == "corridor" || otherRoom.type == "corridor") {
							max = 1;
						}

						switch (ROT.RNG.getUniformInt(0, max)) {
							case 0:
								offset = 0;
								break;

							case 1:
								offset = otherRoom.size[prop] - this.size[prop];
								break;

							case 2:
								offset = (otherRoom.size[prop] - this.size[prop]) / 2;
								break;
						}
						this.position[prop] = otherRoom.position[prop] + Math.round(offset);
					}
				}, {
					key: "fitsInto",
					value: function fitsInto(rooms) {
						var _this = this;

						return !rooms.some(function (otherRoom) {
							return otherRoom.intersects(_this);
						});
					}
				}, {
					key: "intersects",
					value: function intersects(otherRoom) {
						/* this is left */
						if (this.position.x + this.size.x <= otherRoom.position.x) {
							return false;
						}
						/* this is right */
						if (this.position.x >= otherRoom.position.x + otherRoom.size.x) {
							return false;
						}
						/* this is top */
						if (this.position.y + this.size.y <= otherRoom.position.y) {
							return false;
						}
						/* this is bottom */
						if (this.position.y >= otherRoom.position.y + otherRoom.size.y) {
							return false;
						}

						return true;
					}
				}, {
					key: "getFreeEdges",
					value: function getFreeEdges() {
						var _this2 = this;

						return Object.keys(this.neighbors).filter(function (edge) {
							return !_this2.neighbors[edge];
						}).map(Number);
					}
				}, {
					key: "getUsedEdges",
					value: function getUsedEdges() {
						var _this3 = this;

						return Object.keys(this.neighbors).filter(function (edge) {
							return _this3.neighbors[edge];
						}).map(Number);
					}
				}]);

				return Room;
			}();

			_export("default", Room);
		}
	};
});

"use strict";

System.register("rules.js", [], function (_export, _context) {
  var PLAYER_HP, CUSTOMER_SPAWN_TABLE, CUSTOMER_SPAWN_RANDOM, ITEM_SPAWN_STORAGE, ITEM_SPAWN_RANDOM, ITEM_DESTRUCT, COOK_SPAWN, BADGE_SPAWN, AI_RANGE, AI_IDLE, REGENERATION, TICK_MINUTES;
  return {
    setters: [],
    execute: function () {
      _export("PLAYER_HP", PLAYER_HP = 10);

      _export("PLAYER_HP", PLAYER_HP);

      _export("CUSTOMER_SPAWN_TABLE", CUSTOMER_SPAWN_TABLE = .2);

      _export("CUSTOMER_SPAWN_TABLE", CUSTOMER_SPAWN_TABLE);

      _export("CUSTOMER_SPAWN_RANDOM", CUSTOMER_SPAWN_RANDOM = .05);

      _export("CUSTOMER_SPAWN_RANDOM", CUSTOMER_SPAWN_RANDOM);

      _export("ITEM_SPAWN_STORAGE", ITEM_SPAWN_STORAGE = .1);

      _export("ITEM_SPAWN_STORAGE", ITEM_SPAWN_STORAGE);

      _export("ITEM_SPAWN_RANDOM", ITEM_SPAWN_RANDOM = .04);

      _export("ITEM_SPAWN_RANDOM", ITEM_SPAWN_RANDOM);

      _export("ITEM_DESTRUCT", ITEM_DESTRUCT = .5);

      _export("ITEM_DESTRUCT", ITEM_DESTRUCT);

      _export("COOK_SPAWN", COOK_SPAWN = .05);

      _export("COOK_SPAWN", COOK_SPAWN);

      _export("BADGE_SPAWN", BADGE_SPAWN = .01);

      _export("BADGE_SPAWN", BADGE_SPAWN);

      _export("AI_RANGE", AI_RANGE = 7);

      _export("AI_RANGE", AI_RANGE);

      _export("AI_IDLE", AI_IDLE = .5);

      _export("AI_IDLE", AI_IDLE);

      _export("REGENERATION", REGENERATION = .04);

      _export("REGENERATION", REGENERATION);

      _export("TICK_MINUTES", TICK_MINUTES = 1.5);

      _export("TICK_MINUTES", TICK_MINUTES);
    }
  };
});

"use strict";

System.register("stats.js", [], function (_export, _context) {
	var ts, deliveries, kills, turns, node;
	return {
		setters: [],
		execute: function () {
			ts = 0;
			deliveries = 0;
			kills = 0;
			turns = 0;
			node = document.querySelector("#gameover");

			node.parentNode.removeChild(node);

			function start() {
				ts = Date.now();
			}

			_export("start", start);

			function addDelivery() {
				deliveries++;
			}

			_export("addDelivery", addDelivery);

			function addKill() {
				kills++;
			}

			_export("addKill", addKill);

			function addTurn() {
				turns++;
			}

			_export("addTurn", addTurn);

			function showGameOver(alive) {
				var time = (Date.now() - ts) / (1000 * 60);

				node.querySelector(".status").classList.add(alive ? "alive" : "dead");
				node.querySelector(".status").innerHTML = alive ? "ALIVE" : "DEAD";
				node.querySelector(".deliveries").innerHTML = deliveries;
				node.querySelector(".kills").innerHTML = kills;
				node.querySelector(".turns").innerHTML = turns;
				node.querySelector(".time").innerHTML = time.toFixed(1) + " minutes";

				var parent = document.querySelector("#map");
				node.classList.add("hidden");
				parent.appendChild(node);
				node.offsetWidth;
				node.classList.remove("hidden");
			}

			_export("showGameOver", showGameOver);
		}
	};
});

"use strict";

System.register("tutorial.js", ["ui/log.js", "entity/library.js", "ui/bump.js", "util/xy.js", "util/pubsub.js", "level/level.js"], function (_export, _context) {
	var uilog, entities, bump, XY, pubsub, BaseLevel, turns, level, flags;


	function log() {
		for (var i = 0; i < arguments.length; i++) {
			uilog.add("<span class=\"tutorial\">" + arguments[i] + "</span>");
		}
		uilog.pause();
	}

	function clock(message, publisher, night) {
		if (night) {
			log("%c{#f00}Night falls!%c{}");
		} else {
			log("%c{#00f}A new day dawns.%c{}");
		}

		if (!night) {
			return;
		}
		if (flags.nightSeen) {
			return;
		}

		flags.nightSeen = true;
		bump.enable("attack");
		log("Word has it that during the night, working in Café Havoc might be a bit tricky.", "That is why you can now use the %c{#fff}a%c{}ttack interaction mode, just in case.");
	}

	function start(l) {
		level = l;
		pubsub.subscribe("clock", clock);

		log("Good morning!");

		log("This is it, your grand day, first day in a new job.", "Working in this big Café is going to be exciting!");

		log("Let's get to work as soon as possible.", "It would be a shame to come late...");
	}

	function describe() {
		if (flags.seenJenkins) {
			return;
		}

		flags.seenJenkins = true;
		bump.enable("chat");

		log("When you bump into people, different things can happen based on the current interaction mode.", "The bottom menu shows available actions.", "Try switching to the %c{#fff}c%c{}hat mode to talk to Jenkins.");
	}

	function pickItem(item) {
		if (flags.pickedItem || item.type == "badge") {
			return;
		}

		flags.pickedItem = true;
		bump.enable("give");

		uilog.pause();

		log("You just picked up an item!", "This means you can give it to somebody else.");

		log("All your items are available in the bottom menu.", "Additionally, you can have one of them readied to be given away.", "To give stuff away, do not forget to change your interaction mode to %c{#fff}g%c{}ive!");
	}

	function moveTo(xy, l) {
		turns++;

		if (turns == 5) {
			log("As you already found out, movement is controlled with %c{#fff}arrow keys%c{} or %c{#fff}vi-keys%c{}.", "Press %c{#fff}.%c{} to wait (skip a turn).");
		}

		if (turns == 10) {
			log("By the way, the game map can be zoomed using the %c{#fff}<strong>+</strong>%c{} and %c{#fff}<strong>&minus;</strong>%c{} keys.");
		}

		var topCell = level.cells[xy.plus(new XY(0, -1))];
		if (!flags.seenDoor && topCell instanceof entities.Door) {
			flags.seenDoor = true;
			log("You stand in front of a large door labeled %c{#aaf}Café Havoc%c{}.", "Good luck on your first day!");
		}

		if (!flags.levelChanged && l instanceof BaseLevel) {
			flags.levelChanged = true;
			uilog.pause();

			log("A-ha! Café Havoc apparently has more floors.", "More specifically, three: a starting central-level, one upper and one lower.", "You just entered one of these terminal levels.");
		}
	}

	return {
		setters: [function (_uiLogJs) {
			uilog = _uiLogJs;
		}, function (_entityLibraryJs) {
			entities = _entityLibraryJs;
		}, function (_uiBumpJs) {
			bump = _uiBumpJs;
		}, function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}, function (_levelLevelJs) {
			BaseLevel = _levelLevelJs.BaseLevel;
		}],
		execute: function () {
			turns = 0;
			level = null;
			flags = {
				seenDoor: false,
				seenJenkins: false,
				pickedItem: false,
				nightSeen: false,
				levelChanged: false
			};

			_export("start", start);

			_export("describe", describe);

			_export("moveTo", moveTo);

			_export("pickItem", pickItem);
		}
	};
});

"use strict";

System.register("ui/bump.js", [], function (_export, _context) {
	var DOM, DEF, active;
	return {
		setters: [],
		execute: function () {
			DOM = {
				parent: document.querySelector("#bump"),
				items: {}
			};
			DEF = [{ id: "describe", key: "d", label: "<em>d</em>escribe", enabled: true }, { id: "chat", key: "c", label: "<em>c</em>hat", enabled: false }, { id: "give", key: "g", label: "<em>g</em>ive", enabled: false }, { id: "attack", key: "a", label: "<em>a</em>ttack", enabled: false }];
			active = "";
			function init() {
				DOM.parent.classList.add("hidden");
				DEF.forEach(function (item) {
					var node = document.createElement("li");
					if (!item.enabled) {
						node.classList.add("hidden");
					}
					node.innerHTML = item.label;
					DOM.parent.appendChild(node);
					DOM.items[item.id] = node;
				});

				activate("describe");
			}

			_export("init", init);

			function getDefinition() {
				return DEF;
			}

			_export("getDefinition", getDefinition);

			function activate(id) {
				var item = DEF.filter(function (item) {
					return item.id == id;
				})[0];
				if (!item.enabled) {
					return;
				}
				active = id;

				for (var _id in DOM.items) {
					var node = DOM.items[_id];
					node.classList[_id == active ? "add" : "remove"]("active");
				}
			}

			_export("activate", activate);

			function getActive() {
				return active;
			}

			_export("getActive", getActive);

			function enable(id) {
				DOM.parent.classList.remove("hidden");
				DOM.items[id].classList.remove("hidden");
				var item = DEF.filter(function (item) {
					return item.id == id;
				})[0];
				item.enabled = true;
			}

			_export("enable", enable);
		}
	};
});

"use strict";

System.register("ui/intro.js", ["util/command.js"], function (_export, _context) {
	var command, node, resolve;


	function show() {
		command.register("intro:end", "space", hide);
		return new Promise(function (res, rej) {
			return resolve = res;
		});
	}

	function hide() {
		command.disable("intro:");
		node.parentNode.removeChild(node);
		resolve();
	}

	return {
		setters: [function (_utilCommandJs) {
			command = _utilCommandJs;
		}],
		execute: function () {
			node = document.querySelector("#intro");
			resolve = null;

			_export("show", show);
		}
	};
});

"use strict";

System.register("ui/inventory.js", [], function (_export, _context) {
	var DOM, names, counts, active, items;
	// item instances in the player's inventory

	function findFreeIndex(offset) {
		for (var i = offset; i < names.length; i++) {
			if (!names[i]) {
				return i;
			}
		}
		return -1;
	}

	function discover(what, offset) {
		what.forEach(function (item) {
			var name = item.visual.short;
			var index = names.indexOf(name);

			if (index == -1) {
				/* not yet found */
				index = findFreeIndex(offset);
				names[index] = name;
				DOM.items[index].style.color = item.visual.fg;
			}

			counts[index]++;
		});
	}

	function redraw() {
		DOM.items.forEach(function (node, index) {
			node.innerHTML = "";
			node.className = "";
			if (counts[index] == 0) {
				return;
			}

			node.innerHTML = names[index];
			if (index == active) {
				node.className = "active";
			}
		});
	}

	return {
		setters: [],
		execute: function () {
			DOM = {
				parent: document.querySelector("#inventory"),
				items: [],
				badge: document.querySelector("#badge")
			};
			names = [];
			counts = [];
			active = -1;
			items = [];
			function init() {
				DOM.parent.innerHTML = "";

				for (var i = 0; i < 8; i++) {
					var item = document.createElement("li");
					DOM.parent.appendChild(item);
					DOM.items.push(item);

					names.push("");
					counts.push(0);
				}
			}

			_export("init", init);

			function update(inv) {
				if (inv.badge) {
					DOM.badge.style.color = inv.badge.visual.fg;
					DOM.badge.innerHTML = "%S".format(inv.badge);
				}

				counts = counts.map(function (count) {
					return 0;
				});
				discover(inv.foods, 0);
				discover(inv.drinks, 4);
				items = [].concat(inv.foods).concat(inv.drinks);
				activate(active); // re-activate to sync missing items
				redraw();
			}

			_export("update", update);

			function activate(index) {
				if (counts[index] > 0) {
					active = index;
					redraw();
				} else {
					active = -1;
				}
			}

			_export("activate", activate);

			function getActive() {
				if (active == -1) {
					return null;
				}
				var name = names[active];
				return items.filter(function (item) {
					return item.visual.short == name;
				})[0];
			}

			_export("getActive", getActive);
		}
	};
});

"use strict";

System.register("ui/log.js", [], function (_export, _context) {
	var node, current;
	return {
		setters: [],
		execute: function () {
			node = document.querySelector("#log");
			current = null;
			function add() {
				var str = String.format.apply(String, arguments);
				while (1) {
					var matched = false;
					str = str.replace(/%([cb]?){([^}]*)}/, function (match, type, color) {
						matched = true;
						type = { c: "color", b: "background-color" }[type];
						return color ? "<span style=\"" + type + ": " + color + "\">" : "</span>";
					});
					if (!matched) {
						break;
					}
				}

				var item = document.createElement("span");
				item.className = "hidden";
				item.innerHTML = str + " ";
				current.appendChild(item);
				item.offsetWidth;
				item.className = "";
			}

			_export("add", add);

			function pause() {
				if (current && current.childNodes.length == 0) {
					return;
				}
				current = document.createElement("p");
				node.appendChild(current);

				while (node.childNodes.length > 50) {
					node.removeChild(node.firstChild);
				}
			}

			_export("pause", pause);

			pause();
		}
	};
});

"use strict";

System.register("ui/map.js", ["util/xy.js", "util/command.js", "actors.js", "entity/player.js"], function (_export, _context) {
	var XY, command, actors, player, level, options, display, center, zooming, visibleRooms, memory, memories, parent;


	// data XY to display XY; center = middle point
	function dataToDisplay(xy) {
		var half = new XY(options.width, options.height).scale(0.5);

		return xy.minus(center).plus(half);
	}

	// display XY to data XY; middle point = center
	function displayToData(xy) {
		var half = new XY(options.width, options.height).scale(0.5);

		return xy.minus(half).plus(center);
	}

	function fit() {
		var node = display.getContainer();
		var avail = new XY(parent.offsetWidth, parent.offsetHeight);

		var size = display.computeSize(avail.x, avail.y);
		size[0] += size[0] % 2 ? 2 : 1;
		size[1] += size[1] % 2 ? 2 : 1;
		options.width = size[0];
		options.height = size[1];
		display.setOptions(options);

		var current = new XY(node.offsetWidth, node.offsetHeight);
		var offset = avail.minus(current).scale(0.5);
		node.style.left = offset.x + "px";
		node.style.top = offset.y + "px";
	}

	function changeZoom(diff) {
		if (zooming) {
			return;
		}
		zooming = true;
		var scale = (options.fontSize + diff) / options.fontSize;
		var delay = 200;

		var oldNode = display.getContainer();
		oldNode.style.transition = "transform " + delay + "ms ease-out";
		oldNode.style.transform = "scale(" + scale + ")";

		options.fontSize += diff;
		var newDisplay = new ROT.Display(options);
		var newNode = newDisplay.getContainer();

		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				display = newDisplay;
				oldNode.parentNode.replaceChild(newNode, oldNode);
				fit();
				setCenter(center); // redraw all
				zooming = false;
				resolve();
			}, delay);
		});
	}

	function init(parent) {
		fit();

		window.addEventListener("resize", function (e) {
			fit();
			setCenter(center);
		});
	}

	function setLevel(l, entry) {
		actors.clear();

		if (level) {
			memories[level.id] = memory;
		}
		level = l;
		memory = memories[level.id] || {};
		visibleRooms = [];

		player.moveTo(entry, level);

		for (var xy in level.beings) {
			var b = level.beings[xy];
			actors.add(b);
		}
	}

	function darken(color) {
		if (!color) {
			return color;
		}
		return ROT.Color.toRGB(ROT.Color.fromString(color).map(function (x) {
			return x >> 1;
		}));
	}

	function memoize(xy) {
		var key = xy.toString();
		var visual = level.cells[key].visual;
		memory[key] = {
			ch: visual.ch,
			fg: darken(visual.fg),
			bg: darken(visual.bg)
		};
		update(xy);
	}

	function setVisibleRooms(newlyVisibleRooms) {
		visibleRooms.forEach(function (room, index) {
			var newIndex = newlyVisibleRooms.indexOf(room);
			if (newIndex > -1) {
				// remains visible
				newlyVisibleRooms.splice(newIndex, 1); // does not need redraw
			} else {
					// no longer visible
					visibleRooms[index] = null;
					room.forEach(memoize);
				}
		});

		/* prune no-more-visible rooms */
		for (var i = visibleRooms.length - 1; i >= 0; i--) {
			if (!visibleRooms[i]) {
				visibleRooms.splice(i, 1);
			}
		}

		newlyVisibleRooms.forEach(function (room) {
			// newly visible
			visibleRooms.push(room);
			room.forEach(function (xy) {
				var key = xy.toString();
				if (key in memory) {
					delete memory[key];
				}
				update(xy);
			});
		});
	}

	function setCenter(newCenter) {
		center = newCenter.clone();
		display.clear();

		var xy = new XY();
		for (var i = 0; i < options.width; i++) {
			xy.x = i;
			for (var j = 0; j < options.height; j++) {
				xy.y = j;
				update(displayToData(xy));
			}
		}
	}

	function update(xy) {
		var fgVisual = void 0,
		    bgVisual = void 0;
		if (visibleRooms.some(function (room) {
			return room /* before pruning in setVisibleRooms */ && room.contains(xy);
		})) {
			// visible area, draw from current data
			var entity = level.getEntityAt(xy);
			if (!entity) {
				return;
			}
			fgVisual = entity.visual;
			bgVisual = level.cells[xy].visual;
		} else if (xy in memory) {
			// memoized area, draw from memory
			fgVisual = bgVisual = memory[xy];
		} else {
			// invisible area, abort
			return;
		}

		var displayXY = dataToDisplay(xy);
		display.draw(displayXY.x, displayXY.y, fgVisual.ch, fgVisual.fg, bgVisual.bg);
	}

	return {
		setters: [function (_utilXyJs) {
			XY = _utilXyJs.default;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_actorsJs) {
			actors = _actorsJs;
		}, function (_entityPlayerJs) {
			player = _entityPlayerJs.default;
		}],
		execute: function () {
			level = null;
			options = {
				width: 1,
				height: 1,
				fontSize: 22,
				fontFamily: "metrickal, droid sans mono, monospace"
			};
			display = new ROT.Display(options);
			center = new XY(0, 0);
			zooming = false;
			visibleRooms = [];
			memory = {};
			memories = {};
			parent = document.querySelector("#map");

			parent.appendChild(display.getContainer());command.register("map:zoom-in", "+", function () {
				return changeZoom(+2);
			});
			command.register("map:zoom-out", "-", function () {
				return changeZoom(-2);
			});

			_export("init", init);

			_export("setLevel", setLevel);

			_export("setCenter", setCenter);

			_export("setVisibleRooms", setVisibleRooms);

			_export("update", update);
		}
	};
});

"use strict";

System.register("util/command.js", ["./keyboard.js", "./pubsub.js"], function (_export, _context) {
	var keyboard, pubsub, registry;
	return {
		setters: [function (_keyboardJs) {
			keyboard = _keyboardJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			registry = {};
			function register(command, keys, func) {
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

				[].concat(keys || []).forEach(function (key) {
					return keyboard.register(wrap, key);
				});

				return command;
			}

			_export("register", register);

			function enable(command) {
				Object.keys(registry).filter(function (c) {
					return c.match(command);
				}).forEach(function (c) {
					return registry[c].enabled = true;
				});
				pubsub.publish("command-enable", command);
			}

			_export("enable", enable);

			function disable(command) {
				Object.keys(registry).filter(function (c) {
					return c.match(command);
				}).forEach(function (c) {
					return registry[c].enabled = false;
				});
				pubsub.publish("command-disable", command);
			}

			_export("disable", disable);

			function isEnabled(command) {
				return registry[command].enabled;
			}

			_export("isEnabled", isEnabled);

			function execute(command) {
				return registry[command].func();
			}

			_export("execute", execute);
		}
	};
});

"use strict";

System.register("util/keyboard.js", [], function (_export, _context) {
	var codes, modifiers, registry;


	function handler(e) {
		var available = registry.filter(function (reg) {
			if (reg.type != e.type) {
				return false;
			}

			for (var m in reg.modifiers) {
				if (reg.modifiers[m] != e[m]) {
					return false;
				}
			}

			var code = e.type == "keypress" ? e.charCode : e.keyCode;
			if (reg.code != code) {
				return false;
			}

			return true;
		});

		var index = available.length;
		if (!index) {
			return;
		}

		while (index-- > 0) {
			var executed = available[index].func();
			if (executed) {
				return;
			}
		}
	}

	function parse(key) {
		var result = {
			func: null,
			modifiers: {}
		};

		key = key.toLowerCase();

		modifiers.forEach(function (mod) {
			var key = mod + "Key";
			result.modifiers[key] = false;

			var re = new RegExp(mod + "[+-]");
			key = key.replace(re, function () {
				result.modifiers[key] = true;
				return "";
			});
		});

		if (key.length == 1) {
			result.code = key.charCodeAt(0);
			result.type = "keypress";
		} else {
			if (!(key in codes)) {
				throw new Error("Unknown keyboard code " + key);
			}
			result.code = codes[key];
			result.type = "keydown";
		}

		return result;
	}

	return {
		setters: [],
		execute: function () {
			codes = {
				back: 8,
				tab: 9,
				enter: 13,
				esc: 27,
				space: 32,
				pgup: 33,
				pgdn: 34,
				end: 35,
				home: 36,
				left: 37,
				up: 38,
				right: 39,
				down: 40,
				ins: 45,
				del: 46,
				f1: 112,
				f2: 113,
				f3: 114,
				f4: 115,
				f5: 116,
				f6: 117,
				f7: 118,
				f8: 119,
				f9: 120,
				f10: 121,
				f11: 122,
				f12: 123
			};
			modifiers = ["ctrl", "alt", /*"shift",*/"meta"];
			registry = [];
			function register(func, key) {
				var item = parse(key);
				item.func = func;
				registry.push(item);
			}

			_export("register", register);

			window.addEventListener("keydown", handler);
			window.addEventListener("keypress", handler);
		}
	};
});

"use strict";

System.register("util/pubsub.js", [], function (_export, _context) {
	var storage;
	return {
		setters: [],
		execute: function () {
			storage = Object.create(null);
			function publish(message, publisher, data) {
				var subscribers = storage[message] || [];
				subscribers.forEach(function (subscriber) {
					typeof subscriber == "function" ? subscriber(message, publisher, data) : subscriber.handleMessage(message, publisher, data);
				});
			}

			_export("publish", publish);

			function subscribe(message, subscriber) {
				if (!(message in storage)) {
					storage[message] = [];
				}
				storage[message].push(subscriber);
			}

			_export("subscribe", subscribe);

			function unsubscribe(message, subscriber) {
				var index = (storage[message] || []).indexOf(subscriber);
				if (index > -1) {
					storage[message].splice(index, 1);
				}
			}

			_export("unsubscribe", unsubscribe);
		}
	};
});

"use strict";

System.register("util/xy.js", [], function (_export, _context) {
	var _createClass, XY;

	function _toConsumableArray(arr) {
		if (Array.isArray(arr)) {
			for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
				arr2[i] = arr[i];
			}

			return arr2;
		} else {
			return Array.from(arr);
		}
	}

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			XY = function () {
				_createClass(XY, null, [{
					key: "fromString",
					value: function fromString(str) {
						var numbers = str.split(",").map(Number);
						return new (Function.prototype.bind.apply(this, [null].concat(_toConsumableArray(numbers))))();
					}
				}]);

				function XY() {
					var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
					var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

					_classCallCheck(this, XY);

					this.x = x;
					this.y = y;
				}

				_createClass(XY, [{
					key: "clone",
					value: function clone() {
						return new XY(this.x, this.y);
					}
				}, {
					key: "toString",
					value: function toString() {
						return this.x + "," + this.y;
					}
				}, {
					key: "is",
					value: function is(xy) {
						return this.x == xy.x && this.y == xy.y;
					}
				}, {
					key: "dist8",
					value: function dist8(xy) {
						var dx = xy.x - this.x;
						var dy = xy.y - this.y;
						return Math.max(Math.abs(dx), Math.abs(dy));
					}
				}, {
					key: "dist4",
					value: function dist4(xy) {
						var dx = xy.x - this.x;
						var dy = xy.y - this.y;
						return Math.abs(dx) + Math.abs(dy);
					}
				}, {
					key: "dist",
					value: function dist(xy) {
						var dx = xy.x - this.x;
						var dy = xy.y - this.y;
						return Math.sqrt(dx * dx + dy * dy);
					}
				}, {
					key: "scale",
					value: function scale(sx) {
						var sy = arguments.length <= 1 || arguments[1] === undefined ? sx : arguments[1];

						return new XY(Math.floor(this.x * sx), Math.floor(this.y * sy));
					}
				}, {
					key: "plus",
					value: function plus(xy) {
						return new XY(this.x + xy.x, this.y + xy.y);
					}
				}, {
					key: "minus",
					value: function minus(xy) {
						return this.plus(xy.scale(-1));
					}
				}]);

				return XY;
			}();

			_export("default", XY);
		}
	};
});

