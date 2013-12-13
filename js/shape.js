(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["vec2", "matrix3", "halalentity", "transformable", "drawable", "geometry", "collidable", "bbresolvers", "sprite", "groupy"], function(Vec2, Matrix3, HalalEntity, Transformable, Drawable, Geometry, Collidable, BBResolvers, Sprite, Groupy) {
    var Shape, reactives;
    reactives = ["angle", "scale", "position", "origin"];
    Shape = (function(_super) {
      __extends(Shape, _super);

      Shape.include(Transformable);

      Shape.include(Drawable);

      Shape.include(Collidable);

      /* grupi*/


      Shape.include(Groupy);

      function Shape(meta) {
        if (meta == null) {
          meta = {};
        }
        Shape.__super__.constructor.call(this);
        this._mesh = null;
        this._numvertices = 0;
        this.scene = null;
        this.quadtree = null;
        this.ctx = null;
        this.parseMeta(meta);
        this.init();
        return this;
      }

      return Shape;

    })(HalalEntity);
    Shape.prototype.parseMeta = function(meta) {
      if (meta.shape != null) {
        this.setShape(meta.shape);
        this.drawableOnState(Drawable.DrawableStates.Stroke);
      }
      if ((meta.x != null) && (meta.y != null)) {
        return this.setPosition(meta.x, meta.y);
      }
    };
    Shape.prototype.init = function() {
      this.on("CHANGE", function(key, val) {
        if (__indexOf.call(reactives, key) >= 0) {
          this._update_mesh_transform = true;
          this._update_transform = true;
          return this._update_inverse = true;
        }
      });
      Shape.__super__.init.call(this);
      return this;
    };
    Shape.prototype.setSprite = function(sprite) {
      return this.attr("sprite", sprite);
    };
    Shape.prototype.scenePosition = function() {
      return Hal.geometry.transformPoint(this.position[0], this.position[1], Matrix3.mul([], this.scene.transform(), this.transform()));
    };
    Shape.prototype.worldPosition = function() {
      return this.position;
    };
    Shape.prototype.setShape = function(mesh) {
      var center;
      if (!Geometry.isPolygonConvex(mesh)) {
        llogw("Oh snap, mesh was degenerate");
        mesh = Geometry.polygonSortVertices(mesh);
      }
      if (this._mesh != null) {
        this.destroyMesh();
      }
      center = Hal.geometry.polygonMeanPoint(mesh);
      this.setOrigin(center[0], center[1]);
      Vec2.release(center);
      this._mesh = mesh;
      this._numvertices = this._mesh.length;
      this.trigger("SHAPE_CHANGED", this._mesh);
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
    Shape.prototype.update = function(delta) {
      if (this.scene.update_ents) {
        this._update_transform = true;
      }
      this.calcTransform();
    };
    Shape.prototype.draw = function(delta) {
      this.trigger("PRE_FRAME", delta);
      this.ctx.setTransform(this.scene._transform[0], this.scene._transform[3], this.scene._transform[1], this.scene._transform[4], this.scene._transform[2], this.scene._transform[5]);
      this.ctx.transform(this._transform[0], this._transform[3], this._transform[1], this._transform[4], this._transform[2], this._transform[5]);
      this.trigger("POST_FRAME", delta);
    };
    Shape.prototype.angleWithOrigin = function(p) {
      p = Vec2.transformMat3(null, p, this._transform);
      return Geometry.angleOf([p[0] - this.origin[0], p[1] - this.origin[1]]);
    };
    Shape.prototype.addShape = function() {};
    Shape.prototype.destroy = function() {
      this.scene.trigger("ENTITY_REQ_DESTROYING", this);
      this.destroyMesh();
      this.destructor();
      delete this.scene;
      delete this.quadtree;
      delete this.sprite;
    };
    Shape.prototype.destroyMesh = function() {
      var p, _i, _len, _ref;
      this._numvertices = 0;
      if (this._mesh != null) {
        _ref = this._mesh;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          if (p instanceof Float32Array) {
            Vec2.release(p);
          } else {
            llogw("That is some strange mesh");
          }
        }
        return this.trigger("SHAPE_CHANGED");
      }
    };
    return Shape;
  });

}).call(this);
