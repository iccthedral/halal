(function() {
  "use strict";
  /*
   Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
  */

  define(["vec2", "geometry", "bbresolvers"], function(Vec2, Geometry, BBResolvers) {
    var Collidable;
    Collidable = (function() {
      function Collidable() {
        this.in_collision = false;
        this._bbox = new Array();
        this.on("SHAPE_CHANGED", function(mesh) {
          return this._bbox = BBResolvers.AABBFromPolygon(mesh);
        });
        this.on("SPRITE_ADDED", function(sprite) {
          return this._bbox = BBResolvers.AABBoxFromSprite(sprite);
        });
        this.on("COLLISION_STARTED", function(en) {
          this.stroke_color = "yellow";
          return this.in_collision = true;
        });
        this.on("COLLISION_ENDED", function(en) {
          this.stroke_color = "white";
          return this.in_collision = false;
        });
      }

      Collidable.prototype.intersectsWithBBox = function(other) {
        return Geometry.rectangleIntersectsRectangle(Geometry.transformRectangle(other._bbox, this.transform()), Geometry.transformRectangle(this._bbox, other.transform()));
      };

      return Collidable;

    })();
    return Collidable;
  });

}).call(this);
