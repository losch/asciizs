'use strict';

require.config({
    // Bust the browser's cache for always getting the latest js files
    urlArgs: "bust=" + (new Date()).getTime()
});

require(["maps", "objects", "renderer", "status"],
        function(maps, objects, renderer, status) {
	var canvas = document.getElementById('gridCanvas');
    var context = canvas.getContext('2d');
    var w, h;

    renderer.setContext(context);

    // Load some initial map
    var map = new maps.Map(maps.maps.town);

    // Tell objects module where to ask map details and create some
    // objects
    objects.setMap(map);
    var player = objects.createActor(objects.Player, 10, 10);
    objects.createActor(objects.Zombie, 20, 20);
    objects.createActor(objects.Zombie, 21, 12);

    // Rendering functions
    function render() {
        renderer.clear();
        renderer.renderMap(map, player.x, player.y);
        for (var i in objects.actors) {
            var actor = objects.actors[i];
            renderer.renderObject(map, actor, player.x, player.y);
        }
    }

    function resize() {
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.height = h;
        canvas.width = w;
        console.log("w", w, "h", h);
        renderer.setDimensions(w, h);
        render();
    }
    resize();
    window.onresize = resize;

    // Spawning function
    function spawn() {
        var randint = function(a, b) {
            return Math.floor(Math.random() * (b - a) + a);
        }

        if (randint(0, 15) == 0) {
            var x, y;

            do {
                x = randint(1, map.width);
                y = randint(1, map.height);
            } while (map.isSolid(x, y));

            var zombieLines = ["Murrr!",
                               "Mur!",
                               "Murrrr!",
                               "Murrrrrrrrr!",
                               "MURRRRRRRRRRR!",
                               "Why do we hunger?",
                               "Roarrrr!",
                               "Oerrrr!",
                               "Grrrrrr...",
                               "GRRR!",
                               "Ugh..",
                               "UGH!",
                               "Blblrlblblrlb",
                               "Ggrgggrlglgrl",
                               "Rlrlrllbltrglghjhhkj...!",
                               "Hello World!"];

            status.printLn("ZOMBIE: " + zombieLines[
                randint(0, zombieLines.length)]);

            objects.createActor(objects.Zombie, x, y);
        }
    }
    
    // Run AI, actions, and render the view
    function step() {
        spawn();
        for (var i in objects.actors) {
            var actor = objects.actors[i];
            if (objects.has(actor, 'ai')) {
                actor.ai();
            }
        }
        render();
    }

	var keyDownHandler = function(e) {
		var mappings = {
			33: function() { player.move( 1, -1); }, // NE
			34: function() { player.move( 1,  1); }, // SE
			35: function() { player.move(-1,  1); }, // SW
			36: function() { player.move(-1, -1); }, // NW
			37: function() { player.move(-1,  0); }, // West
			38: function() { player.move( 0, -1); }, // North
			39: function() { player.move( 1,  0); }, // East
			40: function() { player.move( 0,  1); }, // South
			32: function() { console.log("Waiting..."); } // Space bar
		};

		var action = mappings[e.keyCode];

		if (action) {
			action();
            step();
		}
	}
	window.addEventListener("keydown", keyDownHandler, true);

	// Update loop
    step();
});
