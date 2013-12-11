(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["vec2", "matrix3", "shape", "geometry", "mathutil"], function(Vec2, Matrix3, Shape, Geometry, MathUtil) {
    var Line;
    Line = (function(_super) {
      __extends(Line, _super);

      function Line(x1, y1) {
        Line.__super__.constructor.call(this);
        this.setShape([Vec2.from(0, 0), Vec2.from(x1, y1)]);
        return this;
      }

      return Line;

    })(Shape);
    Line.prototype.setShape = function(points) {
      if (points.length > 2) {
        lloge("This is a line, not a polygon");
        this.destroyShape();
        return;
      }
      Line.__super__.setShape.call(this, points);
      this.setOrigin(Number.MIN_VALUE, Number.MIN_VALUE);
      return this;
    };
    Line.prototype.angleBetween = function(l1) {
      var p;
      p = Vec2.transformMat3(null, l1._mesh[1], this._transform);
      return Geometry.angleBetweenLines(p, this._mesh[1]);
    };
    return Line;
  });

}).call(this);
