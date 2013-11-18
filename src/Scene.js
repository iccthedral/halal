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
        this.name = meta.name ? meta.name : Hal.ID();
        this.bounds = meta.bounds ? meta.bounds : Hal.viewportBounds();
        this.ox = this.bounds[2] * 0.5;
        this.oy = this.bounds[3] * 0.5;
        this.paused = true;
        this.bg_color = meta.bg_color ? meta.bg_color : "white";
        this.entities = [];
        this.identity_matrix = Matrix3.create();
        this.update_clip = false;
        this.mpos = [0, 0];
        this.viewport_pos = [0, 0];
        this.world_pos = [0, 0];
        this.quadspace = null;
        this.ent_cache = {};
        this.draw_camera_center = true;
        this.draw_stat = true;
        this.draw_quadspace = true;
        this.local_matrix = Matrix3.create();
        this.resetQuadSpace(this.bounds);
      }

      Scene.prototype.resetQuadSpace = function(dim) {
        this.quadspace = null;
        this.quadspace = new QuadTree(dim);
        return this.quadspace.divide();
      };

      Scene.prototype.addCamera = function() {
        this.camera = new Camera(Hal.glass.ctx, 0, 0, this.bounds[2], this.bounds[3], this);
        this.camera.enableDrag();
        this.camera.enableLerp();
        return this.camera.enableZoom();
      };

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
        this.quadspace.insert(ent);
        ent.attr("parent", this);
        ent.attr("needs_updating", true);
        return ent.trigger("ENTITY_ADDED");
      };

      Scene.prototype.rotationMatrix = function() {
        return [Math.cos(this.camera.angle), -Math.sin(this.camera.angle), 0, Math.sin(this.camera.angle), Math.cos(this.camera.angle), 0, 0, 0, 1];
      };

      Scene.prototype.localMatrix = function() {
        return [this.camera.zoom, 0, this.camera.x, 0, this.camera.zoom, this.camera.y, 0, 0, 1];
      };

      Scene.prototype.worldToLocal = function(pos) {
        return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], this.local_matrix)));
      };

      Scene.prototype.localToWorld = function(pos) {
        var inv;
        inv = Matrix3.transpose(Matrix3.create(), this.local_matrix);
        return Vec2.transformMat3([], pos, inv);
      };

      Scene.prototype.destroy = function() {};

      Scene.prototype.drawStat = function() {
        Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
        Hal.glass.ctx.font = "10pt monospace";
        Hal.glass.ctx.fillStyle = "black";
        Hal.glass.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        Hal.glass.ctx.fillText("Zoom: " + this.camera.zoom, 0, 40);
        Hal.glass.ctx.fillText("Mouse: " + this.mpos[0] + ", " + this.mpos[1], 0, 55);
        Hal.glass.ctx.fillText("Camera pos: " + this.camera.x + ", " + this.camera.y, 0, 70);
        Hal.glass.ctx.fillText("World pos: " + this.world_pos[0] + ", " + this.world_pos[1], 0, 85);
        return Hal.glass.ctx.fillText("Center relative pos: " + (this.mpos[0] - this.ox) + ", " + (this.mpos[1] - this.oy), 0, 100);
      };

      Scene.prototype.removeEntity = function(ent) {
        var ind;
        if (!this.ent_cache[ent.id]) {
          log.error("no such entity " + ent.id);
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          log.error("no such entity " + ent.id);
          return;
        }
        return this.entities.splice(ind, 1);
      };

      Scene.prototype.removeEntityByID = function(entid) {};

      Scene.prototype.update = function() {};

      Scene.prototype.draw = function() {
        Hal.glass.ctx.fillStyle = this.bg_color;
        Hal.glass.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
      };

      Scene.prototype.drawQuadSpace = function(quadspace) {
        if (quadspace.nw != null) {
          this.drawQuadSpace(quadspace.nw);
          Hal.glass.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3]);
        }
        if (quadspace.ne != null) {
          this.drawQuadSpace(quadspace.ne);
          Hal.glass.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3]);
        }
        if (quadspace.sw != null) {
          this.drawQuadSpace(quadspace.sw);
          Hal.glass.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3]);
        }
        if (quadspace.se != null) {
          this.drawQuadSpace(quadspace.se);
          return Hal.glass.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3]);
        }
      };

      Scene.prototype.calcLocalMatrix = function() {
        return this.local_matrix = Matrix3.mul(this.localMatrix(), this.rotationMatrix());
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
        this.camera.on("CHANGE", function() {
          _this.calcLocalMatrix();
          return _this.update_clip = true;
        });
        Hal.on("EXIT_FRAME", function() {
          Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
          if (_this.draw_camera_center) {
            Hal.glass.ctx.translate(_this.camera.cx, _this.camera.cy);
            Hal.glass.strokeRect([-3, -3, 6, 6], "white");
            Hal.glass.strokeRect([-_this.camera.w2, -_this.camera.h2, _this.camera.w, _this.camera.h], "yellow");
            Hal.glass.ctx.translate(-_this.camera.cx, -_this.camera.cy);
          }
          if (_this.draw_stat) {
            _this.drawStat();
          }
          if (_this.draw_quadspace) {
            Hal.glass.ctx.translate(_this.camera.x, _this.camera.y);
            Hal.glass.ctx.scale(_this.camera.zoom, _this.camera.zoom);
            return _this.drawQuadSpace(_this.quadspace);
          }
        });
        Hal.on(["LEFT_CLICK", "LEFT_DBL_CLICK"], function() {
          var ents, p, _i, _len, _results;
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
