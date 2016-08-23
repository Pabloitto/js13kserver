(function() {

    var path = '/img/',
        ext = '.png',
        loaded = {};

    Game.ImageFactory = {
        loadImage: function(name) {
            var image = null;
            if (!loaded[name + ext]) {
                image = new Image();
                loaded[name + ext] = image;
                image.src = path + name + ext;
            } else {
                image = loaded[name + ext];
            }
            return image;
        },
        getImage: function(name) {
            return loaded[name + ext];
        }
    }
}());