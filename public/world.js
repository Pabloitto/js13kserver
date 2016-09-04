(function() {

    if (!window.Game) {
        window.Game = {
            calculateAngle: function(xTarget, yTarget, xOrigin, yOrigin) {
                return Math.atan2(yTarget - yOrigin, xTarget - xOrigin) * 180 / Math.PI;
            },
            calculateDirection: function(vectors, objectContext) {
                var angle = this.calculateAngle(vectors.target.x, vectors.target.y, objectContext.x, objectContext.y),
                    radians = angle * Math.PI / 180;
                objectContext.vx = Math.cos(radians) * objectContext.speed;
                objectContext.vy = Math.sin(radians) * objectContext.speed;
            },
            guid: function() {
                var result = '',
                    i, j;
                for (j = 0; j < 32; j++) {
                    if (j == 8 || j == 12 || j == 16 || j == 20) {
                        result = result + '-';
                    }
                    i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
                    result = result + i;
                }
                return result;
            },
            DEBUG: false
        };
    }

    var canvasName = "canvas-game";
    var canvasInstance = null;
    var contextInstance = null;

    function World() {}

    World.prototype = {
        getCanvasInstance: function() {
            if (canvasInstance === null) {
                canvasInstance = document.getElementById(canvasName);
            }
            return canvasInstance;
        },
        getCanvasContext: function() {
            if (contextInstance === null) {
                contextInstance = this.getCanvasInstance().getContext("2d");
            }
            return contextInstance;
        },
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        KEY_CONTROLS: {
            UP: [38, 87],
            DOWN: [40, 83],
            LEFT: [37, 65],
            RIGHT: [39, 68]
        },
        CONTROLS: {
            left: 0,
            up: 0,
            right: 0,
            down: 0,
        }
    };


    Game.World = World;

})();