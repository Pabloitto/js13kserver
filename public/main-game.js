window.addEventListener("load", function() {

    var socket = io({ upgrade: false, transports: ["websocket"] });

    var players = [];

    var btnStart = document.getElementById("btnStart");

    var inputName = document.getElementById("inputName");

    var playerListDOM = document.getElementById("player-list");

    var world = new Game.World();

    var map = new Game.Map(world);

    var canvas = world.getCanvasInstance();

    var context = world.getCanvasContext();

    var mouseEventListener = null;

    var started = false;

    function createPlayer(item) {
        var player = new Game.Player({
            socketId: item.socketId,
            item: item,
            world: world,
            map: map
        });

        var camera = new Game.Camera(0, 0, canvas.width, canvas.height, world.width, world.height);

        camera.follow(player, canvas.width / 2, canvas.height / 2);

        return {
            socketId: item.socketId,
            player: player,
            camera: camera
        }
    }

    function update() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        var thisSocket = socket.id;

        players.forEach(function(item) {
            if (item.socketId === thisSocket) {
                item.player.update(socket);
                map.draw(context, item.camera.xView, item.camera.yView);
                var collition = map.detectCollition(item.player);
                if (collition) {
                    if (collition.with === "oponent") {
                        collition.e.hurt();
                    }
                    socket.emit("collition", {
                        fromPlayer: thisSocket,
                        toPlayer: collition.e.socketId,
                        bulletId: collition.bulletId
                    });
                }
                item.camera.update();
                item.player.draw(context, item.camera.xView, item.camera.yView);
                item.player.drawBullets(context, item.camera.xView, item.camera.yView);
                item.player.clearBullets(world);
            } else {
                map.addOponentToMap(item.player);
            }
        });

        requestAnimationFrame(update);
    }

    function play() {
        inputName.value = inputName.value.replace(/^\s+|\s+$/gm, '');
        if (!inputName.value) {
            alert("Your name is required!");
            return;
        }

        if (alreadyThere(inputName.value)) {
            alert("That name is already used in the room!");
            return;
        }

        if (started === false) {
            update();
            socket.emit("connectNewUser", inputName.value);
            started = true;
        }
    }

    function alreadyThere(name) {
        if (players && players.length) {
            return players.filter(function(item) {
                return item.player.name === name;
            }).length > 0;
        }
    }

    function attachKeyEvent(eventName, finalValue) {
        window.addEventListener(eventName, function(e) {
            var keys = [];
            for (var p in world.KEY_CONTROLS) {
                keys = world.KEY_CONTROLS[p];
                if (keys.indexOf(e.keyCode) > -1) {
                    switch (p) {
                        case "LEFT":
                            world.CONTROLS.left = finalValue;
                            break;
                        case "UP":
                            world.CONTROLS.up = finalValue;
                            break;
                        case "RIGHT":
                            world.CONTROLS.right = finalValue;
                            break;
                        case "DOWN":
                            world.CONTROLS.down = finalValue;
                            break;
                    }
                }
            }
        }, false);
    }

    function getCurrentPlayer() {
        var thisSocket = socket.id;
        var playerContainer = players.find(function(item) {
            return item.socketId === thisSocket;
        });

        if (!playerContainer) {
            return;
        }

        return playerContainer.player;
    }

    function onMouseMove(x, y) {
        var currentPlayer = getCurrentPlayer();

        if (!currentPlayer) {
            return;
        }

        currentPlayer.angle = currentPlayer.calculateAngle(x, y);

        socket.emit("updateAngle", currentPlayer);
        //console.log(x + " " + y + "Angle = " + currentPlayer.angle);
    }

    function onMouseClick(x, y, button) {
        var currentPlayer = getCurrentPlayer();

        if (!currentPlayer) {
            return;
        }
        var relX = (x + currentPlayer.xView);
        var relY = (y + currentPlayer.yView);

        //console.log("x: " + x + " y: " + y);
        var bulletId = currentPlayer.shot({ x: relX, y: relY });
        socket.emit("shot", {
            data: {
                player: currentPlayer,
                bulletId: bulletId,
                vector: {
                    origin: { x: currentPlayer.x + (currentPlayer.width / 2), y: currentPlayer.y + (currentPlayer.height / 2) },
                    target: { x: relX, y: relY }
                }
            }
        });
    }

    function bindDOMEvents() {
        attachKeyEvent("keydown", 1);
        attachKeyEvent("keyup", 0);
        btnStart.addEventListener("click", play, false);
        mouseEventListener = new Game.MouseEventListener({
            element: canvas,
            onMouseMove: onMouseMove,
            onClick: onMouseClick
        });
    }

    function bindSocketEvents() {
        socket.on("start", function(playerList) {
            players = playerList.map(function(item) {
                return createPlayer(item);
            });
            renderPlayerDOMList();
            map.generate(socket);
        });

        socket.on("newUserConnected", function(user) {
            var player = createPlayer(user);
            players.push(player);
            renderPlayerDOMList();
        });

        socket.on("updateItem", function(player) {
            if (player.socketId === socket.id) {
                return;
            }
            var exist = players.find(function(item) {
                return item.socketId === player.socketId;
            });
            if (exist) {
                exist.player.name = player.name;
                exist.player.x = player.x;
                exist.player.y = player.y;
                exist.player.angle = player.angle;
            }
        })

        socket.on("updateMap", function(newMap) {
            map.updateMap(newMap);
        });

        socket.on("updateShot", function(p) {
            if (p.data.player.socketId === socket.id) {
                return;
            }
            var bullet = new Game.Bullet(p.data.vector);
            bullet.bulletId = p.data.bulletId;
            map.addEnemyBullet(p.data.player.socketId, bullet);
        });

        socket.on("handleCollition", function(p) {
            if (p.data.socketId === socket.id) {
                return;
            }

            var exist = players.find(function(item) {
                return item.socketId === p.data.toPlayer;
            });

            if (exist) {
                exist.player.hurt();
            }

            map.removeEnemyBullet(p.data.socketId, p.data.bulletId);
        });

        socket.on("disconnect", function(p) {
            players = p.players.map(function(item) {
                return createPlayer(item);
            });
            map.removeOponent(p.itemRemoved);
            renderPlayerDOMList();
        });
    }

    function bindEvents() {
        bindDOMEvents();
        bindSocketEvents();
    }

    function renderPlayerDOMList() {
        playerListDOM.innerHTML = players.map(function(item) {
            return "<li>" + item.player.name + "</li>";
        }).join("");
    }

    bindEvents();

}, false);