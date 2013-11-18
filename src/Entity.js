(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity", "Scene", "Matrix3", "BBoxAlgos", "Vec2"], function(HalalEntity, Scene, Matrix3, BBoxAlgos, Vec2) {
    var Entity;
    Entity = (function(_super) {
      __extends(Entity, _super);

      function Entity(meta) {
        if (meta == null) {
          meta = {};
        }
        Entity.__super__.constructor.call(this);
        this.id = Hal.ID();
        this.shape = meta.shape ? meta.shape : [[0, 0], [0, 1], [1, 1], [1, 0]];
        this.x = meta.x ? meta.x : 0;
        this.y = meta.y ? meta.y : 0;
        this.angle = meta.angle ? meta.angle : 0;
        this.scale = meta.scale ? meta.scale : 1;
        this.stroke_color = meta.stroke_color ? meta.stroke_color : "black";
        this.glow = meta.glow ? meta.glow : false;
        this.glow_color = meta.glow_color ? meta.glow_color : "blue";
        this.glow_amount = meta.glow_amount ? meta.glow_amount : 16;
        this.line_width = meta.line_width ? meta.line_width : 1.0;
        this.draw_shape = meta.draw_shape ? meta.draw_shape : true;
        this.parent = null;
        this.world_pos = [0, 0];
        this.ent_cache = {};
        this.quadspace = null;
        this.needs_updating = true;
        this.draw_origin = false;
        this.local_matrix = this.localMatrix();
        this.bbox = BBoxAlgos.rectFromPolyShape(this.shape);
        this.children = [];
        this.shapes = [];
        this.drawables = [];
        this.selected_color = "red";
        this.unselected_color = this.stroke_color;
        this.on("CHANGE", function(attr) {
          var ch, prop, _i, _len, _ref, _results;
          prop = attr[0];
          if (prop === "angle" || prop === "scale" || prop === "x" || prop === "y" || prop === "glow" || prop === "parent" || prop === "line_width") {
            this.needs_updating = true;
          }
          if (prop === "shape") {
            this.bbox = BBoxAlgos.rectFromPolyShape(this.shape);
            this.needs_updating = true;
          }
          if (prop === "x" || prop === "y") {
            if (this.parent != null) {
              this.parent.trigger("ENTITY_MOVING", this);
              _ref = this.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ch = _ref[_i];
                _results.push(this.parent.trigger("ENTITY_MOVING", ch));
              }
              return _results;
            }
          }
        });
        this.on("ENTITY_ADDED", function() {
          log.debug("yay, I've been added " + this.id);
          return this.init();
        });
      }

      Entity.prototype.localMatrix = function() {
        return [this.scale, 0, this.x, 0, this.scale, this.y, 0, 0, 1];
      };

      Entity.prototype.rotationMatrix = function() {
        return [Math.cos(this.angle), -Math.sin(this.angle), 0, Math.sin(this.angle), Math.cos(this.angle), 0, 0, 0, 1];
      };

      Entity.prototype.init = function() {
        var _this = this;
        if (this.parent instanceof Scene) {
          this.parent.camera.on("CHANGE", function() {
            return _this.needs_updating = true;
          });
        }
        this.on("EXIT_FRAME", function() {
          return Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        return this.on("LEFT_CLICK", function(attr) {
          this.selected = !this.selected;
          return log.debug("yay, i've been selected: " + this.id);
        });
      };

      Entity.prototype.viewportPos = function() {
        var inv;
        inv = Matrix3.transpose([], this.local_matrix);
        return Vec2.transformMat3([], [0, 0], inv);
      };

      Entity.prototype.worldPos = function() {
        return [this.x, this.y];
      };

      Entity.prototype.localToWorld = function(pos) {
        var inv;
        inv = Matrix3.transpose([], this.local_matrix);
        return Vec2.transformMat3([], pos, inv);
      };

      Entity.prototype.worldToLocal = function(pos) {
        return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], this.local_matrix)));
      };

      Entity.prototype.addEntity = function(ent) {
        this.children.push(ent);
        this.parent.addEntity(ent);
        ent.attr("parent", this);
        return this.trigger("CHILD_ENTITY_ADDED", ent);
      };

      Entity.prototype.removeEntity = function(ent) {};

      Entity.prototype.drawOrigin = function() {};

      Entity.prototype.destroy = function() {
        this.parent.removeEntity(this);
        this.parent = null;
        return this.removeAll();
      };

      Entity.prototype.update = function(delta) {
        Hal.glass.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        if (this.needs_updating) {
          this.local_matrix = Matrix3.mul(this.rotationMatrix(), this.localMatrix());
          this.local_matrix = Matrix3.mul(this.local_matrix, this.parent.local_matrix);
          this.needs_updating = false;
          if (!this.glow) {
            return Hal.glass.ctx.shadowBlur = 0;
          }
        }
      };

      Entity.prototype.addDrawable = function(drawableFunc) {
        return this.drawables.push(drawableFunc);
      };

      Entity.prototype.addShape = function(shape) {
        return this.shapes.push(shape);
      };

      Entity.prototype.draw = function(delta) {
        var s, _i, _j, _len, _len1, _ref, _ref1, _results;
        if (this.draw_shape) {
          if (this.line_width > 1.0) {
            Hal.glass.ctx.lineWidth = this.line_width;
          }
        }
        if (this.glow) {
          Hal.glass.ctx.shadowBlur = this.glow_amount;
          Hal.glass.ctx.shadowColor = this.glow_color;
        }
        if (this.draw_shape) {
          Hal.glass.strokePolygon(this.shape, !this.selected ? this.stroke_color : this.selected_color);
        }
        if (this.glow) {
          Hal.glass.ctx.shadowBlur = 0;
        }
        if (this.line_width !== 1.0 && this.draw_shape) {
          Hal.glass.ctx.lineWidth = 1.0;
        }
        if (this.draw_origin) {
          Hal.glass.drawLine(0, 0, 0, -100, "green");
          Hal.glass.drawLine(-50, 0, 50, 0, "green");
        }
        if (this.draw_bbox) {
          Hal.glass.strokeRect(this.bbox, "cyan");
        }
        _ref = this.drawables;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          s.call(this, delta);
        }
        _ref1 = this.shapes;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          s = _ref1[_j];
          _results.push(Hal.glass.strokePolygon(s, "blue"));
        }
        return _results;
      };

      return Entity;

    })(HalalEntity);
    return Entity;
  });

}).call(this);
