(function() {
    var world = null;
    var worldWidth = null;
    var worldHeight = null;
    var map = null;
    var playerImg = null;

    function Player(p) {
        world = p.world;
        map = p.map;
        worldWidth = world.width;
        worldHeight = world.height;
        this.socketId = p.socketId;
        this.name = p.item.name;
        this.x = p.item.x || 0;
        this.y = p.item.y || 0;
        this.speed = 2;
        this.width = 26;
        this.height = 20;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.xView = 0;
        this.yView = 0;
        Game.ImageFactory.loadImage("player");
    }

    Player.prototype.update = function(socket) {
        if (world.CONTROLS.left && map.canIMoveTo(this, world.KEY_CONTROLS.LEFT)) {
            this.x -= this.speed;
        }

        if (world.CONTROLS.up && map.canIMoveTo(this, world.KEY_CONTROLS.UP)) {
            this.y -= this.speed;
        }

        if (world.CONTROLS.right && map.canIMoveTo(this, world.KEY_CONTROLS.RIGHT)) {
            this.x += this.speed;
        }

        if (world.CONTROLS.down && map.canIMoveTo(this, world.KEY_CONTROLS.DOWN)) {
            this.y += this.speed;
        }

        if (this.x - this.width / 2 < 0) {
            this.x = this.width / 2;
        }
        if (this.y - this.height / 2 < 0) {
            this.y = this.height / 2;
        }
        if (this.x + this.width / 2 > worldWidth) {
            this.x = worldWidth - this.width / 2;
        }
        if (this.y + this.height / 2 > worldHeight) {
            this.y = worldHeight - this.height / 2;
        }

        if (socket) {
            socket.emit("userChangePosition", this);
        }
    }

    Player.prototype.calculateAngle = function(xTarget, yTarget) {
        return Math.atan2(yTarget - (this.y - this.yView), xTarget - (this.x - this.xView)) * 180 / Math.PI;
    }

    Player.prototype.calculateDirection = function(vectors) {
        var angle = this.calculateAngle(vectors.target.x, vectors.target.y),
            radians = angle * Math.PI / 180;
        this.vx = Math.cos(radians) * this.speed;
        this.vy = Math.sin(radians) * this.speed;
    }

    Player.prototype.draw = function(context, pxView, pyView) {
        this.xView = pxView || 0;
        this.yView = pyView || 0;
        context.save();
        context.fillStyle = "white";
        //context.fillText((~~this.x) + " " + (~~this.y), this.x - this.xView, this.y - this.height - this.yView);
        context.fillText(this.name,  this.x - this.xView, this.y - this.height - this.yView);
        if (playerImg === null) {
            playerImg = Game.ImageFactory.getImage("player");
        }
        context.translate(this.x - this.xView, this.y - this.yView);
        context.rotate((this.angle + 90) * Math.PI / 180);
        context.drawImage(playerImg,
            0,
            0,
            this.width,
            this.height, -(this.width / 2), -(this.height / 2),
            this.width,
            this.height);
        context.restore();
    }

    Game.Player = Player;

})();