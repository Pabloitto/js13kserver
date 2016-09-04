Game.Bullet = (function() {
    var vectors = null;

    function Bullet(v) {
        vectors = v;
        this.bulletId = Game.guid();
        this.speed = 5;
        this.vx = 0;
        this.vy = 0;
        this.x = vectors.origin.x;
        this.y = vectors.origin.y;
        this.width = 10;
        this.height = 10;
        this.size = 4;
        this.color = "red";
        Game.calculateDirection(vectors, this);
    }

    Bullet.prototype.move = function() {
        this.x += this.vx;
        this.y += this.vy;
    };

    Bullet.prototype.draw = function(ctx, sX, sY) {
        sX = sX || 0;
        sY = sY || 0;
        this.move();
        ctx.beginPath();
        ctx.arc(this.x - sX, this.y - sY, this.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (Game.DEBUG) {
            ctx.strokeRect(this.x - sX - this.width / 2, this.y - sY - this.height / 2, this.width, this.height);
        }
    }

    return Bullet;

})();