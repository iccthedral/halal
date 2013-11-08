(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["EventDispatcher", "Scene", "DOMManager", "Renderer", "MathUtil", "Vec2"], function(EventDispatcher, Scene, DOMManager, Renderer, MathUtil, Vec2) {
    /*
        A shim (sort of) to support RAF execution
    */

    var Halal, cur_fps_time, cur_time, delta, fps, fps_cap, fps_counter, fps_trigger_time, fstep, last_frame_id, prev_time, rafLoop;
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
        return window.setTimeout(callback, 1);
      };
    })();
    /*
        A shim to support timer. 
        performance.now is an ultra-precise timer and is preferred over Date.now
    */

    if (window.performance == null) {
      window.performance = Date;
    }
    cur_time = performance.now();
    delta = 0;
    fps_trigger_time = 1;
    cur_fps_time = 0;
    fps_counter = 0;
    fps = 0;
    last_frame_id = 0;
    prev_time = 0;
    fps_cap = 30;
    fstep = 1 / fps_cap;
    rafLoop = function() {
      prev_time = cur_time;
      cur_time = performance.now();
      delta = cur_time - prev_time;
      delta = Math.min(delta * 0.001, fstep);
      cur_fps_time += delta;
      Hal.trigger("ENTER_FRAME", delta);
      if (Hal.debug_mode) {
        Hal.drawInfo();
      }
      if (cur_fps_time >= fps_trigger_time) {
        fps = fps_counter;
        cur_fps_time = 0;
        fps_counter = 0;
        Hal.trigger("FPS_UPDATE", fps);
      }
      Hal.trigger("EXIT_FRAME");
      last_frame_id = requestAnimFrame(rafLoop);
      return fps_counter++;
    };
    Halal = (function(_super) {
      __extends(Halal, _super);

      function Halal() {
        Halal.__super__.constructor.call(this);
        this.dom = new DOMManager(this);
        this.math = MathUtil;
        this.id = 0;
        this.paused = true;
        this.debug_mode = false;
        this.pressed_keys = [];
        this.scenes = [];
        log.debug("Engine constructed");
      }

      return Halal;

    })(EventDispatcher);
    Halal.prototype.addScene = function(scene) {
      if (!(scene instanceof Scene)) {
        log.error("Not a Scene instance");
        return null;
      }
      if (!scene.bounds) {
        log.error("Bounds not set on scene " + scene.name);
        return null;
      }
      if (!scene.name) {
        log.warn("Name for scene wasn't provided");
        scene.name = "#scene" + "_" + scene.id;
      }
      scene.init();
      Hal.trigger("SCENE_ADDED_" + scene.name.toUpperCase(), scene);
      this.scenes.unshift(scene);
      log.debug("Added scene: " + scene.name);
      return scene;
    };
    Halal.prototype.viewportBounds = function() {
      return [0, 0, this.dom.area.width, this.dom.area.height];
    };
    Halal.prototype.supports = function(feature) {
      return this.trigger("SUPPORTS_" + feature);
    };
    Halal.prototype.init = function() {
      this.glass = new Renderer(this.viewportBounds(), null, 11);
      return log.debug("Engine initialized");
    };
    Halal.prototype.start = function() {
      this.init();
      this.paused = false;
      this.trigger("ENGINE_STARTED");
      log.debug("Engine started");
      return rafLoop();
    };
    Halal.prototype.ID = function() {
      return ++this.id;
    };
    Halal.prototype.drawInfo = function() {
      return this.glass.ctx.fillText("FPS: " + fps, 0, 10);
    };
    Halal.prototype.speedLerp = function(t, obj, property, from, to) {
      var $, accul, speed;
      t *= 0.001;
      accul = 0;
      speed = (to - from) / t;
      Hal.on("ENTER_FRAME", $ = function(delta) {
        accul += delta;
        from += speed * delta;
        obj.attr(property, from);
        accul = Math.min(accul, t);
        if (t === accul) {
          Hal.remove("ENTER_FRAME", $);
          obj.attr(property, from);
        }
      });
    };
    Halal.prototype.fadeInViewport = function(t) {
      return this.speedLerp(t, Hal.dom.viewport.style, "opacity", 0, 1);
    };
    Halal.prototype.fadeOutViewport = function(t) {
      return this.speedLerp(t, Hal.dom.viewport.style, "opacity", 1, 0);
    };
    Halal.Keys = {
      SHIFT: 16,
      G: 71,
      D: 68,
      W: 87,
      C: 67,
      I: 73,
      ONE: 49,
      TWO: 50,
      THREE: 51,
      FOUR: 52,
      DELETE: 46,
      LEFT: 37,
      RIGHT: 39,
      UP: 38,
      DOWN: 40,
      F: 70
    };
    /*
        @todo kontekst bi valjalo prosledjivati, mozda window ne bude window
        i undefined ne bude undefined
    */

    window.Hal = new Halal();
    return window.Hal;
  });

}).call(this);
