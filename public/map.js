(function () {

    var canvas = null;
    var context = null;
    var map = null;
    var world = null;
    var mapCollition = [];
    var blockSize = 30;
    var oponents = [];

    function Map(pWorld) {
        world = pWorld;
        canvas = pWorld.getCanvasInstance();
        context = pWorld.getCanvasContext();
        this.width = pWorld.width;
        this.height = pWorld.height;
        this.image = null;
    }

    Map.prototype.updateMap = function (newMap) {
        map = newMap;
        generateArrayForCollitions();
        this.createMapImage();
    }

    Map.prototype.addOponentToMap = function (oponent) {
        var exist = oponents.filter(function (item) {
            return item.socketId === oponent.socketId;
        }).length > 0;

        if (!exist) {
            oponents.push(oponent);
        }
    }

    Map.prototype.removeOponent = function(socketId){
        oponents = oponents.filter(function (item) {
            return item.socketId !== socketId;
        });
    }

    Map.prototype.generate = function (socket) {

        generateMap();
        generateArrayForCollitions();

        this.createMapImage();

        if (socket) {
            socket.emit("generateMap", map);
        }
    }

    Map.prototype.createMapImage = function () {
        var ctx = document.createElement("canvas").getContext("2d");
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;

        var rows = map.length * blockSize;
        var columns = map[0].length * blockSize;

        var color = "red";
        ctx.save();
        ctx.fillStyle = color;
        map.forEach(function (row, x) {
            ctx.beginPath();
            row.forEach(function (value, y) {
                if (value) {
                    ctx.rect(y * blockSize,
                        x * blockSize, blockSize, blockSize);
                    ctx.fill();
                    ctx.closePath();
                }
            });
        });

        ctx.restore();

        this.image = new Image();
        this.image.src = ctx.canvas.toDataURL("image/png");

        ctx = null;
    }

    Map.prototype.draw = function (context, xView, yView) {
        var sx, sy, dx, dy;
        var sWidth, sHeight, dWidth, dHeight;

        sx = xView;
        sy = yView;

        sWidth = context.canvas.width;
        sHeight = context.canvas.height;

        if (this.image.width - sx < sWidth) {
            sWidth = this.image.width - sx;
        }
        if (this.image.height - sy < sHeight) {
            sHeight = this.image.height - sy;
        }

        dx = 0;
        dy = 0;
        dWidth = sWidth;
        dHeight = sHeight;
        context.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        
        oponents.forEach(function (item) {
            item.draw(context, sx, sy);
        });
    }

    Map.prototype.canIMoveTo = function (player, direction) {

        var model = {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };

        switch (direction) {
            case world.KEY_CONTROLS.LEFT:
                model.x = model.x - player.speed;
                break;
            case world.KEY_CONTROLS.RIGHT:
                model.x = model.x + player.speed;
                break;
            case world.KEY_CONTROLS.UP:
                model.y = model.y - player.speed;
                break;
            case world.KEY_CONTROLS.DOWN:
                model.y = model.y + player.speed;
                break;
        }

        var collition = intersectWithArray(model, mapCollition);
        return collition === 0;
    }

    //private functions 
    function getEmptyMap() {
        var result = [];
        for (var x = 0; x < (world.width / blockSize); x++) {
            var newRow = [];
            for (var y = 0; y < (world.height / blockSize); y++) {
                newRow.push(0);
            }
            result.push(newRow);
        }
        return result;
    }

    function initMap(m) {
        for (var x = 0; x < (world.width / blockSize); x++) {
            for (var y = 0; y < (world.height / blockSize); y++) {
                if (Math.random() < 0.30) {
                    m[x][y] = 1;
                }
            }
        }
        return m;
    }

    function countAliveNeighbours(map, x, y) {
        var count = 0;
        for (var i = -1; i < 2; i++) {
            for (var j = -1; j < 2; j++) {
                var neighbour_x = x + i;
                var neighbour_y = y + j;
                if (neighbour_x < 0 || neighbour_y < 0 || neighbour_x >= map.length || neighbour_y >= map[0].length) {
                    count = count + 1;
                } else if (map[neighbour_x][neighbour_y]) {
                    count = count + 1;
                }
            }
        }
        return count;
    }

    function doSimulationStep(oldMap) {
        var newMap = getEmptyMap();
        for (var x = 0; x < oldMap.length; x++) {
            for (var y = 0; y < oldMap[0].length; y++) {
                var nbs = countAliveNeighbours(oldMap, x, y);
                if (oldMap[x][y]) {
                    if (nbs < 3) {
                        newMap[x][y] = 0;
                    } else {
                        newMap[x][y] = 1;
                    }
                } else {
                    if (nbs > 4) {
                        newMap[x][y] = 1;
                    } else {
                        newMap[x][y] = 0;
                    }
                }
            }
        }
        return newMap;
    }

    function generateMap() {
        var cellmap = getEmptyMap();
        cellmap = initMap(cellmap);
        for (var i = 0; i < 2; i++) {
            cellmap = doSimulationStep(cellmap);
        }
        map = cellmap;
    }

    function generateArrayForCollitions() {
        mapCollition = [];
        map.forEach(function (row, x) {
            row.forEach(function (value, y) {
                if (value) {
                    var id = x + "-" + y;
                    var alreadyAdd = mapCollition.filter(function (col) {
                        return col.id === id;
                    }).length > 0;

                    if (!alreadyAdd) {
                        mapCollition.push({
                            id: id,
                            value: value,
                            x: y * blockSize,
                            y: x * blockSize,
                            width: blockSize,
                            height: blockSize
                        });
                    }
                }
            });
        });
    }

    function intersect(a, b) {
        return !(a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y);
    }

    function intersectWithArray(o, elements) {
        var r = 0;
        for (var i = 0; i < elements.length; i++) {
            if (intersect(o, elements[i])) {
                r = { e: elements[i], i: i };
                break;
            }
        }
        return r;
    }

    Game.Map = Map;

})();