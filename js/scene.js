(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2"], function(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2) {
    var Scene;
    Scene = (function(_super) {
      __extends(Scene, _super);

      function Scene(meta) {
        if (meta == null) {
          meta = {};
        }
        Scene.__super__.constructor.call(this);
        this.name = meta.name != null ? meta.name : "" + (Hal.ID());
        this.bounds = meta.bounds != null ? meta.bounds : Hal.viewportBounds();
        this.paused = true;
        this.bg_color = meta.bg_color != null ? meta.bg_color : "white";
        this.entities = [];
        this.identity_matrix = Matrix3.create();
        this.mpos = [0, 0];
        this.viewport_pos = [0, 0];
        this.world_pos = [0, 0];
        this.quadspace = null;
        this.ent_cache = {};
        this.ent_groups = {};
        this.draw_camera_center = meta.draw_camera_center != null;
        this.draw_stat = meta.draw_stat == null;
        this.draw_quadspace = meta.draw_quadspace != null ? meta.draw_quadspace : false;
        this.local_matrix = Matrix3.create();
        this.z = meta.z != null ? meta.z : 1;
        this.g = new Renderer(this.bounds, null, this.z);
        this.cam_bounds = meta.cam_bounds != null ? meta.cam_bounds : this.bounds.slice();
        this.draw_bbox = meta.draw_bbox != null;
        this.draw = meta.draw != null ? meta.draw : function() {};
        this.update = meta.update != null ? meta.update : function() {};
        this.needs_updating = true;
        this.center = [this.bounds[2] * 0.5, this.bounds[3] * 0.5];
        this.search_range = this.bounds[2];
        this.visible_ents = [];
        this.world_center_pos = this.worldToLocal(this.center);
        this.total_rendered = 0;
        this.left_click_listener = null;
        this.left_dbl_click_listener = null;
        this.resetQuadSpace([0, 0, this.cam_bounds[2], this.cam_bounds[3]]);
        this.on("GROUP_CHANGE", function(ent) {
          var group, ind;
          group = this.ent_groups[ent.group];
          if (group == null) {
            group = this.ent_groups[ent.group] = [];
          }
          ind = group.indexOf(ent);
          if (ind !== -1) {
            return group.splice(ind, 1);
          } else {
            return group.push(ent);
          }
        });
      }

      Scene.prototype.resetQuadSpace = function(dim) {
        Hal.log.debug("QuadSpace reset");
        this.quadspace = null;
        this.quadspace = new QuadTree(dim);
        this.quadspace.divide();
        return this.addCamera();
      };

      Scene.prototype.addCamera = function() {
        this.camera = new Camera(this.g.ctx, this.cam_bounds, this);
        this.camera.enableDrag();
        this.camera.enableLerp();
        return this.camera.enableZoom();
      };

      Scene.prototype.addEntityToQuadspace = function(ent) {
        ent = this.addEntity(ent);
        if (!this.quadspace.insert(ent)) {
          Hal.log.warn("Couldn't add entity " + ent.id + " to quadspace");
        }
        return ent;
      };

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
        ent.attr("parent", this);
        ent.attr("scene", this);
        ent.attr("needs_updating", true);
        ent.trigger("ENTITY_ADDED");
        this.trigger("GROUP_CHANGE", ent);
        return ent;
      };

      Scene.prototype.rotationMatrix = function() {
        return [Math.cos(this.camera.angle), -Math.sin(this.camera.angle), this.camera.cx, Math.sin(this.camera.angle), Math.cos(this.camera.angle), this.camera.cy, 0, 0, 1];
      };

      Scene.prototype.localMatrix = function() {
        /*
            @camera.zoom * (@camera.x / @camera.zoom - @camera.cx)
            #(@camera.x / @camera.zoom)# affects how camera.x is
            #scaled on zoom, higher the ratio, harder the camera moves
            All of this is done so that the zoom is applied on the center
            of camera
        */

        return [this.camera.zoom, 0, this.camera.zoom * (this.camera.x - this.camera.cx), 0, this.camera.zoom, this.camera.zoom * (this.camera.y - this.camera.cy), 0, 0, 1];
      };

      Scene.prototype.worldToLocal = function(pos) {
        return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], this.local_matrix)));
      };

      Scene.prototype.localToWorld = function(pos) {
        var inv;
        inv = Matrix3.transpose(Matrix3.create(), this.local_matrix);
        return Vec2.transformMat3([], pos, inv);
      };

      Scene.prototype.destroy = function() {
        this.removeAllEntities();
        this.camera.remove("CHANGE", this.cam_change);
        Hal.remove("EXIT_FRAME", this.exit_frame);
        Hal.remove("ENTER_FRAME", this.enter_frame);
        Hal.remove("LEFT_CLICK", this.left_click_listener);
        Hal.remove("LEFT_DBL_CLICK", this.left_dbl_click_listener);
        Hal.remove("RESIZE", this.resize_event);
        Hal.trigger("DESTROY_SCENE", this);
        this.quadspace = null;
        this.camera = null;
        this.renderer = null;
        return this.removeAll();
      };

      Scene.prototype.drawStat = function() {
        if (this.paused) {
          return;
        }
        Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
        Hal.glass.ctx.clearRect(0, 0, 400, 300);
        Hal.glass.ctx.font = "10pt monospace";
        Hal.glass.ctx.fillStyle = "black";
        Hal.glass.ctx.fillText("FPS: " + Hal.fps, 0, 10);
        Hal.glass.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        Hal.glass.ctx.fillText("Zoom: " + this.camera.zoom, 0, 40);
        Hal.glass.ctx.fillText("Mouse: " + this.mpos[0] + ", " + this.mpos[1], 0, 55);
        Hal.glass.ctx.fillText("Camera pos: " + (this.camera.x.toFixed(2)) + ", " + (this.camera.y.toFixed(2)), 0, 70);
        Hal.glass.ctx.fillText("World pos: " + (this.world_pos[0].toFixed(2)) + ", " + (this.world_pos[1].toFixed(2)), 0, 85);
        Hal.glass.ctx.fillText("Center relative pos: " + (this.mpos[0] - this.camera.cx - this.bounds[0]) + ", " + (this.mpos[1] - this.camera.cy - this.bounds[1]), 0, 100);
        return Hal.glass.ctx.fillText("Rendered total: " + this.total_rendered, 0, 175);
      };

      Scene.prototype.removeEntity = function(ent) {
        var group, ind;
        if (!this.ent_cache[ent.id]) {
          log.error("No such entity " + ent.id + " in cache");
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          log.error("No such entity " + ent.id + " in entity list");
          return;
        }
        group = this.ent_groups[ent.group];
        if (group != null) {
          ind = group.indexOf(ent);
          group.splice(ind, 1);
        }
        delete this.ent_cache[ent.id];
        this.trigger("ENTITY_DESTROYED", ent);
        return this.entities.splice(ind, 1);
      };

      Scene.prototype.getAllEntities = function() {
        return this.entities.slice();
      };

      Scene.prototype.removeAllEntities = function(destroy_children) {
        var ent, _i, _len, _ref;
        if (destroy_children == null) {
          destroy_children = false;
        }
        _ref = this.getAllEntities();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ent = _ref[_i];
          ent.destroy(destroy_children);
        }
      };

      Scene.prototype.removeEntityByID = function(entid) {
        var ent;
        ent = this.ent_cache[entid];
        if (ent != null) {
          return ent.removeEntity(ent);
        } else {
          return log.error("No such entity " + entid + " in entity cache");
        }
      };

      Scene.prototype.update_ = function(delta) {
        this.delta = delta;
        this.total_rendered = 0;
        if (this.needs_updating) {
          this.applyIdentity();
          this.g.ctx.fillStyle = this.bg_color;
          this.g.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
          this.calcLocalMatrix();
          this.updateSceneGraph(this.quadspace);
        }
        return this.update(delta);
      };

      Scene.prototype.draw_ = function(delta) {
        var ent, _i, _len, _ref;
        this.delta = delta;
        if (this.paused) {
          return;
        }
        this.applyLocal();
        if (this.draw_quadspace) {
          this.drawQuadSpace(this.quadspace);
          this.g.ctx.textAlign = "start";
          this.g.strokeRect(this.camera.view_frustum, "green");
        }
        if (this.needs_updating) {
          _ref = this.visible_ents;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ent = _ref[_i];
            ent.draw(this.delta);
            this.total_rendered++;
          }
          this.visible_ents = [];
          this.needs_updating = false;
        }
        return this.draw(delta);
      };

      Scene.prototype.applyLocal = function() {
        return this.g.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
      };

      Scene.prototype.applyIdentity = function() {
        return this.g.ctx.setTransform(this.identity_matrix[0], this.identity_matrix[3], this.identity_matrix[1], this.identity_matrix[4], this.identity_matrix[2], this.identity_matrix[5]);
      };

      Scene.prototype.updateSceneGraph = function(quadspace) {
        if (this.paused) {

        }
      };

      Scene.prototype.drawQuadSpace = function(quadspace) {
        if (this.paused) {
          return;
        }
        this.g.ctx.textAlign = "center";
        this.g.ctx.fillStyle = "white";
        if (quadspace.nw != null) {
          this.drawQuadSpace(quadspace.nw);
          this.g.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3]);
          this.g.ctx.fillText("" + quadspace.nw.id, quadspace.nw.bounds[0] + quadspace.nw.bounds[2] * 0.5, quadspace.nw.bounds[1] + quadspace.nw.bounds[3] * 0.5);
        }
        if (quadspace.ne != null) {
          this.drawQuadSpace(quadspace.ne);
          this.g.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3]);
          this.g.ctx.fillText("" + quadspace.ne.id, quadspace.ne.bounds[0] + quadspace.ne.bounds[2] * 0.5, quadspace.ne.bounds[1] + quadspace.ne.bounds[3] * 0.5);
        }
        if (quadspace.sw != null) {
          this.drawQuadSpace(quadspace.sw);
          this.g.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3]);
          this.g.ctx.fillText("" + quadspace.sw.id, quadspace.sw.bounds[0] + quadspace.sw.bounds[2] * 0.5, quadspace.sw.bounds[1] + quadspace.sw.bounds[3] * 0.5);
        }
        if (quadspace.se != null) {
          this.drawQuadSpace(quadspace.se);
          this.g.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3]);
          return this.g.ctx.fillText("" + quadspace.se.id, quadspace.se.bounds[0] + quadspace.se.bounds[2] * 0.5, quadspace.se.bounds[1] + quadspace.se.bounds[3] * 0.5);
        }
      };

      Scene.prototype.calcLocalMatrix = function() {
        return this.local_matrix = Matrix3.mul(this.localMatrix(), this.rotationMatrix());
      };

      Scene.prototype.pause = function() {
        return this.attr("paused", true);
      };

      Scene.prototype.resume = function() {
        return this.attr("paused", false);
      };

      Scene.prototype.group = function(group) {
        if (this.ent_groups[group] == null) {
          return [];
        }
        return this.ent_groups[group].slice();
      };

      Scene.prototype.init = function() {
        var _this = this;
        this.paused = false;
        this.attr("draw_bbox", this.draw_bbox != null);
        this.on("CHANGE", function(prop) {
          var _this = this;
          if (prop) {
            if (prop[0] === "draw_quadspace") {

            } else if (prop[0] === "draw_bbox") {
              return this.entities.forEach(function(v) {
                return v.attr("draw_bbox", _this.draw_bbox);
              });
            }
          }
        });
        this.cam_change = this.camera.on("CHANGE", function() {
          if (_this.paused) {
            return;
          }
          return _this.needs_updating = true;
        });
        this.resize_event = Hal.on("RESIZE", function(area) {
          _this.g.resize(area.width, area.height);
          _this.bounds[2] = area.width;
          _this.bounds[3] = area.height;
          return _this.camera.resize(area.width, area.height);
        });
        this.exit_frame = Hal.on("EXIT_FRAME", function() {
          if (_this.paused) {
            return;
          }
          if (_this.draw_camera_center) {
            _this.g.ctx.setTransform(1, 0, 0, 1, 0, 0);
            _this.g.ctx.translate(_this.camera.cx, _this.camera.cy);
            _this.g.strokeRectO([0, 0, 6, 6], "white");
            _this.g.ctx.lineWidth = 5;
            _this.g.strokeRectO([0, 0, _this.camera.w, _this.camera.h], "white");
            _this.g.ctx.translate(-_this.camera.cx, -_this.camera.cy);
            _this.g.ctx.lineWidth = 1;
          }
          if (_this.draw_stat) {
            return _this.drawStat();
          }
        });
        this.calcLocalMatrix();
        this.left_click_listener = Hal.on("LEFT_CLICK", function(pos) {
          return _this.trigger("LEFT_CLICK", pos);
        });
        this.left_dbl_click_listener = Hal.on("LEFT_DBL_CLICK", function(pos) {
          return _this.trigger("LEFT_DBL_CLICK", pos);
        });
        return this.on("ENTITY_MOVING", function(ent) {
          if (!Hal.math.isPointInRect(ent.viewportPos(), ent.quadspace.bounds)) {
            Hal.log.debug("i'm out of my quadspace " + ent.id);
            ent.quadspace.remove(ent);
            this.quadspace.insert(ent);
          }
          return this.camera.trigger("CHANGE");
        });
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
