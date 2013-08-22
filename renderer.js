define(function() {
    var pixelSize = 16;
    var fontSize = 14;
    var fontFamily = "Lucida Console";

    var context;
    var maxW, maxH;

	var terrain_symbols = {
        'STONE': {
            symbol:  ' ',
            bgcolor: 'lightgrey'
        },
        'BEDROCK': {
            symbol:  '#',
            color:   'black',
            bgcolor: 'darkgrey'
        },
        'WALL': {
            symbol:  '=',
            color:   'darkgrey',
            bgcolor: 'grey'
        },
        'WINDOW': {
            symbol:  ':',
            color:   'blue',
            bgcolor: 'lightblue'
        },
        'DOOR_CLOSED': {
            symbol:  '-',
            color:   'brown',
            bgcolor: 'darkgrey'
        },
        'DOOR_OPEN': {
            symbol:  '-',
            color:   'brown',
            bgcolor: 'darkgrey'
        },
        'PORTAL': {
            symbol:  'O',
            color:   'red',
            bgcolor: 'pink'
        },
        'GRASS': {
            symbol:  '.',
            bgcolor: 'lightgreen'
        },
        'GRASS_LONG': {
            symbol:  ',',
            color:   'green',
            bgcolor: 'lightgreen'
        },
        'TREE': {
            symbol:  'T',
            color:   'brown',
            bgcolor: 'lightgreen'
        }
	};

    var object_symbols = {
        'PLAYER': {
            symbol: '@',
            color:  'blue'
        },
        'ZOMBIE': {
            symbol: 'Z',
            color:  'green'
        }
    };

    // Set context where to draw
    function setContext(ctx) {
        context = ctx;
    }

    // Set new dimensions for the view
    function setDimensions(w, h) {
        maxW = w;
        maxH = h;
    }

    // Calculates an offset to use in drawing, so that the given point
    // x,y is nicely positioned at the center of the view
    function viewOffset(x, y, mapW, mapH) {
        var findOffset = function(mapD, viewD, d) {
            var mapFar = (mapD + 1) * pixelSize - viewD,
                dFar   = d * pixelSize - viewD / 2;

            var pixel = Math.max(1, Math.min(mapFar, dFar));

            // Return offset in map grid dimension
            return pixel / pixelSize | 0;
        }

        var offsetX = findOffset(mapW, maxW, x),
            offsetY = findOffset(mapH, maxH, y);

        return {x: offsetX, y: offsetY};
    }

    // Clears canvas
    function clear() {
        context.clearRect(0, 0, maxW, maxH);
    }

    // Renders an optional colored symbol with optional background
    // color at location x,y
    function renderBlock(symbol, color, bgcolor, x, y) {
        if (bgcolor) {
            context.fillStyle = bgcolor;
            context.fillRect(pixelSize * x, pixelSize * y,
                             pixelSize, pixelSize);
        }

        if (color) {
            context.beginPath();
            context.strokeStyle = color;
            context.font = fontSize + "px " + fontFamily;
            context.textBaseline = "top";
            context.strokeText(symbol,
                               // The (pixelSize / 4) is a hack for
                               // centering the font. I don't have a
                               // better idea for now how to do it
                               // properly.
                               pixelSize * x + pixelSize / 4,
                               pixelSize * y);
            context.stroke();
        }
    }

    // This function implements recursive shadowcasting algorithm
    // described at: http://roguebasin.roguelikedevelopment.org
    function castLight(map, cx, cy, row, start, end, depth, xx, xy, yx, yy) {
        var squared_depth = depth * depth;

        if (start < end) {
            return;
        }

        for (var i = row; i < depth; i++) {
            var dx = -i - 1,
                dy = -i;
            var blocked = false;

            while (dx <= 0) {
                var new_start;
                dx += 1;

                // dx,dy to map coordinates
                var x = cx + dx * xx + dy * xy,
                    y = cy + dx * yx + dy * yy;

                var lSlope = (dx - 0.5) / (dy + 0.5),
                    rSlope = (dx + 0.5) / (dy - 0.5);

                if (start < rSlope) {
                    continue;
                }
                else if (end > lSlope) {
                    break;
                }

                // If the block at x,y is in map and if it's within
                // the maximum scanning depth, then it will be added
                // as a visible block.
                if (map.contains(x, y) && dx * dx + dy * dy < squared_depth) {
                    if (dx * dx + dy * dy < depth * depth) {
                        if (!(y in map.visibleBlocks)) {
                            map.visibleBlocks[y] = [];
                        }
                        if (map.visibleBlocks[y].indexOf(x) == -1) {
                            map.visibleBlocks[y].push(x);
                        }

                        if (!(y in map.seenBlocks)) {
                            map.seenBlocks[y] = [];
                        }
                        if (map.seenBlocks[y].indexOf(x) == -1) {
                            map.seenBlocks[y].push(x);
                        }
                    }
                }

                // Blocked square scanning
                if (blocked) {
                    if (!map.isTransparent(x, y)) {
                        // This block is not yet transparent, so just
                        // calculate new right slope and check the next
                        // block.
                        new_start = rSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        start = new_start;
                    }
                }
                else {
                    // If the block is not transparent, then start a new
                    // scan recursively
                    if (!map.isTransparent(x, y) && i < depth) {
                        blocked = true;
                        castLight(map, cx, cy, i + 1, start, lSlope, depth,
                                  xx, xy, yx, yy);
                        new_start = rSlope;
                    }
                }
            }
            // Stop scanning if the last block on row was blocked
            if (blocked) {
                break;
            }
        }
    }

    // Renders map
    function renderMap(map, centerX, centerY) {
        // Calculate offset for centering the drawing nicely to the
        // canvas
        var offset = viewOffset(centerX, centerY, map.width, map.height);

        // Multiplier table for each octet
        var mult = [
        //   0   1   2   3   4   5   6   7
            [1,  0,  0, -1, -1,  0,  0,  1],  // xx
            [0,  1, -1,  0,  0, -1,  1,  0],  // xy
            [0,  1,  1,  0,  0, -1, -1,  0],  // yx
            [1,  0,  0,  1, -1,  0,  0, -1]]; // yy

        // Add current block to seen blocks
        if (!(centerY in map.seenBlocks)) {
            map.seenBlocks[centerY] = [];
        }
        if (map.seenBlocks[centerY].indexOf(centerX) == -1) {
            map.seenBlocks[centerY].push(centerX);
        }

        // Reset visible blocks
        map.visibleBlocks = {};
        map.visibleBlocks[centerY] = [centerX];

        // Scan all visible blocks
        for (var oct = 0; oct < 8; oct++) {
            castLight(
                map, centerX, centerY, 1, 1, 0, 32,
                mult[0][oct], mult[1][oct],
                mult[2][oct], mult[3][oct]);
        }

        for (var y in map.seenBlocks) {
            for (var i = 0; i < map.seenBlocks[y].length; i++) {
                var x = map.seenBlocks[y][i];
                var name = map.terrainGet(x, y).name;
                var terrain = terrain_symbols[name];

                // Colors for the blocks that have been seen but are
                // currently in shadow
                var color = "#CCCCCC";
                var bgcolor = "#404040";

                // Visible blocks
                if (y in map.visibleBlocks &&
                    map.visibleBlocks[y].indexOf(x) != -1) {
                    color = terrain.color;
                    bgcolor = terrain.bgcolor;
                }

                var x2 = x - offset.x,
                    y2 = y - offset.y;

                renderBlock(terrain.symbol, color, bgcolor, x2, y2);
            }
        }
    }

    // Renders an object
    function renderObject(map, object, centerX, centerY) {
        var offset = viewOffset(centerX, centerY, map.width, map.height);
        var name = object.name;

        var x = object.x - offset.x,
            y = object.y - offset.y;

        var color = object_symbols[name].color;

        if (object.dead) {
            color = 'gray';
        }

        renderBlock(object_symbols[name].symbol,
                    color, undefined,
                    x, y);
    }

    return {
        setContext: setContext,
        setDimensions: setDimensions,
        renderMap: renderMap,
        renderObject: renderObject,
        clear: clear
    };
});
