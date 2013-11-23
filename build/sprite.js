(function() {
  "use strict";
  define([], function() {
    var Sprite;
    Sprite = (function() {
      function Sprite(img, name, x, y, w, h) {
        var spl;
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        spl = this.img.src.match(/\/assets\/sprites\/(.*\/)(.*)\.png/);
        this.name = spl && spl[2] ? spl[2] : "";
        this.w2 = this.w * 0.5;
        this.h2 = this.h * 0.5;
        this.folder = spl && spl[1] ? spl[1] : "";
        this.onLazyLoad = null;
      }

      Sprite.prototype.changeSprite = function(other) {
        this.img = other.img;
        this.name = other.name;
        this.x = other.x;
        this.y = other.y;
        this.w = other.w;
        this.h = other.h;
        this.folder = other.folder;
        this.w2 = other.w2;
        this.h2 = other.h2;
        if (this.onLazyLoad != null) {
          return this.onLazyLoad();
        }
      };

      Sprite.prototype.getName = function() {
        return this.folder + this.name;
      };

      return Sprite;

    })();
    return Sprite;
  });

}).call(this);
