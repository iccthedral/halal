(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["vec2", "matrix3", "halalentity", "transformable", "drawable", "geometry", "collidable", "bbresolvers", "sprite"], function(Vec2, Matrix3, HalalEntity, Transformable, Drawable, Geometry, Collidable, BBResolvers, Sprite) {
    var Shape, reactives;
    reactives = ["angle", "scale", "position", "origin"];
    Shape = (function(_super) {
      __extends(Shape, _super);

      Shape.include(Transformable);

      Shape.include(Drawable);

      Shape.include(Collidable);

      function Shape(meta) {
        Shape.__super__.constructor.call(this);
        this._mesh = null;
        this._numvertices = 0;
        this.scene = null;
        if (meta.shape != null) {
          this.setShape(meta.shape);
          lloge(meta.shape);
          this.drawableOnState(this.DrawableStates.Stroke);
        }
        if ((meta.x != null) && (meta.y != null)) {
          this.setPosition(meta.x, meta.y);
        }
        return this;
      }

      return Shape;

    })(HalalEntity);
    Shape.prototype.init = function() {
      this.on("CHANGE", function(key, val) {
        if (__indexOf.call(reactives, key) >= 0) {
          this._update_mesh_transform = true;
          this._update_transform = true;
          return this._update_inverse = true;
        }
      });
      return this;
    };
    Shape.prototype.setShape = function(mesh) {
      var center;
      if (this._mesh != null) {
        this.destroyMesh();
      }
      if (!Geometry.isPolygonConvex(mesh)) {
        llogw("Oh snap, mesh was degenerate");
        mesh = Geometry.polygonSortVertices(mesh);
      }
      center = Hal.geometry.polygonCentroidPoint(mesh);
      llogd(center);
      this.setOrigin(center[0], center[1]);
      Vec2.release(center);
      llogd(mesh);
      debugger;
      this._mesh = mesh;
      this._numvertices = this._mesh.length;
      this.trigger("SHAPE_CHANGED");
      return this;
    };
    Shape.prototype.addVertex = function(x, y) {
      this._numvertices = this._mesh.push(Vec2.from(x, y));
      if (!Geometry.isPolygonConvex(this._mesh)) {
        llogw("Oh snap, mesh was degenerate");
        this.setShape(Geometry.polygonSortVertices(this._mesh));
      }
      return this;
    };
    Shape.prototype.update = function(ctx, delta) {
      if (this.scene.update_ents) {
        this._update_transform = true;
      }
      this.calcTransform();
    };
    Shape.prototype.draw = function(ctx, delta) {
      this.trigger("PRE_FRAME", ctx, delta);
      ctx.setTransform(this.scene._transform[0], this.scene._transform[3], this.scene._transform[1], this.scene._transform[4], this.scene._transform[2], this.scene._transform[5]);
      ctx.transform(this._transform[0], this._transform[3], this._transform[1], this._transform[4], this._transform[2], this._transform[5]);
      this.trigger("POST_FRAME", ctx, delta);
    };
    Shape.prototype.angleWithOrigin = function(p) {
      p = Vec2.transformMat3(null, p, this._transform);
      return Geometry.angleOf([p[0] - this.origin[0], p[1] - this.origin[1]]);
    };
    Shape.prototype.addShape = function() {};
    Shape.prototype.destroyMesh = function() {
      var p, _i, _len, _ref, _results;
      this._numvertices = 0;
      _ref = this._mesh;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (p instanceof Float32Array) {
          _results.push(Vec2.release(p));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return Shape;
  });

}).call(this);
