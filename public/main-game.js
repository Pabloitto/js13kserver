window.addEventListener("load", function () {

    var socket = io({ upgrade: false, transports: ["websocket"] });

    var players = [];

    var btnStart = document.getElementById("btnStart");

    var inputName = document.getElementById("inputName");

    var world = new Game.World();

    var map = new Game.Map(world);

    var canvas = world.getCanvasInstance();

    var context = world.getCanvasContext();

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
        var thisSocket = "/#" + socket.id;

        players.forEach(function (item) {
            if (item.socketId === thisSocket) {
                item.player.update(socket);
                map.draw(context, item.camera.xView, item.camera.yView);
                item.camera.update();
                item.player.draw(context, item.camera.xView, item.camera.yView);
            } else {
                map.addOponentToMap(item.player);
            }
        });


        requestAnimationFrame(update);
    }

    function play() {
        update();
        socket.emit("connectNewUser", inputName.value);
    }

    function attachKeyEvent(eventName, finalValue) {
        window.addEventListener(eventName, function (e) {
            switch (e.keyCode) {
                case world.KEY_CONTROLS.LEFT:
                    world.CONTROLS.left = finalValue;
                    break;
                case world.KEY_CONTROLS.UP:
                    world.CONTROLS.up = finalValue;
                    break;
                case world.KEY_CONTROLS.RIGHT:
                    world.CONTROLS.right = finalValue;
                    break;
                case world.KEY_CONTROLS.DOWN:
                    world.CONTROLS.down = finalValue;
                    break;
            }
        }, false);
    }

    function bindDOMEvents() {
        attachKeyEvent("keydown", 1);
        attachKeyEvent("keyup", 0);
        btnStart.addEventListener("click", play, false);
    }

    function bindSocketEvents() {
        socket.on("start", function (playerList) {
            players = playerList.map(function (item) {
                return createPlayer(item);
            });
            map.generate(socket);
        });

        socket.on("newUserConnected", function (user) {
            var player = createPlayer(user);
            players.push(player);
        });

        socket.on("updateItem", function (player) {
            if(player.socketId === "/#" + socket.id){
                return;
            }
            var exist = players.find(function (item) {
                return item.socketId === player.socketId;
            });
            if (exist) {
                exist.player.name = player.name;
                exist.player.x = player.x;
                exist.player.y = player.y;
            }
        })

        socket.on("updateMap", function (newMap) {
            map.updateMap(newMap);
        });

        socket.on("disconnect", function (p) {
            players = p.players.map(function (item) {
                return createPlayer(item);
            });
            map.removeOponent(p.itemRemoved);
        });
    }

    function bindEvents() {
        bindDOMEvents();
        bindSocketEvents();
    }

    bindEvents();

}, false);
