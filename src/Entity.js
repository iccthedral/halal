(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity", "Scene", "Matrix3", "BBoxAlgos"], function(HalalEntity, Scene, Matrix3, BBoxAlgos) {
    var Entity;
    Entity = (function(_super) {
      __extends(Entity, _super);

      function Entity(meta) {
        if (meta == null) {
          meta = {};
        }
        Entity.__super__.constructor.call(this);
        this.shape = meta.shape ? meta.shape : [0, 0, 10, 10];
        this.x = meta.x ? meta.x : 0;
        this.y = meta.y ? meta.y : 0;
        this.angle = meta.angle ? meta.angle : 0;
        this.scale = meta.scale ? meta.scale : 1;
        this.stroke_color = meta.stroke_color ? meta.stroke_color : "black";
        this.glow = meta.glow ? meta.glow : false;
        this.glow_color = meta.glow_color ? meta.glow_color : "blue";
        this.glow_amount = meta.glow_amount ? meta.glow_amount : 16;
        this.line_width = meta.line_width ? meta.line_width : 1.0;
        this.parent = null;
        this.needs_updating = true;
        this.draw_origin = false;
        this.local_matrix = this.localMatrix();
        this.children = [];
        this.bbox = BBoxAlgos.rectFromPolyShape(this.shape);
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
        return this.on("CHANGE", function(attr) {
          var prop;
          prop = attr[0];
          if (prop === "angle" || prop === "scale" || prop === "x" || prop === "y" || prop === "glow" || prop === "parent" || prop === "line_width") {
            _this.needs_updating = true;
          }
          if (prop === "shape") {
            return _this.bbox = BBoxAlgos.rectFromPolyShape(_this.shape);
          }
        });
      };

      Entity.prototype.addEntity = function(ent) {
        this.children.push(ent);
        ent.attr("parent", this);
        return this.trigger("CHILD_ENTITY_ADDED", ent);
      };

      Entity.prototype.drawOrigin = function() {};

      Entity.prototype.destroy = function() {
        this.parent.removeEntity(this);
        this.parent = null;
        return this.removeAll();
      };

      Entity.prototype.update = function(delta) {
        if (this.needs_updating) {
          this.local_matrix = Matrix3.mul(this.rotationMatrix(), this.localMatrix());
          this.local_matrix = Matrix3.mul(this.local_matrix, this.parent.local_matrix);
          this.needs_updating = false;
          if (!this.glow) {
            return Hal.glass.ctx.shadowBlur = 0;
          }
        }
      };

      Entity.prototype.draw = function(delta) {
        Hal.glass.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        if (this.line_width > 1.0) {
          Hal.glass.ctx.lineWidth = this.line_width;
        }
        if (this.glow) {
          Hal.glass.ctx.shadowBlur = this.glow_amount;
          Hal.glass.ctx.shadowColor = this.glow_color;
        }
        Hal.glass.strokePolygon(this.shape, this.stroke_color);
        if (this.glow) {
          Hal.glass.ctx.shadowBlur = 0;
        }
        if (this.line_width !== 1.0) {
          Hal.glass.ctx.lineWidth = 1.0;
        }
        if (this.draw_origin) {
          Hal.glass.drawLine(0, 0, 0, -100, "green");
          Hal.glass.drawLine(-50, 0, 50, 0, "green");
        }
        if (this.draw_bbox) {
          Hal.glass.strokeRect(this.bbox, "cyan");
        }
        return Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
      };

      return Entity;

    })(HalalEntity);
    return Entity;
  });

}).call(this);
