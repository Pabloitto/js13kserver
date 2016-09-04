"use strict";

function Game() {
    this.started = false;
    this.users = [];
    this.socket = null;
    this.io = null;
    this.width = null;
    this.height = null;
    this.map = null;
}

Game.prototype.users = [];

Game.prototype.init = function(config) {
    this.io = config.io;
    this.socket = config.socket;
    this.width = config.width;
    this.height = config.height;
    this.started = true;
}

Game.prototype.addUser = function(user) {
    console.log('connecting new user ' + user.socketId);
    console.log("--------------------");
    var pos = this.getFreePositionInMap();
    user.x = pos.x;
    user.y = pos.y;
    this.users.push(user);
    this.io.emit("newUserConnected", user);
}

Game.prototype.getFreePositionInMap = function() {
    var pos = this.getRandomPosition();

    var mY = Math.floor(pos.x / BLOCK_SIZE);
    var mX = Math.floor(pos.y / BLOCK_SIZE);



    console.log(mX + " " + mY);
    console.log(this.map[mX][mY]);

    if (this.map[mX][mY] === 1) {
        return this.getFreePositionInMap();
    }

    console.log(mX + " " + (mY + 1));
    console.log(this.map[mX][mY + 1]);
    if (this.map[mX][mY + 1] === 1) {
        return this.getFreePositionInMap();
    }

    console.log(mX + " " + (mY - 1));
    console.log(this.map[mX][mY - 1]);

    if (this.map[mX][mY - 1] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX + 1) + " " + mY);
    console.log(this.map[mX + 1][mY]);

    if (this.map[mX + 1][mY] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX - 1) + " " + mY);
    console.log(this.map[mX - 1][mY]);

    if (this.map[mX - 1][mY] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX - 1) + " " + mY - 1);
    console.log(this.map[mX - 1][mY - 1]);

    if (this.map[mX - 1][mY - 1] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX + 1) + " " + mY + 1);
    console.log(this.map[mX + 1][mY + 1]);

    if (this.map[mX + 1][mY + 1] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX + 1) + " " + mY - 1);
    console.log(this.map[mX + 1][mY - 1]);

    if (this.map[mX + 1][mY - 1] === 1) {
        return this.getFreePositionInMap();
    }

    console.log((mX - 1) + " " + mY + 1);
    console.log(this.map[mX - 1][mY + 1]);

    if (this.map[mX - 1][mY + 1] === 1) {
        return this.getFreePositionInMap();
    }

    return pos;
}

Game.prototype.addMap = function(map) {
    if (this.map === null) {
        this.map = map;
    }
    this.io.emit("updateMap", this.map);
}

Game.prototype.updatePosition = function(user) {
    //console.log(user);
    var exist = this.users.find(function(u) {
        return u.socketId === user.socketId;
    });

    if (exist) {
        exist.x = user.x;
        exist.y = user.y;
        this.io.emit("updateItem", exist);
    }
}

Game.prototype.updateAngle = function(user) {
    var exist = this.users.find(function(u) {
        return u.socketId === user.socketId;
    });

    if (exist) {
        exist.angle = user.angle;
        this.io.emit("updateItem", exist);
    }
}

Game.prototype.shot = function(p) {
    this.io.emit("updateShot", p);
}

Game.prototype.collition = function(p) {
    console.log(p);
    this.io.emit("handleCollition", {
        data: {
            socketId: p.fromPlayer,
            toPlayer: p.toPlayer,
            bulletId: p.bulletId
        }
    });
}

Game.prototype.removeUser = function(socketId) {
    console.log("Current users ", this.users);
    console.log("To remove ", socketId);
    this.users = this.users.filter(function(u) {
        return u.socketId !== socketId;
    });
    console.log("Removing", this.users);
    this.io.emit("disconnect", {
        itemRemoved: socketId,
        players: this.users
    });
}

Game.prototype.getRandomPosition = function() {
    return {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
    }
};

var game = new Game();

function User(name, id) {
    this.name = name;
    this.socketId = id;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = function(socket) {

    game.init({
        io: this,
        socket: socket,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    });

    console.log(game.users);

    socket.emit("start", game.users);

    socket.on("connectNewUser", function(name) {
        console.log('connected ' + name);
        game.addUser(new User(name, socket.id));
    });

    socket.on("generateMap", function(map) {
        game.addMap(map);
    });

    socket.on("userChangePosition", function(user) {
        game.updatePosition(user);
    });

    socket.on("updateAngle", function(user) {
        game.updateAngle(user);
    });

    socket.on("shot", function(p) {
        game.shot(p);
    });

    socket.on("collition", function(p) {
        game.collition(p);
    });

    socket.on("userDead", function(id) {
        game.removeUser(id);
    });

    socket.on("disconnect", function() {
        game.removeUser(socket.id);
    });
};