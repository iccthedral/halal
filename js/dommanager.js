(function() {
  "use strict";
  define([], function() {
    var DOMManager;
    DOMManager = (function() {
      function DOMManager(Hal) {
        var _this = this;
        this.renderspace = document.getElementById("renderspace");
        this.hud = document.getElementById("hud");
        this.viewport = document.getElementById("viewport");
        this.area = renderspace.getBoundingClientRect();
        this.current_zindex = 1000;
        this.canvases = [];
        this.in_fullscreen = false;
        this.screen_w = window.screen.availWidth;
        this.screen_h = window.screen.availHeight;
        this.fullscreen_scale = [1.0, 1.0];
        Hal.on("SUPPORTS_FULLSCREEN", function() {
          return document.body.mozRequestFullScreen || document.body.webkitRequestFullScreen || document.body.requestFullScreen;
        });
        Hal.on("FULLSCREEN_CHANGE", function(in_fullscreen) {
          var c, _, _ref, _ref1;
          if (in_fullscreen) {
            Hal.r.resize(_this.screen_w / _this.fullscreen_scale[0], _this.screen_h / _this.fullscreen_scale[1]);
            _ref = _this.canvases;
            for (_ in _ref) {
              c = _ref[_];
              c.setAttribute("style", (c.getAttribute("style") || "") + " " + "-webkit-transform: scale3d(" + _this.fullscreen_scale[0] + "," + _this.fullscreen_scale[1] + ", 1.0); -webkit-transform-origin: 0 0 0;");
            }
            return _this.area = _this.renderspace.getBoundingClientRect();
          } else {
            _this.renderspace.style["width"] = "" + Hal.r.prev_bounds[2] + "px";
            _this.renderspace.style["height"] = "" + Hal.r.prev_bounds[3] + "px";
            Hal.r.resize(Hal.r.prev_bounds[2], Hal.r.prev_bounds[3]);
            _ref1 = _this.canvases;
            for (_ in _ref1) {
              c = _ref1[_];
              c.setAttribute("style", (c.getAttribute("style") || "") + " " + "-webkit-transform: scale3d(1.0, 1.0, 1.0); -webkit-transform-origin: 0 0 0;");
            }
            return _this.area = _this.renderspace.getBoundingClientRect();
          }
        });
        Hal.on("DOM_ADD", function(callb) {
          if (callb != null) {
            return callb.call({}, _this.hud);
          }
        });
        Hal.on("REQUEST_FULLSCREEN", function(scene) {
          if (!Hal.supports("FULLSCREEN")) {
            log.warn("Fullscreen not supported");
            return;
          }
          if (!_this.in_fullscreen) {
            _this.renderspace.style["width"] = "" + _this.screen_w + " + px";
            _this.renderspace.style["height"] = "" + _this.screen_h + " + px";
            return _this.renderspace.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
          }
        });
        window.addEventListener("resize", function() {
          _this.area = _this.renderspace.getBoundingClientRect();
          _this.screen_w = window.screen.availHeight;
          _this.screen_h = window.screen.availHeight;
          return Hal.trigger("RESIZE", _this.area);
        });
        document.addEventListener("fullscreenchange", function() {
          this.in_fullscreen = !this.in_fullscreen;
          return Hal.trigger("FULLSCREEN_CHANGE", this.in_fullscreen);
        });
        document.addEventListener("webkitfullscreenchange", function() {
          this.in_fullscreen = !this.in_fullscreen;
          return Hal.trigger("FULLSCREEN_CHANGE", this.in_fullscreen);
        });
        document.addEventListener("mozfullscreenchange", function() {
          this.in_fullscreen = !this.in_fullscreen;
          return Hal.trigger("FULLSCREEN_CHANGE", this.in_fullscreen);
        });
      }

      return DOMManager;

    })();
    DOMManager.prototype.createCanvas = function(width, height) {
      var canvas;
      if (width == null) {
        width = this.area.width;
      }
      if (height == null) {
        height = this.area.height;
      }
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    };
    DOMManager.prototype.createCanvasLayer = function(width, height, z) {
      var canvas, ind;
      if (width == null) {
        width = this.area.width;
      }
      if (height == null) {
        height = this.area.height;
      }
      ind = this.current_zindex + z;
      if (this.canvases[ind]) {
        return this.canvases[ind];
      }
      canvas = this.createCanvas(width, height);
      canvas.style["z-index"] = ind;
      return canvas;
    };
    DOMManager.prototype.addCanvas = function(canvas, x, y, isTransp) {
      var z;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      z = canvas.style["z-index"];
      if (this.canvases[z]) {
        llogw("Canvas with z-index of " + z + " already exists");
        return;
      }
      canvas.style.left = "" + x + "px";
      canvas.style.top = "" + y + "px";
      if (!isTransp) {
        canvas.style["background-color"] = "white";
      }
      this.viewport.appendChild(canvas);
      return this.canvases[z] = canvas;
    };
    return DOMManager;
  });

}).call(this);