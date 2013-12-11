(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["halalentity", "scene", "matrix3", "bboxalgos", "vec2"], function(HalalEntity, Scene, Matrix3, BBoxAlgos, Vec2) {
    var Entity;
    Entity = (function(_super) {
      __extends(Entity, _super);

      function Entity(meta) {
        if (meta == null) {
          meta = {};
        }
        Entity.__super__.constructor.call(this);
        this.id = Hal.ID();
        this.shape = meta.shape != null ? meta.shape : [[0, 0], [0, 1], [1, 1], [1, 0]];
        this.x = meta.x != null ? meta.x : 0;
        this.y = meta.y != null ? meta.y : 0;
        this.angle = meta.angle != null ? meta.angle : 0;
        this.scale = meta.scale != null ? meta.scale : 1;
        this.stroke_color = meta.stroke_color != null ? meta.stroke_color : "black";
        this.glow = meta.glow != null ? meta.glow : false;
        this.glow_color = meta.glow_color != null ? meta.glow_color : "blue";
        this.glow_amount = meta.glow_amount != null ? meta.glow_amount : 16;
        this.line_width = meta.line_width != null ? meta.line_width : 1.0;
        this.draw_shape = meta.draw_shape != null ? meta.draw_shape : true;
        this.opacity = meta.opacity != null ? meta.opacity : 1;
        this.parent = null;
        this.world_pos = [0, 0];
        this.group = meta.group != null ? meta.group : "default";
        this.quadspace = null;
        this.needs_updating = true;
        this.draw_origin = false;
        this.local_matrix = this.localMatrix();
        this.calcShapeAndBox();
        this.children = [];
        this.shapes = [];
        this.drawables = [];
        this.ent_groups = {};
        this.scene = null;
        this.selected_color = "white";
        this.unselected_color = this.stroke_color;
        this.on("CHANGE", function(attr) {
          var ch, prop, _i, _len, _ref;
          prop = attr[0];
          if (prop === "angle" || prop === "scale" || prop === "h" || prop === "w" || prop === "x" || prop === "y" || prop === "glow" || prop === "parent" || prop === "line_width") {
            if (this.parent != null) {
              this.parent.needs_updating = true;
            }
            this.needs_updating = true;
          }
          if (prop === "shape") {
            this.calcShapeAndBox();
          }
          if (prop === "x" || prop === "y") {
            if ((this.parent != null) && (this.quadspace != null)) {
              this.parent.trigger("ENTITY_MOVING", this);
              _ref = this.children;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ch = _ref[_i];
                this.parent.trigger("ENTITY_MOVING", ch);
              }
            }
          }
          if (prop === "group") {
            return this.trigger("GROUP_CHANGE", this);
          }
        });
        this.on("GROUP_CHANGE", function(ent) {
          var group, ind;
          group = this.ent_groups[ent.group];
          if (group == null) {
            group = this.ent_groups[ent.group] = [];
          }
          ind = group.indexOf(ent);
          if (ind !== -1) {
            group.splice(ind, 1);
          } else {
            group.push(ent);
          }
          if (this.parent != null) {
            return this.parent.trigger("GROUP_CHANGE", ent);
          }
        });
        this.on("ENTITY_ADDED", function() {
          return this.init();
        });
      }

      Entity.prototype.calcShapeAndBox = function() {
        return this.attr("bbox", BBoxAlgos.rectFromPolyShape(this.shape));
      };

      Entity.prototype.localMatrix = function() {
        return [this.scale, 0, this.x, 0, this.scale, this.y, 0, 0, 1];
      };

      Entity.prototype.rotationMatrix = function() {
        return [Math.cos(this.angle), -Math.sin(this.angle), 0, Math.sin(this.angle), Math.cos(this.angle), 0, 0, 0, 1];
      };

      Entity.prototype.requestUpdate = function() {
        return this.scene.needs_updating = true;
      };

      Entity.prototype.group = function(group) {
        if (this.ent_groups[group] == null) {
          return [];
        }
        return this.ent_groups[group].slice();
      };

      Entity.prototype.init = function() {
        this.on("EXIT_FRAME", function() {
          return this.scene.g.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        return this.on("LEFT_CLICK", function(attr) {
          this.selected = !this.selected;
          if (this.selected) {
            return this.trigger("SELECTED");
          } else {
            return this.trigger("DESELECTED");
          }
        });
      };

      Entity.prototype.viewportPos = function() {
        var inv;
        inv = Matrix3.transpose([], this.local_matrix);
        return Vec2.transformMat3([], [0, 0], inv);
      };

      Entity.prototype.worldPos = function() {
        return this.localToWorld([this.x, this.y]);
      };

      Entity.prototype.localToWorld = function(pos) {
        return Vec2.transformMat3([], pos, this.scene.local_matrix);
      };

      Entity.prototype.worldToLocal = function(pos) {
        return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], this.local_matrix)));
      };

      Entity.prototype.addEntity = function(ent) {
        this.children.push(ent);
        this.trigger("CHILD_ENTITY_ADDED", ent);
        ent.attr("scene", this.scene);
        ent.attr("parent", this);
        ent.attr("is_child", true);
        return this.trigger("GROUP_CHANGE", ent.group);
      };

      Entity.prototype.addEntityToQuadspace = function(ent) {
        this.children.push(ent);
        this.trigger("CHILD_ENTITY_ADDED", ent);
        ent.attr("scene", this.scene);
        ent.attr("parent", this);
        ent.attr("is_child", true);
        this.trigger("GROUP_CHANGE", ent.group);
        return ent;
      };

      Entity.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = false;
        }
        this.removeAll();
        if (this.scene == null) {
          llogw("this entity didn't belong to a scene");
        } else {
          this.scene.removeEntity(this);
        }
        this.destroyChildren(destroy_children);
        this.children = null;
        this.drawables = null;
        this.parent = null;
        if (this.quadspace == null) {
          llogw("this entity had no quadspace");
        } else {
          this.quadspace.remove(this);
        }
        this.quadspace = null;
        this.scene = null;
        return this.trigger("DESTROY");
      };

      Entity.prototype.destroyChildren = function(destroy_children) {
        var c, _i, _len, _ref, _results;
        if (!destroy_children || (this.children == null)) {
          return;
        }
        _ref = this.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.destroy(destroy_children));
        }
        return _results;
      };

      Entity.prototype.update = function(delta) {
        var c, _i, _len, _ref, _results;
        if (this.needs_updating) {
          if (!this.glow) {
            this.scene.g.ctx.shadowBlur = 0;
          }
          this.calcLocalMatrix();
          _ref = this.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            _results.push(c.update(delta));
          }
          return _results;
        }
      };

      Entity.prototype.calcLocalMatrix = function() {
        this.local_matrix = Matrix3.mul(this.rotationMatrix(), this.localMatrix());
        return this.local_matrix = Matrix3.mul(this.local_matrix, this.parent.local_matrix);
      };

      Entity.prototype.addDrawable = function(drawableFunc) {
        return this.drawables.push(drawableFunc);
      };

      Entity.prototype.addShape = function(shape) {
        return this.shapes.push(shape);
      };

      Entity.prototype.draw = function(delta) {
        var c, s, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
        if (this.needs_updating) {
          this.scene.g.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
          this.needs_updating = false;
        }
        this.scene.g.ctx.globalAlpha = this.opacity;
        if (this.draw_shape) {
          if (this.line_width > 1.0) {
            this.scene.g.ctx.lineWidth = this.line_width;
          }
        }
        if (this.draw_shape) {
          this.scene.g.strokePolygon(this.shape, !this.selected ? this.stroke_color : this.selected_color);
        }
        if (this.line_width !== 1.0 && this.draw_shape) {
          this.scene.g.ctx.lineWidth = 1.0;
        }
        if (this.draw_origin) {
          this.scene.g.drawLine(0, 0, 0, -100, "green");
          this.scene.g.drawLine(-50, 0, 50, 0, "green");
        }
        if (this.draw_bbox) {
          this.scene.g.strokeRect(this.bbox, "cyan");
        }
        _ref = this.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          c.draw(delta);
        }
        _ref1 = this.drawables;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          s = _ref1[_j];
          s.call(this, delta);
        }
        _ref2 = this.shapes;
        _results = [];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          s = _ref2[_k];
          _results.push(this.scene.g.strokePolygon(s, "blue"));
        }
        return _results;
      };

      return Entity;

    })(HalalEntity);
    return Entity;
  });

}).call(this);
