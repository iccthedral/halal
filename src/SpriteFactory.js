(function() {
  "use strict";
  define(["Sprite", "ImgUtils"], function(Sprite, ImgUtils) {
    var SpriteFactory;
    SpriteFactory = {};
    SpriteFactory.clipFromSpriteSheet = function(img, name, cliprect) {
      return new Sprite(ImgUtils.clipImage(img, cliprect), name, 0, 0, cliprect.w, cliprect.h);
    };
    SpriteFactory.fromSingleImage = function(img, name) {
      return new Sprite(img, name, 0, 0, img.width, img.height);
    };
    SpriteFactory.dummySprite = function() {
      var img;
      img = new Image();
      img.src = "";
      return new Sprite(img, "n/a", 0, 0, img.width, img.height);
    };
    return SpriteFactory;
  });

}).call(this);
