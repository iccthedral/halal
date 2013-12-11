(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["vec2", "matrix3", "halalentity", "transformable", "drawable"], function(Vec2, Matrix3, HalalEntity, Transformable, Drawable) {
    var Shape;
    Shape = (function(_super) {
      __extends(Shape, _super);

      function Shape() {
        Shape.__super__.constructor.call(this);
        /*
            @extend (@, Transformable)
            @extend (@, Drawable)
        */

        this._mesh = [];
        this._numvertices = 0;
        return this;
      }

      Shape.prototype.setMesh = function(mesh) {
        this.mesh = mesh;
        this._numvertices = this._mesh.length;
        return this;
      };

      Shape.prototype.addVertex = function(x, y) {
        this._numvertices = this._mesh.push(Vec2.from(x, y));
        return this;
      };

      return Shape;

    })(HalalEntity);
    return Polygon;
  });

}).call(this);
