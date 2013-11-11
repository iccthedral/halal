(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["Vec2", "HalalEntity", "Renderer"], function(Vec2, HalalEntity, Renderer) {
    var Camera;
    Camera = (function(_super) {
      __extends(Camera, _super);

      function Camera(ctx, x, y, w, h, scene) {
        var camera_canvas,
          _this = this;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.scene = scene;
        Camera.__super__.constructor.call(this);
        camera_canvas = Hal.dom.createCanvasLayer(50000);
        Hal.dom.addCanvas(camera_canvas, 0, 0, true);
        this.cctx = camera_canvas.getContext("2d");
        this.dragging = false;
        this.start_drag_point = [0, 0];
        this.prev_pos = [this.x, this.y];
        this.zoom = 1;
        this.zoom_step = 0.1;
        this.camera_speed = 3.8;
        this.angle = 0;
        this.bounds = [0, 0, this.w, this.h];
        this.cx = this.bounds[2] * 0.5;
        this.cy = this.bounds[3] * 0.5;
        this.w2 = this.w * 0.5;
        this.h2 = this.h * 0.5;
        this.center_point = [this.scene.bounds[2] / 2, this.scene.bounds[3] / 2];
        this.lerp_to = this.center_point.slice();
        this.view_frustum = [0, 0, this.scene.bounds[2], this.scene.bounds[3]];
        this.on("CHANGE", function(prop) {
          var _ref;
          if (prop == null) {
            return;
          }
          if ((_ref = prop[0]) === "w2" || _ref === "w" || _ref === "h2" || _ref === "h") {
            return this.clipViewport();
          }
        });
        this.scene.on("ENTER_FULLSCREEN", function(scale) {
          _this.zoom = scale[0];
          log.debug("zoom factor: " + _this.zoom);
          _this.bounds = [0, 0, _this.w * _this.zoom, _this.h * _this.zoom];
          _this.center_point = [_this.scene.bounds[2] / 2, _this.scene.bounds[3] / 2];
          return log.info(_this.center_point);
        });
        this.scene.on("EXIT_FULLSCREEN", function(scale) {
          _this.zoom = scale[0];
          _this.bounds = [0, 0, _this.w * _this.zoom, _this.h * _this.zoom];
          _this.center_point = [_this.scene.bounds[2] / 2, _this.scene.bounds[3] / 2];
          return _this.trigger("CHANGE");
        });
      }

      Camera.prototype.clipViewport = function() {
        this.cctx.fillStyle = "rgba(0, 0, 0, 255);";
        this.cctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
        this.cctx.translate(this.cx, this.cy);
        this.cctx.clearRect(-this.w2, -this.h2, this.w, this.h);
        return this.cctx.translate(-this.cx, -this.cy);
      };

      Camera.prototype.enableDrag = function() {
        var _this = this;
        this.drag_started = Hal.on("DRAG_STARTED", function(pos) {
          if (_this.scene.paused) {
            return;
          }
          _this.dragging = true;
          _this.start_drag_point = pos.slice();
          return _this.prev_pos = [_this.x, _this.y];
        });
        this.drag_ended = Hal.on("DRAG_ENDED", function(pos) {
          return _this.dragging = false;
        });
        return this.drag = Hal.on("MOUSE_MOVE", function(pos) {
          if (_this.scene.paused) {
            return;
          }
          if (_this.dragging) {
            _this.x = _this.prev_pos[0] + (pos[0] - _this.start_drag_point[0]);
            _this.y = _this.prev_pos[1] + (pos[1] - _this.start_drag_point[1]);
            return _this.trigger("CHANGE", _this.pos);
          }
        });
      };

      Camera.prototype.isVisible = function(ent) {
        return Hal.m.rectIntersectsRect([ent.pos[0] * this.zoom + this.x, ent.pos[1] * this.zoom + this.y, ent.bounds[2], ent.bounds[3]], this.bounds);
      };

      Camera.prototype.enableZoom = function() {
        var _this = this;
        return this.zoom_trig = Hal.on("SCROLL", function(ev) {
          if (_this.scene.paused) {
            return;
          }
          if (_this.scene.paused) {
            return;
          }
          if (ev.down) {
            _this.zoom -= _this.zoom_step;
          } else {
            _this.zoom += _this.zoom_step;
          }
          return _this.trigger("CHANGE", _this.pos);
        });
      };

      Camera.prototype.setViewFrustum = function(bnds) {
        this.view_frustum[0] = -bnds[0];
        this.view_frustum[1] = -bnds[1];
        this.view_frustum[2] = -bnds[2];
        this.view_frustum[3] = -bnds[3];
        log.debug("Camera view frustum setted");
        return log.debug(this.view_frustum);
      };

      Camera.prototype.enableArrowKeys = function() {};

      Camera.prototype.disableArrowKeys = function() {
        return Hal.removeTrigger("KEY_DOWN", this.arrkeys);
      };

      Camera.prototype.enableLerp = function() {
        return this.lerpTo = function(pos) {};
      };

      Camera.prototype.lerpTo = function() {};

      Camera.prototype.disableLerp = function() {
        return this.lerpTo = function() {};
      };

      Camera.prototype.disableZoom = function() {
        return Hal.removeTrigger("SCROLL", this.zoom_trig);
      };

      Camera.prototype.disableDrag = function() {
        Hal.removeTrigger("DRAG_STARTED", this.drag_started);
        Hal.removeTrigger("DRAG_ENDED", this.drag_ended);
        return Hal.removeTrigger("MOUSE_MOVE", this.drag);
      };

      return Camera;

    })(HalalEntity);
    return Camera;
  });

}).call(this);
