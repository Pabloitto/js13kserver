Game.EnergyBar = (function() {
    function EnergyBar(model) {
        this.height = 5;
        this.width = (model.health) * 10;
        this.x = model.x;
        this.y = model.y - (this.height * 4);
        this.strokeColor = "black";
        this.fillColor = "red";
    }

    EnergyBar.prototype.move = function(model) {
        this.x = model.x;
        this.y = model.y - (this.height * 4);
    };

    EnergyBar.prototype.draw = function(ctx, life, pxView, pyView) {
        ctx.beginPath();
        ctx.strokeStyle = this.strokeColor;
        ctx.rect(this.x - pxView, this.y - pyView, this.width, this.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.x - pxView, this.y - pyView, this.width, this.height);
        ctx.closePath();
    }

    return EnergyBar;
}());