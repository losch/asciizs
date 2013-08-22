define(["status"], function(status) {
    var actors = [];
    var map;

    function setMap(m) {
        map = m;
    }

    //
    // Object mixins
    //

    function has(obj, prop) {
        return typeof obj[prop] != "undefined";
    }

    // Moving functionality
    var asMovable = function() {
        this.move = function(deltaX, deltaY) {
            if (this.dead || (deltaX == 0 && deltaY == 0)) {
                return;
            }

            var newX = this.x + deltaX;
            var newY = this.y + deltaY;

            var actor;
            var hitActor = false;

            for (var i = 0; i < actors.length; i++) {
                actor = actors[i];
                if (actor != this &&
                    actor.solid &&
                    actor.x == newX && actor.y == newY) {
                    hitActor = true;
                    break;
                }
            }

            if (hitActor) {
                if (!this.isPlayer && !actor.isPLayer) {
                    return;
                    }

                var damage = 1;

                status.printLn(this.name + ' hits ' + actor.name + '!');
                
                if (this.isPlayer) {
                    damage = Math.floor(Math.random() * 5);
                }

                var died = actor.hit(damage);

                if (died && this.isPlayer) {
                    this.score += 1;
                    status.printLn('Score: ' + this.score);
                }
                
                if (!actor.dead) {
                    damage = 1;
                    if (actor.isPlayer) {
                        damage = Math.floor(Math.random() * 5);
                        }

                    status.printLn(actor.name + ' hits ' + this.name + '!');
                    died = this.hit(damage);
                    
                    if (died && actor.isPlayer) {
                        actor.score += 1;
                        status.printLn('Score: ' + actor.score);
                        }
                }
            }
            else if (map.isSolid(newX, newY)) {
                /*
                status.printLn(this.name +
                               ' is blocked by ' +
                               map.terrainGet(newX, newY).name);
                */
                if (this.isPlayer) {
                    switch (Math.floor(Math.random() * 20)) {
                        case 0:
                            status.printLn("PLAYER: Ouch!");
                            this.hit(1);
                            break;
                        case 1:
                            status.printLn("PLAYER: I can't go there!");
                            break;
                        }
                }
            }
            else {
                this.x = newX;
                this.y = newY;
            }
        };
        return this;
    };

    // Idea: A hit to the head might reduce intelligence and reduce the
    //       AI's level. The levels could be: brain dead, random, zombie,
    //       and so on.
    var asRandomAI = function() {
        this.ai = function() {
            var r = function() { return Math.round(Math.random() * 2 - 1); };
            var x = r();
            var y = r();
            this.move(x, y);
        }
        return this;
    };

    var asMortal = function(options) {
        this.health = options.health;
        this.dead = false;
        this.death = function() {
            status.printLn(this.name + ' died!');
            this.dead = true;
            this.ai = undefined;
            this.solid = false;

            if (this.isPlayer) {
                status.printLn("GAME OVER!");
                status.printLn("Score: " + this.score);
                status.printLn("Refresh page to start a new game...");
            }

        };
        this.hit = function(damage) {
            this.health -= damage;
            status.printLn(this.name + ' got ' + damage + ' damage!');
            status.printLn(this.name + ' has ' + this.health + ' health left');

            if (this.health <= 0) {
                this.death();
                return true;
            }
            return false;
        };
    }


    //
    // Actors
    //

    // Zombie
    var Zombie = function(x, y) {
        this.name = 'ZOMBIE';
        this.x = x;
        this.y = y;
        this.solid = true;
    };
    asMovable.call(Zombie.prototype);
    asRandomAI.call(Zombie.prototype);
    asMortal.call(Zombie.prototype, { health: 3 });

    // Player
    var Player = function(x, y) {
        this.name = 'PLAYER';
        this.x = x;
        this.y = y;
        this.solid = true;
        this.isPlayer = true;
        this.score = 0;
    };
    asMovable.call(Player.prototype);
    asMortal.call(Player.prototype, { health: 7 });

    // Function for creating actors
    function createActor(actorClass, x, y) {
        var actor = new actorClass(x, y);
        actors.push(actor);
        return actor;
    }

    return {
        actors: actors,
        setMap: setMap,
        has: has,
        Player: Player,
        Zombie: Zombie,
        createActor: createActor
    };
});
