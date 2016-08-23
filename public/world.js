(function() {

    if (!window.Game) {
        window.Game = {};
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