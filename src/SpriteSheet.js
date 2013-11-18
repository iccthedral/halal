(function() {
  "use strict";
  define(function() {
    var SpriteSheet;
    SpriteSheet = (function() {
      function SpriteSheet(path, img, meta, sprites) {
        var matches;
        this.path = path;
        this.img = img;
        this.meta = meta;
        this.sprites = sprites != null ? sprites : {};
        matches = this.path.match(/.*\/(.*)\.json/);
        if (matches && matches.length > 0) {
          this.name = matches[1];
        } else {
          this.name = this.path;
        }
      }

      SpriteSheet.prototype.addSprite = function(spr) {
        return this.sprites[spr.name] = spr;
      };

      return SpriteSheet;

    })();
    return SpriteSheet;
  });

}).call(this);
