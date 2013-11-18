(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity", "Renderer", "Camera", "Matrix3", "QuadTree", "Vec2"], function(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2) {
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
        this.update_clip = false;
        this.mpos = [0, 0];
        this.viewport_pos = [0, 0];
        this.world_pos = [0, 0];
        this.quadspace = null;
        this.ent_cache = {};
        this.draw_camera_center = meta.draw_camera_center != null ? meta.draw_camera_center : false;
        this.draw_stat = meta.draw_stat != null ? meta.draw_stat : true;
        this.draw_quadspace = meta.draw_quadspace != null ? meta.draw_quadspace : false;
        this.local_matrix = Matrix3.create();
        this.z = meta.z != null ? meta.z : 1;
        this.g = new Renderer(this.bounds, null, this.z);
        this.cam_bounds = meta.cam_bounds != null ? meta.cam_bounds : this.bounds.slice();
        log.debug(this.cam_bounds);
        this.resetQuadSpace(this.cam_bounds);
      }

      Scene.prototype.resetQuadSpace = function(dim) {
        log.debug("QuadSpace reset");
        this.quadspace = null;
        this.quadspace = new QuadTree(dim);
        return this.quadspace.divide();
      };

      Scene.prototype.addCamera = function() {
        this.camera = new Camera(this.g.ctx, this.cam_bounds, this);
        this.camera.enableDrag();
        this.camera.enableLerp();
        return this.camera.enableZoom();
      };

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
        this.quadspace.insert(ent);
        ent.attr("parent", this);
        ent.attr("scene", this);
        ent.attr("needs_updating", true);
        ent.trigger("ENTITY_ADDED");
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
        Hal.remove("LEFT_CLICK", this.click_listeners);
        Hal.remove("LEFT_DBL_CLICK", this.click_listeners);
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
        this.g.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.g.ctx.font = "10pt monospace";
        this.g.ctx.fillStyle = "black";
        this.g.ctx.fillText("FPS: " + Hal.fps, 0, 10);
        this.g.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        this.g.ctx.fillText("Zoom: " + this.camera.zoom, 0, 40);
        this.g.ctx.fillText("Mouse: " + this.mpos[0] + ", " + this.mpos[1], 0, 55);
        this.g.ctx.fillText("Camera pos: " + this.camera.x + ", " + this.camera.y, 0, 70);
        this.g.ctx.fillText("World pos: " + this.world_pos[0] + ", " + this.world_pos[1], 0, 85);
        return this.g.ctx.fillText("Center relative pos: " + (this.mpos[0] - this.camera.cx - this.bounds[0]) + ", " + (this.mpos[1] - this.camera.cy - this.bounds[1]), 0, 100);
      };

      Scene.prototype.removeEntity = function(ent) {
        var ind;
        if (!this.ent_cache[ent.id]) {
          log.error("No such entity " + ent.id);
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          log.error("No such entity " + ent.id);
          return;
        }
        delete this.ent_cache[ent.id];
        this.trigger("ENTITY_DESTROYED", ent);
        this.entities[ind] = null;
        return this.entities.splice(ind, 1);
      };

      Scene.prototype.getAllEntities = function() {
        return this.entities.slice();
      };

      Scene.prototype.removeAllEntities = function() {
        var ent, _i, _len, _ref;
        _ref = this.getAllEntities();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ent = _ref[_i];
          ent.destroy(false);
        }
      };

      Scene.prototype.removeEntityByID = function(entid) {
        var ent;
        ent = this.ent_cache[entid];
        if (ent != null) {
          return ent.removeEntity(ent);
        } else {
          return log.error("No such entity " + entid);
        }
      };

      Scene.prototype.update = function() {};

      Scene.prototype.draw = function() {
        if (this.paused) {
          return;
        }
        this.g.ctx.fillStyle = this.bg_color;
        return this.g.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
      };

      Scene.prototype.drawQuadSpace = function(quadspace) {
        if (this.paused) {
          return;
        }
        if (quadspace.nw != null) {
          this.drawQuadSpace(quadspace.nw);
          this.g.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3]);
        }
        if (quadspace.ne != null) {
          this.drawQuadSpace(quadspace.ne);
          this.g.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3]);
        }
        if (quadspace.sw != null) {
          this.drawQuadSpace(quadspace.sw);
          this.g.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3]);
        }
        if (quadspace.se != null) {
          this.drawQuadSpace(quadspace.se);
          return this.g.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3]);
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

      Scene.prototype.init = function() {
        var _this = this;
        this.paused = false;
        this.addCamera();
        this.calcLocalMatrix();
        this.on("CHANGE", function(prop) {
          if (prop && prop[0] === "draw_quadspace") {

          }
        });
        this.cam_change = this.camera.on("CHANGE", function() {
          if (_this.paused) {
            return;
          }
          _this.calcLocalMatrix();
          return _this.update_clip = true;
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
            _this.g.strokeRect([-3, -3, 6, 6], "white");
            _this.g.ctx.lineWidth = 5;
            _this.g.strokeRect([-_this.camera.w2, -_this.camera.h2, _this.camera.w, _this.camera.h], "white");
            _this.g.ctx.translate(-_this.camera.cx, -_this.camera.cy);
            _this.g.ctx.lineWidth = 1;
          }
          if (_this.draw_stat) {
            return _this.drawStat();
          }
        });
        this.click_listeners = Hal.on(["LEFT_CLICK", "LEFT_DBL_CLICK"], function() {
          var ents, p, _i, _len, _results;
          if (_this.paused) {
            return;
          }
          ents = _this.quadspace.searchInRange(_this.world_pos, _this.search_range, _this);
          log.debug("Nasao entiteta: " + ents.length);
          _results = [];
          for (_i = 0, _len = ents.length; _i < _len; _i++) {
            p = ents[_i];
            if (Hal.math.isPointInRect(p.worldToLocal(_this.localToWorld(_this.world_pos)), p.bbox)) {
              _results.push(p.trigger("LEFT_CLICK"));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
        return this.on("ENTITY_MOVING", function(ent) {
          if (!Hal.math.isPointInRect(ent.viewportPos(), ent.quadspace.bounds)) {
            log.debug("i'm out of my quadspace " + ent.id);
            ent.quadspace.remove(ent);
            this.quadspace.insert(ent);
          }
          this.camera.trigger("CHANGE");
          return this.calcLocalMatrix();
        });
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
