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
        if (this.sprite == null) {
          this.sprite = SpriteFactory.dummySprite();
          Hal.asm.waitFor(this.sprite, meta.sprite);
        }
        this.sprite.onLazyLoad = function() {
          var b_rect, i, pt, shape, _i, _len;
          _this.attr("bbox", BBoxAlgos.rectBBoxFromSprite(_this.sprite));
          shape = BBoxAlgos.polyBBoxFromSprite(_this.sprite);
          b_rect = BBoxAlgos.rectFromPolyShape(shape);
          for (i = _i = 0, _len = shape.length; _i < _len; i = ++_i) {
            pt = shape[i];
            shape[i][0] -= b_rect[2] * 0.5;
            shape[i][1] -= b_rect[3] * 0.5;
          }
          return _this.attr("shape", shape);
        };
      }

      SpriteEntity.prototype.draw = function() {
        SpriteEntity.__super__.draw.call(this);
        return Hal.glass.drawSprite(this.sprite);
      };

      return SpriteEntity;

    })(Entity);
    return SpriteEntity;
  });

}).call(this);
