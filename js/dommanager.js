(function() {
  "use strict";
  var __slice = [].slice;

  define([], function() {
    var DOMManager;
    DOMManager = (function() {
      function DOMManager(Hal) {
        var _this = this;
        this.renderspace = document.getElementById("renderspace");
        this.hud = document.getElementById("hud");
        this.viewport = document.getElementById("viewport");
        this.area = renderspace.getBoundingClientRect();
        this.default_zindex = 1000;
        this.canvases = {};
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
        Hal.on("DOM_ADD", function() {
          var args, callb;
          callb = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (callb != null) {
            return callb.apply({}, [_this.hud].concat(args));
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
    DOMManager.prototype.createCanvas = function(width, height, z, transp) {
      var canvas, ind;
      if (width == null) {
        width = this.area.width;
      }
      if (height == null) {
        height = this.area.height;
      }
      ind = this.default_zindex + z;
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      if (!transp) {
        canvas.style["background"] = "white";
      } else {
        canvas.style["background-color"] = "transparent";
        canvas.style["background"] = "transparent";
        console.log("it shall be transparent " + ind);
      }
      canvas.style["z-index"] = ind;
      return canvas;
    };
    DOMManager.prototype.createCanvasLayer = function(width, height, z, transp) {
      var canvas, ind;
      if (width == null) {
        width = this.area.width;
      }
      if (height == null) {
        height = this.area.height;
      }
      ind = this.default_zindex + z;
      if (this.canvases[ind]) {
        return this.canvases[ind];
      }
      canvas = this.createCanvas(width, height, z, transp);
      return canvas;
    };
    DOMManager.prototype.addCanvas = function(canvas, x, y) {
      var z;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      z = canvas.style["z-index"];
      canvas.style["left"] = "" + x + "px";
      canvas.style["top"] = "" + y + "px";
      if (this.canvases[z]) {
        llogw("Canvas with z-index of " + z + " already exists");
        return;
      }
      this.canvases[z] = canvas;
      this.viewport.appendChild(canvas);
      return canvas;
    };
    DOMManager.prototype.removeCanvasLayer = function(z) {
      var ind;
      ind = this.default_zindex + (+z);
      llogi("Removing canvas layer at z-index: " + ind + " / " + z);
      this.viewport.removeChild(this.canvases[ind]);
      return delete this.canvases[ind];
    };
    return DOMManager;
  });

}).call(this);
