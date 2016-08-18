"use strict";

var KC = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39
};

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
    var exist = this.users.find(function(u) {
        return u.socketId === user.socketId;
    });
    if (exist) {
        exist.name = user.name;
        console.log('updating user to ' + exist.name);
        this.io.emit("updateItem", exist);
    } else {
        console.log('connecting new user ' + user.socketId);
        var pos = this.getRandomPosition();
        user.x = pos.x;
        user.y = pos.y;
        this.users.push(user);
        this.io.emit("newUserConnected", user);
    }
}

Game.prototype.addMap = function(map) {
    if (this.map === null) {
        this.map = map;
    }
    this.io.emit("updateMap", this.map);
}

Game.prototype.updatePosition = function(user) {
    var exist = this.users.find(function(u) {
        return u.socketId === user.socketId;
    });

    if (exist) {
        exist.x = user.x;
        exist.y = user.y;
        this.io.emit("updateItem", exist);
    }
}

Game.prototype.removeUser = function(socketId) {
    console.log("Current users ", this.users);
    console.log("To remove ", socketId);
    this.users = this.users.filter(function(u) {
        return u.socketId !== socketId;
    });
    console.log("Removing", this.users);
    this.io.emit("disconnect", this.users);
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
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = function(socket) {

    game.init({
        io: this,
        socket: socket,
        width: 1024,
        height: 800
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

    socket.on("disconnect", function() {
        game.removeUser(socket.id);
    });
};