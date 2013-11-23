(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["Vec2", "HalalEntity", "Renderer"], function(Vec2, HalalEntity, Renderer) {
    var Camera;
    Camera = (function(_super) {
      __extends(Camera, _super);

      function Camera(ctx, cam_bounds, scene) {
        var camera_canvas,
          _this = this;
        this.ctx = ctx;
        this.scene = scene;
        Camera.__super__.constructor.call(this);
        this.x = cam_bounds[0];
        this.y = cam_bounds[1];
        this.w = this.scene.bounds[2];
        this.h = this.scene.bounds[3];
        this.dragging = false;
        this.start_drag_point = [0, 0];
        this.prev_pos = [this.x, this.y];
        this.zoom = 1;
        this.zoom_step = 0.1;
        this.camera_speed = 90;
        this.angle = 0;
        this.view_frustum = [];
        this.recalcCamera();
        this.setViewFrustum(cam_bounds);
        camera_canvas = Hal.dom.createCanvasLayer(this.w, this.h, 50000);
        Hal.dom.addCanvas(camera_canvas, 0, 0, true);
        this.cctx = camera_canvas.getContext("2d");
        this.on("CHANGE", function(prop) {
          var _ref;
          if (prop == null) {
            return;
          }
          if ((_ref = prop[0]) === "w2" || _ref === "w" || _ref === "h2" || _ref === "h") {
            return this.clipViewport();
          }
          /*
              @todo izmeniti da ovo radi samo pri zumu
          */

        });
        this.scene.on(["ENTER_FULLSCREEN", "EXIT_FULLSCREEN"], function(scale) {
          _this.zoom = scale[0];
          _this.recalcCamera();
          return _this.trigger("CHANGE");
        });
      }

      Camera.prototype.recalcCamera = function() {
        this.w *= this.zoom;
        this.h *= this.zoom;
        this.w2 = this.w * 0.5;
        this.h2 = this.h * 0.5;
        this.cx = this.w2;
        return this.cy = this.h2;
      };

      Camera.prototype.resize = function(newW, newH) {
        this.w = newW / this.zoom;
        this.h = newH / this.zoom;
        this.recalcCamera();
        return this.trigger("CHANGE");
      };

      Camera.prototype.clipViewport = function() {
        this.cctx.fillStyle = "rgba(0, 0, 0, 255);";
        this.cctx.fillRect(0, 0, this.w, this.h);
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
          if (_this.lerp_anim) {
            Hal.remove("EXIT_FRAME", _this.lerp_anim);
            _this.lerp_anim = null;
          }
          _this.dragging = true;
          _this.start_drag_point = pos.slice();
          return _this.prev_pos = [_this.x * _this.zoom, _this.y * _this.zoom];
        });
        this.drag_ended = Hal.on("DRAG_ENDED", function(pos) {
          return _this.dragging = false;
        });
        return this.drag = Hal.on("MOUSE_MOVE", function(pos) {
          if (_this.scene.paused) {
            return;
          }
          if (_this.dragging) {
            _this.x = (_this.prev_pos[0] + (pos[0] - _this.start_drag_point[0])) / _this.zoom;
            _this.y = (_this.prev_pos[1] + (pos[1] - _this.start_drag_point[1])) / _this.zoom;
            return _this.trigger("CHANGE", _this.pos);
          }
        });
      };

      Camera.prototype.enableZoom = function() {
        var _this = this;
        return this.zoom_trig = Hal.on("SCROLL", function(ev) {
          if (_this.scene.paused) {
            return;
          }
          if (ev.down) {
            _this.zoom -= _this.zoom_step;
          } else {
            _this.zoom += _this.zoom_step;
          }
          _this.trigger("CHANGE", _this.pos);
          return _this.trigger("ZOOM", _this.zoom);
        });
      };

      Camera.prototype.setViewFrustum = function(bnds) {
        this.view_frustum[0] = bnds[0];
        this.view_frustum[1] = bnds[1];
        this.view_frustum[2] = bnds[2] - bnds[0];
        this.view_frustum[3] = bnds[3] - bnds[1];
        log.debug("Camera view frustum setted");
        return log.debug(this.view_frustum);
      };

      Camera.prototype.enableArrowKeys = function() {
        var _this = this;
        return this.arrkeys = Hal.on("KEY_DOWN", function(ev) {
          if (ev.keyCode === Hal.Keys.LEFT) {
            _this.lerpTo([_this.cx - _this.camera_speed, _this.cy]);
          }
          if (ev.keyCode === Hal.Keys.RIGHT) {
            _this.lerpTo([_this.cx + _this.camera_speed, _this.cy]);
          }
          if (ev.keyCode === Hal.Keys.UP) {
            _this.lerpTo([_this.cx, _this.cy - _this.camera_speed]);
          }
          if (ev.keyCode === Hal.Keys.DOWN) {
            return _this.lerpTo([_this.cx, _this.cy + _this.camera_speed]);
          }
        });
      };

      Camera.prototype.disableArrowKeys = function() {
        return Hal.removeTrigger("KEY_DOWN", this.arrkeys);
      };

      Camera.prototype.enableLerp = function() {
        return this.lerpTo = function(pos) {
          var lx, ly,
            _this = this;
          if (this.scene.paused) {
            return;
          }
          lx = (this.cx - pos[0]) + this.x;
          ly = (this.cy - pos[1]) + this.y;
          if (this.lerp_anim) {
            Hal.remove("EXIT_FRAME", this.lerp_anim);
            this.lerp_anim = null;
          }
          return this.lerp_anim = Hal.on("EXIT_FRAME", function(delta) {
            var out;
            out = Vec2.lerp([], [_this.x, _this.y], [lx, ly], delta * _this.camera_speed);
            _this.x = out[0];
            _this.y = out[1];
            if ((~~Math.abs(_this.x - lx) + ~~Math.abs(-_this.y + ly)) < 2) {
              Hal.remove("EXIT_FRAME", _this.lerp_anim);
              _this.lerp_anim = null;
            }
            return _this.trigger("CHANGE");
          });
        };
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
