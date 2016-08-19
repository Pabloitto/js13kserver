(function () {
    var world = null;
    var worldWidth = null;
    var worldHeight = null;
    var map = null;

    function Player(p) {
        world= p.world;
        map = p.map;
        worldWidth = world.width;
        worldHeight = world.height;
        this.socketId = p.socketId;
        this.name = p.item.name;
        this.x = p.item.x || 0;
        this.y = p.item.y || 0;
        this.speed = 2;
        this.width = 10;
        this.height = 10;
    }

    Player.prototype.update = function (socket) {
        if (world.CONTROLS.left && map.canIMoveTo(this, world.KEY_CONTROLS.LEFT)){
            this.x -= this.speed;
        }

        if (world.CONTROLS.up && map.canIMoveTo(this, world.KEY_CONTROLS.UP)){
            this.y -= this.speed;
        }

        if (world.CONTROLS.right && map.canIMoveTo(this, world.KEY_CONTROLS.RIGHT)){
            this.x += this.speed;
        }

        if (world.CONTROLS.down && map.canIMoveTo(this, world.KEY_CONTROLS.DOWN)){
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

        if(socket){
            socket.emit("userChangePosition", this);
        }
    }

    Player.prototype.draw = function (context, xView, yView) {
        xView = xView || 0;
        yView = yView || 0;
        context.save();
        context.fillStyle = "white";
        context.fillText((~~this.x) + " " + (~~this.y), (this.x - this.width / 2) - xView, (this.y - this.height / 2) - yView);
        context.fillStyle = "black";
        context.fillRect(this.x - xView, this.y - yView , this.width, this.height);
        context.restore();
    }

    Game.Player = Player;

})();