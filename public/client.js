"use strict";

(function() {

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
    var MOVEMENT = {
        'UP': false,
        'DOWN': false,
        'LEFT': false,
        'RIGHT': false
    };
    var map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

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
        usersToPaint.forEach(function(user) {
            paintUser(user, "blue");
        });
    }

    function paintMap() {
        var blockSize = 30;
        map.forEach(function(row, x) {
            row.forEach(function(value, y) {
                if (value > 0) {
                    context.fillStyle = "black";
                    context.fillText("{" + x + "," + y + "}", y * blockSize, x * blockSize);
                    context.fillStyle = "red";
                    context.fillRect(
                        y * blockSize, x * blockSize,
                        blockSize, blockSize
                    );
                } else {
                    context.fillStyle = "black";
                    context.fillText("{" + x + "," + y + "}", y * blockSize, x * blockSize);
                }
            });
        });
    }

    function paintUser(user, color) {
        context.fillStyle = color;
        context.fillText(user.name, user.x, user.y - 10);
        context.fillRect(user.x, user.y, 20, 20);
        move();
    }

    function move() {

        var currentUser = usersToPaint.find(function(us) {
            return us.socketId === "/#" + socket.id;
        });
        if (currentUser) {

            if (MOVEMENT.UP) {
                currentUser.y -= 1;
            }

            if (MOVEMENT.DOWN) {
                currentUser.y += 1;
            }

            if (MOVEMENT.RIGHT) {
                currentUser.x += 1;
            }

            if (MOVEMENT.LEFT) {
                currentUser.x -= 1;
            }
            socket.emit("userChangePosition", currentUser);
        }
    }

    function canIMoveTo(currentUser, direction) {
        var x = Math.floor(currentUser.x / 30);
        var y = Math.floor(currentUser.y / 30);

        switch (direction) {
            case KC.UP:
                y = Math.floor((currentUser.y - 30) / 30);
                y -= 1;
                break;
            case KC.RIGHT:
                x = Math.floor((currentUser.x - 30) / 30);
                x += 1;
                break;
            case KC.DOWN:
                y += 1;
                break;
            case KC.LEFT:
                x -= 1;
                break;
        }

        var value = map[y][x];
        console.log(x + " " + y + " -> walkable = " + (value === 0));
        return value === 0;
    }

    function bindEvents() {

        btnStart.addEventListener("click", function() {
            var name = inputName.value;
            socket.emit("connectNewUser", name);
        }, false);

        socket.on("start", function(users) {
            usersToPaint = users;
        });

        socket.on("newUserConnected", function(user) {
            usersToPaint.push(user);
        });

        socket.on("updateItem", function(user) {
            var exist = usersToPaint.find(function(u) {
                return u.socketId === user.socketId;
            });
            if (exist) {
                exist.name = user.name;
                exist.x = user.x;
                exist.y = user.y;
            }
        })

        socket.on("disconnect", function(users) {
            usersToPaint = users;
        });


        window.addEventListener("keydown", function(evt) {
            var currentUser = usersToPaint.find(function(us) {
                return us.socketId === "/#" + socket.id;
            });
            if (currentUser) {
                if (evt.keyCode === KC.UP) {
                    if (canIMoveTo(currentUser, KC.UP)) {
                        MOVEMENT.UP = 1;
                    }
                }

                if (evt.keyCode === KC.DOWN) {
                    if (canIMoveTo(currentUser, KC.DOWN)) {
                        MOVEMENT.DOWN = 1;
                    }
                }

                if (evt.keyCode === KC.RIGHT) {
                    if (canIMoveTo(currentUser, KC.RIGHT)) {
                        MOVEMENT.RIGHT = 1;
                    }
                }

                if (evt.keyCode === KC.LEFT) {
                    if (canIMoveTo(currentUser, KC.LEFT)) {
                        MOVEMENT.LEFT = 1;
                    }
                }
            }
        }, false);


        window.addEventListener("keyup", function(evt) {
            var currentUser = usersToPaint.find(function(us) {
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