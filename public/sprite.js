Game.Sprite = function(config) {

    var x = 0;
    var y = 0;
    var image = null;
    var onImageLoad = function() {};

    this.spriteName = config.spriteName;
    this.currentState = config.currentState;
    this.size = config.size;
    this.states = config.states;
    this.fps = config.fps;
    this.animationConfig = null;

    this.init = function() {
        var state = this.states.find(function(s) {
            return s.current === true;
        });
        x = state.startOn.x;
        y = state.startOn.y;
        image = new Image();
        image.src = "/img/" + this.spriteName + ".png";
        image.onload = function() {
            onImageLoad.bind(this)();
        }.bind(this);
        return this;
    }

    this.then = function(callBack) {
        onImageLoad = callBack;
        return this;
    }

    this.animate = function(config) {
        if (config.loop === false) {
            this.startAnimation(config);
            return this;
        }
        setInterval(function() {
            this.startAnimation(config);
        }.bind(this), this.fps);

        return this;
    }

    this.startAnimation = function(config) {
        this.animationConfig = config;
        var state = this.states.find(function(s) {
            return s.current === true;
        });
        if (state) {
            config.ctx.clearRect(config.position.x, config.position.y, this.size.width, this.size.height);
            config.ctx.drawImage(image,
                x * this.size.width,
                y * this.size.height,
                this.size.width,
                this.size.height,
                config.position.x,
                config.position.y,
                this.size.width,
                this.size.height);

            if (config.loop === true) {
                this.updateAnimationPosition(state);
            }
        }
    }

    this.updateAnimationPosition = function(state) {
        if (x < state.endOn.x) {
            x++;
        } else {
            x = state.startOn.x;
        }

        if (y < state.endOn.y) {
            y++;
        } else {
            y = state.startOn.y;
        }
    }

    this.setState = function(name, overrideConfig, repaint) {
        this.states.forEach(function(element) {
            element.current = false;
            if (element.name === name) {
                element.current = true;
                x = element.startOn.x;
                y = element.startOn.y;
            }
        }, this);
        if (repaint === true) {
            this.animationConfig.position = overrideConfig.position;
            this.startAnimation(this.animationConfig);
        }
        return this;
    }

    return this;
};