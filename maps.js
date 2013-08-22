define(function() {
	var terrain_symbols = {
		' ': {
			name:        'STONE',
			transparent: true
		},
		'#': {
		 	name:        'BEDROCK',
		 	solid:       true
 		},
	 	'=': {
 			name:        'WALL',
		 	solid:       true
	 	},
	 	'%': {
	 		name:        'WINDOW',
		 	solid:       true,
		 	transparent: true
	 	},
	 	'+': {
	 		name:        'DOOR_CLOSED',
		 	solid:       false,  // TODO
	 	},
	 	'-': {
	 		name:        'DOOR_OPEN',
	 		transparent: true
	 	},
	 	'0': {
	 		name:        'PORTAL',
	 	},
	 	'.': {
	 		name:        'GRASS',
	 		transparent: true
	 	},
	 	',': {
	 		name:        'GRASS_LONG',
	 		transparent: true
	 	},
	 	'T': {
	 		name:        'TREE',
		 	solid:       true,
	 	}
	};

	// Load maps
	var maps;
	$.ajax({
		cache:    false,
		url:      'maps.json',
		async:    false,
		dataType: 'json',
		success:  function (response) {
			maps = response;
	  	}
	});


	//
	// Map class
	//

	var Map = function(map) {
		this.map = map;
		this.seenBlocks = {};
		this.visibleBlocks = {};
		this.height = this.map.terrain.length;
		this.width = this.map.terrain[0].length;
	};

	Map.prototype = {
		constructor: Map,

		// Tells whether point x,y is within the map's dimensions
		contains: function (x, y) {
			return y >= 0 && y < this.height && x >= 0 && x < this.width;
		},

		// Returns terrain at point x,y
		terrainGet: function(x, y) {
			if (this.contains(x, y)) {
				var symbol = this.map.terrain[y][x];
				return terrain_symbols[symbol];
			}
			return undefined;
		},

		// Tells whether a block at x,y is transparent
		isTransparent: function(x, y) {
			var terrain = this.terrainGet(x, y);
			return terrain && terrain.transparent;
		},

		// Tells whether the terrain at x,y is solid
		isSolid: function(x, y) {
			var terrain = this.terrainGet(x, y);
			return terrain.solid;
		},
	};

	return {
		Map: Map,
		maps: maps
	};
});
