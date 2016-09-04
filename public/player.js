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
        this.bullets = [];
        this.health = 5;
        this.energyBar = new Game.EnergyBar(this);
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

    Player.prototype.shot = function(e) {
        var bullet = new Game.Bullet({
            origin: { x: this.x + (this.width / 2), y: this.y + (this.height / 2) },
            target: { x: e.x, y: e.y }
        });
        if (this.bullets.length < 10) {
            this.bullets.push(bullet);
        }
        return bullet.bulletId;
    };

    Player.prototype.clearBullets = function(world) {
        for (var i = 0; i < this.bullets.length; i++) {
            if (this.isNotInCanvas(this.bullets[i], world)) {
                this.bullets.splice(i, 1);
            }
        }
    }

    Player.prototype.isNotInCanvas = function(s, world) {
        return (s.x > world.width || s.x < 0) || (s.y > world.height || s.y < 0);
    }


    Player.prototype.calculateAngle = function(xTarget, yTarget) {
        return Game.calculateAngle(xTarget, yTarget, (this.x - this.xView), (this.y - this.yView));
    }

    Player.prototype.calculateDirection = function(vectors) {
        Game.calculateDirection(vectors, this);
    }

    Player.prototype.draw = function(context, pxView, pyView) {
        this.xView = pxView || 0;
        this.yView = pyView || 0;
        context.save();
        context.fillStyle = "white";
        if (Game.DEBUG) {
            context.fillText((~~this.x) + " " + (~~this.y), this.x - this.xView, this.y - this.height - this.yView);
        } else {
            context.fillText(this.name, this.x - this.xView, this.y - this.height - this.yView);
        }
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
        if (Game.DEBUG) {
            context.strokeRect(-(this.width / 2), -(this.height / 2), this.width, this.height);
        }
        context.restore();
        this.energyBar = new Game.EnergyBar(this);
        this.energyBar.draw(context, this.health, this.xView, this.yView);
        this.energyBar.move(this);
    }

    Player.prototype.hurt = function() {
        if (this.health < 0.1) {
            return true;
        }
        this.health -= 0.1;
    }

    Player.prototype.drawBullets = function(context, sX, sY) {
        if (this.bullets.length === 0) {
            return;
        }
        this.bullets.forEach(function(bullet) {
            bullet.draw(context, sX, sY);
        });
    }

    Game.Player = Player;

})();