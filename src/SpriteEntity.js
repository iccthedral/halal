(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["Entity", "BBoxAlgos", "SpriteFactory"], function(Entity, BBoxAlgos, SpriteFactory) {
    var SpriteEntity;
    SpriteEntity = (function(_super) {
      __extends(SpriteEntity, _super);

      function SpriteEntity(meta) {
        var _this = this;
        SpriteEntity.__super__.constructor.call(this, meta);
        this.sprite = Hal.asm.getSprite(meta.sprite);
        this.visible_sprite = meta.visible_sprite != null ? meta.visible_sprite : true;
        this.h = meta.height != null ? meta.height : 0;
        this.w = meta.width != null ? meta.width : 0;
        if (this.sprite == null) {
          this.sprite = SpriteFactory.dummySprite();
          Hal.asm.waitFor(this.sprite, meta.sprite);
        } else {
          this.calcShapeAndBBox();
        }
        this.sprite.onLazyLoad = function() {
          return _this.calcShapeAndBBox();
        };
      }

      SpriteEntity.prototype.calcShapeAndBBox = function() {
        return this.attr("bbox", BBoxAlgos.rectBBoxFromSprite(this.sprite));
      };

      SpriteEntity.prototype.draw = function() {
        SpriteEntity.__super__.draw.call(this);
        if (this.visible_sprite) {
          return this.scene.g.drawSprite(this.sprite, this.w, this.h);
        }
      };

      return SpriteEntity;

    })(Entity);
    return SpriteEntity;
  });

}).call(this);
