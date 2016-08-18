"use strict";

(function () {

    var socket;
    var canvas;
    var context;
    var inputName;
    var btnStart;
    var usersToPaint = [];
    var KC = {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39
    };
    var blockSize = 30;
    var userSize = 10;
    var MOVEMENT = {
        'UP': false,
        'DOWN': false,
        'LEFT': false,
        'RIGHT': false
    };
    var map = [];
    var mapCollition = [];

    function getEmptyMap(){
        var result = [];
         for (var x = 0; x < 11; x++) {
                var newRow = [];
                for (var y = 0; y < 24; y++) {
                     newRow.push(0);
                }
                result.push(newRow);
        }
        return result;
    }

    function initMap(m) {
        for (var x = 0; x < 11; x++) {
                for (var y = 0; y < 24; y++) {
                    if(Math.random() < 0.30){
                        m[x][y] = 1;
                    }
                }
        }
        return m;
    }

    function countAliveNeighbours(map, x, y){
        var count = 0;
        for(var i=-1; i<2; i++){
            for(var j=-1; j<2; j++){
                var neighbour_x = x+i;
                var neighbour_y = y+j;
                if(neighbour_x < 0 || neighbour_y < 0 || neighbour_x >= map.length || neighbour_y >= map[0].length){
                    count = count + 1;
                } else if(map[neighbour_x][neighbour_y]){
                    count = count + 1;
                }
            }
        }
        return count;
    }

    function doSimulationStep(oldMap){
        var newMap = getEmptyMap();
        for(var x=0; x<oldMap.length; x++){
            for(var y=0; y<oldMap[0].length; y++){
                var nbs = countAliveNeighbours(oldMap, x, y);
                if(oldMap[x][y]){
                    if(nbs < 3){
                        newMap[x][y] = 0;
                    }
                    else{
                        newMap[x][y] = 1;
                    }
                } else{
                    if(nbs > 4){
                        newMap[x][y] = 1;
                    }
                    else{
                        newMap[x][y] = 0;
                    }
                }
            }
        }
        return newMap;
    }

    function generateMap(){
        var cellmap = getEmptyMap();
        cellmap = initMap(cellmap);
        for(var i=0; i<2; i++){
            cellmap = doSimulationStep(cellmap);
        }
        map = cellmap;
        socket.emit("generateMap", map);
    }

    /**
     * Client module init
     */
    function init() {
        socket = io({ upgrade: false, transports: ["websocket"] });
        canvas = document.getElementById("canvas-game");
        inputName = document.getElementById("inputName");
        btnStart = document.getElementById("btnStart");
        context = canvas.getContext("2d");
        update();
        bindEvents();
    }

    function update() {
        repaint();
        requestAnimationFrame(update);
    }

    function repaint() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        paintMap();
        usersToPaint.forEach(function (user) {
            paintUser(user, "blue");
        });
    }

    function paintMap() {
        map.forEach(function (row, x) {
            row.forEach(function (value, y) {
                if (value > 0) {
                    context.fillStyle = "black";
                    context.strokeRect(y * blockSize, x * blockSize, blockSize, blockSize);
                    context.fillStyle = "red";
                    context.fillRect(
                        y * blockSize, x * blockSize,
                        blockSize, blockSize
                    );
                    mapCollition.push({
                        x: y * blockSize,
                        y: x * blockSize,
                        width: blockSize,
                        height: blockSize
                    });
                }
            });
        });
    }

    function paintUser(user, color) {
        context.fillStyle = "black";
        context.fillText(user.name, user.x, user.y - 10);
        context.strokeRect(user.x, user.y, userSize, userSize);
        context.fillStyle = color;
        context.fillRect(user.x, user.y, userSize, userSize);
        move();
    }

    function move() {

        var currentUser = usersToPaint.find(function (us) {
            return us.socketId === "/#" + socket.id;
        });
        if (currentUser) {

            if (MOVEMENT.UP) {
                if (canIMoveTo(currentUser, KC.UP)) {
                    currentUser.y -= 1;
                }

            }

            if (MOVEMENT.DOWN) {
                if (canIMoveTo(currentUser, KC.DOWN)) {
                    currentUser.y += 1;
                }

            }

            if (MOVEMENT.RIGHT) {
                if (canIMoveTo(currentUser, KC.RIGHT)) {
                    currentUser.x += 1;
                }

            }

            if (MOVEMENT.LEFT) {
                if (canIMoveTo(currentUser, KC.LEFT)) {
                    currentUser.x -= 1;
                }

            }
            socket.emit("userChangePosition", currentUser);
        }
    }

    function canIMoveTo(currentUser, direction) {

        var model = {
            x: currentUser.x,
            y: currentUser.y,
            width: userSize,
            height: userSize
        };

        switch (direction) {
            case KC.LEFT:
                model.x = model.x - 1;
                break;
            case KC.RIGHT:
                model.x = model.x + 1;
                break;
            case KC.UP:
                model.y = model.y - 1;
                break;
            case KC.DOWN:
                model.y = model.y + 1;
                break;
        }

        var collition = intersectWithArray(model, mapCollition);
        console.log(model.x + " " + model.y);
        console.log(collition);
        return collition === 0;
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

    function bindEvents() {

        btnStart.addEventListener("click", function () {
            var name = inputName.value;
            socket.emit("connectNewUser", name);
        }, false);

        socket.on("start", function (users) {
            usersToPaint = users;
            generateMap();
        });

        socket.on("newUserConnected", function (user) {
            usersToPaint.push(user);
        });

        socket.on("updateItem", function (user) {
            var exist = usersToPaint.find(function (u) {
                return u.socketId === user.socketId;
            });
            if (exist) {
                exist.name = user.name;
                exist.x = user.x;
                exist.y = user.y;
            }
        })

        socket.on("updateMap", function (newMap) {
            map =  newMap;
        });

        socket.on("disconnect", function (users) {
            usersToPaint = users;
        });


        window.addEventListener("keydown", function (evt) {
            var currentUser = usersToPaint.find(function (us) {
                return us.socketId === "/#" + socket.id;
            });
            if (currentUser) {
                if (evt.keyCode === KC.UP) {
                    MOVEMENT.UP = 1;
                }

                if (evt.keyCode === KC.DOWN) {
                    MOVEMENT.DOWN = 1;
                }

                if (evt.keyCode === KC.RIGHT) {
                    MOVEMENT.RIGHT = 1;
                }

                if (evt.keyCode === KC.LEFT) {
                    MOVEMENT.LEFT = 1;
                }
            }
        }, false);


        window.addEventListener("keyup", function (evt) {
            var currentUser = usersToPaint.find(function (us) {
                return us.socketId === "/#" + socket.id;
            });
            if (currentUser) {
                if (evt.keyCode === KC.UP) {
                    MOVEMENT.UP = 0;
                }

                if (evt.keyCode === KC.DOWN) {
                    MOVEMENT.DOWN = 0;
                }

                if (evt.keyCode === KC.RIGHT) {
                    MOVEMENT.RIGHT = 0;
                }

                if (evt.keyCode === KC.LEFT) {
                    MOVEMENT.LEFT = 0;
                }
            }
        }, false);
    }

    window.addEventListener("load", init, false);

})();