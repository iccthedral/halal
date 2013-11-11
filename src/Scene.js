(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity", "Renderer", "Camera", "Matrix3"], function(HalalEntity, Renderer, Camera, Matrix3) {
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
        this.center = [this.bounds[2] * 0.5, this.bounds[3] * 0.5];
        this.paused = true;
        this.bg_color = meta.bg_color ? meta.bg_color : "white";
        this.entities = [];
        this.draw_camera_center = true;
        this.identity_matrix = Matrix3.create();
        this.update_clip = false;
      }

      Scene.prototype.addCamera = function() {
        this.camera = new Camera(Hal.glass.ctx, 0, 0, this.bounds[2], this.bounds[3], this);
        this.camera.enableDrag();
        this.camera.enableLerp();
        return this.camera.enableZoom();
      };

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        ent.attr("parent", this);
        ent.attr("needs_update", true);
        return ent.init();
      };

      Scene.prototype.rotationMatrix = function() {
        return [Math.cos(this.camera.angle), -Math.sin(this.camera.angle), this.camera.cx, Math.sin(this.camera.angle), Math.cos(this.camera.angle), this.camera.cy, 0, 0, 1];
      };

      Scene.prototype.localMatrix = function() {
        this.local_matrix = [this.camera.zoom, 0, this.camera.x, 0, this.camera.zoom, this.camera.y, 0, 0, 1];
        return this.local_matrix;
      };

      Scene.prototype.destroy = function() {
        return Hal.remove("ENTER_FRAME", this.draw_loop);
      };

      Scene.prototype.update = function() {};

      Scene.prototype.draw = function() {};

      Scene.prototype.init = function() {
        var _this = this;
        this.paused = false;
        this.addCamera();
        this.local_matrix = Matrix3.mul(this.localMatrix(), this.rotationMatrix());
        this.camera.on("CHANGE", function() {
          _this.local_matrix = Matrix3.mul(_this.localMatrix(), _this.rotationMatrix());
          return _this.update_clip = true;
        });
        this.draw_loop = Hal.on("ENTER_FRAME", function(delta) {
          Hal.glass.ctx.fillStyle = _this.bg_color;
          Hal.glass.ctx.fillRect(0, 0, _this.bounds[2], _this.bounds[3]);
          _this.update(delta);
          _this.draw(delta);
          if (_this.draw_camera_center) {
            Hal.glass.ctx.translate(_this.camera.cx, _this.camera.cy);
            Hal.glass.strokeRect([-3, -3, 6, 6], "white");
            return Hal.glass.strokeRect([-_this.camera.w2, -_this.camera.h2, _this.camera.w, _this.camera.h], "yellow");
          }
        });
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
