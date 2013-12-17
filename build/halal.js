
(function() {
  define('logger',[], function() {
    var Logger;
    Logger = {
      report: {
        info: [],
        error: [],
        debug: [],
        warning: []
      },
      levels: {
        DEBUG: function() {
          window.llogi = function(msg) {
            return console.info.call(console, msg);
          };
          window.lloge = function(msg) {
            return console.error.call(console, msg);
          };
          window.llogd = function(msg) {
            return console.debug.call(console, msg);
          };
          return window.llogw = function(msg) {
            return console.warn.call(console, msg);
          };
        },
        SILENT: function() {
          window.llogi = function(msg) {
            return Logger.log_report("info", msg);
          };
          window.lloge = function(msg) {
            return Logger.log_report("error", msg);
          };
          window.llogd = function(msg) {
            return Logger.log_report("debug", msg);
          };
          return window.llogw = function(msg) {
            return Logger.log_report("warning", msg);
          };
        }
      },
      log_report: function(type, msg) {
        return Logger.report[type].push("Time: " + (new Date().toTimeString()) + ", Line: " + (new Error).lineNumber + ", MSG: " + msg);
      },
      setLevel: function(level) {
        var current_level;
        current_level = level;
        return Logger.levels[level].call();
      }
    };
    Logger.setLevel("DEBUG");
    return (window.llog = Logger);
  });

}).call(this);

(function() {
  "use strict";
  define('eventdispatcher',[], function() {
    var EventDispatcher;
    EventDispatcher = (function() {
      function EventDispatcher() {
        this.listeners = {};
      }

      return EventDispatcher;

    })();
    EventDispatcher.prototype.on = function(type, clb) {
      var ind, t, _i, _len;
      if (type instanceof Array) {
        for (_i = 0, _len = type.length; _i < _len; _i++) {
          t = type[_i];
          if (this.listeners[t] == null) {
            this.listeners[t] = [];
          }
          this.listeners[t].push(clb);
        }
      } else {
        if (this.listeners[type] == null) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(clb);
        ind = this.listeners[type].indexOf(clb);
      }
      return clb;
    };
    EventDispatcher.prototype.removeTrigger = function(type, clb) {
      var ind;
      if (this.listeners[type] != null) {
        ind = this.listeners[type].indexOf(clb);
        if (ind !== -1) {
          if (ind !== -1) {
            this.listeners[type].splice(ind, 1);
          }
        }
        return clb = null;
      }
    };
    EventDispatcher.prototype.removeAllTriggers = function(type) {
      var key, keys, list, _i, _len, _results;
      if (type) {
        return delete this.listeners[type];
      } else {
        keys = Object.keys(this.listeners);
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          _results.push((function() {
            var _j, _len1, _ref, _results1;
            _ref = this.listeners[key];
            _results1 = [];
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              list = _ref[_j];
              _results1.push(this.removeTrigger(key, list));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }
    };
    EventDispatcher.prototype.trigger = function(type, arg1, arg2, arg3) {
      var clb, _i, _len, _ref, _results;
      if (!this.listeners[type]) {
        return;
      }
      _ref = this.listeners[type];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        clb = _ref[_i];
        if (clb != null) {
          _results.push(clb.call(this, arg1, arg2, arg3));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return EventDispatcher;
  });

}).call(this);

(function() {
  "use strict";
  var __slice = [].slice;

  define('deferred',[], function() {
    var Deferred, Promise;
    Promise = (function() {
      function Promise() {
        this.successChain = [];
        this.failChain = [];
      }

      Promise.prototype.then = function(successClb) {
        this.successChain.push(successClb);
        return this;
      };

      Promise.prototype.fail = function(failClb) {
        this.failChain.push(failClb);
        return this;
      };

      return Promise;

    })();
    Deferred = (function() {
      function Deferred(numTriggers) {
        this.prom = new Promise();
      }

      Deferred.prototype.resolve = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return this.traverse_chain("successChain", target, args);
      };

      Deferred.prototype.reject = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return this.traverse_chain("failChain", target, args);
      };

      Deferred.prototype.promise = function() {
        return this.prom;
      };

      Deferred.prototype.traverse_chain = function(chain, target, args) {
        var clb, _i, _len, _ref, _results;
        if (target == null) {
          target = this;
        }
        _ref = this.prom[chain];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          clb = _ref[_i];
          _results.push(clb.apply(target, args));
        }
        return _results;
      };

      return Deferred;

    })();
    return Deferred;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define('halalentity',["eventdispatcher", "deferred"], function(EventDispatcher, Deferred) {
    var HalalEntity, Tweener, _deinit_map, _init_map, _ref;
    Tweener = (function() {
      function Tweener(obj) {
        this.obj = obj;
        this.num_tweens = 0;
        this.to_wait = 0;
        this.tween_chain = [];
        this.animating = false;
        this.clb_ids = [];
        this.done_clb = null;
        this.paused = false;
      }

      Tweener.prototype.tween = function(meta) {
        var clb, index, match, promise, _ref,
          _this = this;
        match = meta.attr.match(/(.*)\[(\d)\]/);
        this.num_tweens++;
        if (this.to_wait <= 0) {
          if ((match != null) && match.length === 3) {
            index = match[2];
            meta.attr = match[1];
          }
        } else {
          this.tween_chain.push(meta);
          return this;
        }
        this.animating = true;
        _ref = Hal.tween(this.obj, meta.attr, meta.duration, meta.from, meta.to, meta.repeat, index), promise = _ref[0], clb = _ref[1];
        this.clb_ids.push(clb);
        promise.then(function(clb) {
          var ind;
          ind = _this.clb_ids.indexOf(clb);
          _this.clb_ids.splice(ind, 1);
          _this.num_tweens--;
          if (_this.to_wait > 0 && _this.num_tweens !== 0 && !_this.paused) {
            _this.to_wait--;
            _this.tween(_this.tween_chain.pop());
            _this.num_tweens--;
          }
          if (_this.num_tweens <= 0 && (_this.done_clb != null) && !_this.paused) {
            _this.done_clb.call(_this.obj);
          }
          if (_this.num_tweens <= 0 && _this.to_wait === 0) {
            return _this.animating = false;
          }
        });
        return this;
      };

      Tweener.prototype.isAnimating = function() {
        return this.animating;
      };

      Tweener.prototype.wait = function(wait_clb, msecs) {
        this.to_wait++;
        return this;
      };

      Tweener.prototype.pause = function() {
        var clb, _i, _len, _ref;
        this.paused = true;
        _ref = this.clb_ids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          clb = _ref[_i];
          Hal.removeTrigger("ENTER_FRAME", clb);
        }
        return this;
      };

      Tweener.prototype.resume = function() {
        var clb, _i, _len, _ref;
        this.paused = false;
        _ref = this.clb_ids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          clb = _ref[_i];
          Hal.on("ENTER_FRAME", clb);
        }
        return this;
      };

      Tweener.prototype.stop = function() {
        var clb, _i, _len, _ref;
        _ref = this.clb_ids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          clb = _ref[_i];
          Hal.removeTrigger("ENTER_FRAME", clb);
        }
        this.clb_ids = [];
        this.num_tweens = 0;
        this.to_wait = 0;
        this.animating = false;
        this.wait_clb = null;
        this.done_clb = null;
        this.tween_chain = [];
        return this;
      };

      Tweener.prototype.done = function(done_clb) {
        this.done_clb = done_clb;
        return this;
      };

      return Tweener;

    })();
    _init_map = {};
    _deinit_map = {};
    HalalEntity = (function(_super) {
      __extends(HalalEntity, _super);

      function HalalEntity() {
        _ref = HalalEntity.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HalalEntity.include = function() {
        var args, key, obj, val, _ref1, _results;
        obj = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        this.prototype["__classex__"] = this.name;
        if (obj.prototype.constructor != null) {
          if (_init_map[this.name] == null) {
            _init_map[this.name] = [];
          }
          _init_map[this.name].push(obj.prototype.constructor);
          if (obj.prototype.destructor != null) {
            if (_deinit_map[this.name] == null) {
              _deinit_map[this.name] = [];
            }
            _deinit_map[this.name][obj.prototype.constructor.name] = obj.prototype.destructor;
          }
        }
        if (!obj.prototype) {
          throw "include(obj) requires obj";
        }
        _ref1 = obj.prototype;
        _results = [];
        for (key in _ref1) {
          val = _ref1[key];
          if (key === "constructor" || key === "destructor") {
            continue;
          }
          _results.push(this.prototype[key] = val);
        }
        return _results;
      };

      return HalalEntity;

    })(EventDispatcher);
    HalalEntity.prototype.destructor = function() {
      var destructor, key, _ref1;
      _ref1 = this.destructors;
      for (key in _ref1) {
        destructor = _ref1[key];
        destructor.call(this);
      }
    };
    HalalEntity.prototype.constructor = function() {
      var deinit, init, name, _i, _len, _ref1, _ref2;
      this.destructors = {};
      this.tweener = null;
      HalalEntity.__super__.constructor.call(this);
      if (_init_map[this.__classex__]) {
        _ref1 = _init_map[this.__classex__];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          init = _ref1[_i];
          init.call(this);
        }
      }
      if (_deinit_map[this.__classex__]) {
        _ref2 = _deinit_map[this.__classex__];
        for (name in _ref2) {
          deinit = _ref2[name];
          this.destructors[name] = deinit;
        }
      }
      return this;
    };
    HalalEntity.prototype.init = function() {
      this.tweener = new Tweener(this);
      this.id = Hal.ID();
      this.initListeners();
      return this;
    };
    HalalEntity.prototype.attr = function(key, val, index) {
      if (arguments.length === 1) {
        if (typeof key === "string") {
          return this[key];
        }
        this.extend(key);
      } else if (index != null) {
        this[key][index] = val;
      } else {
        this[key] = val;
      }
      this.trigger("CHANGE", key, val);
      return this;
    };
    HalalEntity.prototype.extend = function(obj, proto) {
      var key, val;
      if (obj == null) {
        return this;
      }
      for (key in obj) {
        val = obj[key];
        if (this === val) {
          continue;
        }
        if (typeof val === "function" && proto) {
          this.prototype[key] = val;
        } else {
          this[key] = val;
        }
      }
      return this;
    };
    HalalEntity.prototype.destroy = function() {
      this.tweener.stop();
      this.destroyListeners();
      return this.destructor();
    };
    HalalEntity.prototype.initListeners = function() {};
    HalalEntity.prototype.destroyListeners = function() {
      this.removeAllTriggers();
    };
    HalalEntity.prototype.tween = function(meta) {
      this.tweener.stop();
      this.tweener.tween(meta);
      return this.tweener;
    };
    return HalalEntity;
  });

}).call(this);

(function() {
  "use strict";
  define('renderer',[], function() {
    var Renderer;
    Renderer = (function() {
      function Renderer(bounds, canvas, top_z, transp) {
        this.bounds = bounds;
        this.top_z = top_z;
        if (transp == null) {
          transp = false;
        }
        this.canvases = {};
        this.contexts = [];
        this.canvases[this.top_z] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], this.top_z, transp);
        Hal.dom.addCanvas(this.canvases[this.top_z], this.bounds[0], this.bounds[1]);
        this.ctx = this.canvases[this.top_z].getContext("2d");
      }

      return Renderer;

    })();
    Renderer.prototype.resize = function(w, h) {
      var canvas, k, _ref, _results;
      _ref = this.canvases;
      _results = [];
      for (k in _ref) {
        canvas = _ref[k];
        canvas.width = w;
        canvas.height = h;
        this.prev_bnds = this.bounds.slice();
        this.bounds[2] = w;
        _results.push(this.bounds[3] = h);
      }
      return _results;
    };
    Renderer.prototype.getLayerContext = function(z) {
      var layer;
      layer = this.canvases[this.top_z + z];
      if (layer != null) {
        return layer.getContext("2d");
      }
    };
    Renderer.prototype.createLayers = function(z_indices) {
      var layer, z, _i, _len;
      for (_i = 0, _len = z_indices.length; _i < _len; _i++) {
        z = z_indices[_i];
        layer = this.top_z + z;
        console.log("layer: " + layer);
        this.canvases[layer] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], layer, true);
        Hal.dom.addCanvas(this.canvases[layer], this.bounds[0], this.bounds[1]);
        this.contexts.push(this.getLayerContext(layer));
      }
      console.debug(this.sortLayers());
      return this.contexts;
    };
    Renderer.prototype.sortLayers = function() {
      var sc, z, _ref, _results;
      return this.contexts = this.contexts.sort(function(a, b) {
        var diff;
        diff = (+a.canvas.style["z-index"]) - (+b.canvas.style["z-index"]);
        return console.debug("diff: " + diff);
      });
      this.destroy();
      _ref = this.contexts;
      _results = [];
      for (z in _ref) {
        sc = _ref[z];
        z = c.canvas.style["z-index"];
        this.canvases[z] = c.canvas;
        _results.push(Hal.dom.addCanvas(z));
      }
      return _results;
    };
    Renderer.prototype.removeLayer = function(z) {
      return Hal.dom.removeCanvasLayer(z);
    };
    Renderer.prototype.destroy = function() {
      var canvas, z, _ref, _results;
      llogi("Destroying all canvases under renderer at " + this.top_z + ": ");
      _ref = this.canvases;
      _results = [];
      for (z in _ref) {
        canvas = _ref[z];
        _results.push(this.removeLayer(z));
      }
      return _results;
    };
    return Renderer;
  });

}).call(this);

(function() {
  "use strict";
  define('mathutil',[],function() {
    var MathUtil;
    MathUtil = {
      ARRAY_TYPE: typeof Float32Array !== 'undefined' ? Float32Array : Array,
      TAU: Math.PI * 2,
      EPSILON: 0.000001,
      DEGREE: Math.PI / 180,
      RADIAN: 180 / Math.PI
    };
    MathUtil.clamp = function(val, min, max) {
      if (val < min) {
        val = min;
      } else if (val > max) {
        val = max;
      }
      return val;
    };
    return MathUtil;
  });

}).call(this);

(function() {
  "use strict";
  define('vec2',["mathutil"], function(MathUtil) {
    var FreeList, Vec2, i, v;
    Vec2 = {};
    FreeList = [];
    Vec2.free = 90000;
    Vec2.max = 90000;
    i = 0;
    while (i < Vec2.max) {
      v = new MathUtil.ARRAY_TYPE(2);
      v[0] = 0;
      v[1] = 0;
      FreeList.push(v);
      i++;
    }
    Vec2.release = function(vec) {
      if (Vec2.free > Vec2.max) {
        lloge("you released a vector which you didn't acquired");
        return;
      }
      Vec2.free++;
      Vec2.set(vec, 0, 0);
      return FreeList.push(vec);
    };
    Vec2.acquire = function() {
      if (Vec2.free <= 0) {
        lloge("no more vectors in pool");
        return;
      }
      Vec2.free--;
      return FreeList.pop();
    };
    Vec2.create = function() {
      return Vec2.acquire();
    };
    Vec2.newFrom = function(a) {
      v = Vec2.acquire();
      v[0] = a[0];
      v[1] = a[1];
      return v;
    };
    Vec2.clone = function(a) {
      v = Vec2.acquire();
      v[0] = a[0];
      v[1] = a[1];
      return v;
    };
    Vec2.copy = function(out, a) {
      out[0] = a[0];
      out[1] = a[1];
      return out;
    };
    Vec2.from = function(x, y) {
      v = Vec2.acquire();
      v[0] = x;
      v[1] = y;
      return v;
    };
    Vec2.set = function(out, x, y) {
      out[0] = x;
      out[1] = y;
      return out;
    };
    Vec2.add = function(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      return out;
    };
    Vec2.sub = function(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      return out;
    };
    Vec2.mul = function(out, a, b) {
      out[0] = a[0] * b[0];
      out[1] = a[1] * b[1];
      return out;
    };
    Vec2.divide = function(out, a, b) {
      out[0] = a[0] / b[0];
      out[1] = a[1] / b[1];
      return out;
    };
    Vec2.min = function(out, a, b) {
      out[0] = Math.min(a[0], b[0]);
      out[1] = Math.min(a[1], b[1]);
      return out;
    };
    Vec2.max = function(out, a, b) {
      out[0] = Math.max(a[0], b[0]);
      out[1] = Math.max(a[1], b[1]);
      return out;
    };
    Vec2.scale = function(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      return out;
    };
    Vec2.scaleAndAdd = function(out, a, b, scale) {
      out[0] = a[0] + (b[0] * scale);
      out[1] = a[1] + (b[1] * scale);
      return out;
    };
    Vec2.addAndScale = function(out, a, b, scale) {
      out[0] = (a[0] + b[0]) * scale;
      out[1] = (a[1] + b[1]) * scale;
      return out;
    };
    Vec2.distance = function(a, b) {
      var x, y;
      x = b[0] - a[0];
      y = b[1] - a[1];
      return Math.sqrt(x * x + y * y);
    };
    Vec2.sqDistance = function(a, b) {
      var x, y;
      x = b[0] - a[0];
      y = b[1] - a[1];
      return x * x + y * y;
    };
    Vec2.length = function(a) {
      var x, y;
      x = a[0], y = a[1];
      return Math.sqrt(x * x + y * y);
    };
    Vec2.sqLength = function(a) {
      var x, y;
      x = a[0], y = a[1];
      return x * x + y * y;
    };
    Vec2.negate = function(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      return out;
    };
    Vec2.normalize = function(out, a) {
      var len, x, y;
      x = a[0], y = a[1];
      len = x * x + y * y;
      if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
      }
      return out;
    };
    Vec2.dot = function(a, b) {
      return a[0] * b[0] + a[1] * b[1];
    };
    Vec2.lerp = function(out, a, b, t) {
      var ax, ay;
      ax = a[0], ay = a[1];
      out[0] = ax + t * (b[0] - ax);
      out[1] = ay + t * (b[1] - ay);
      return out;
    };
    Vec2.random = function(out, scale) {
      var r;
      if (scale == null) {
        scale = 1;
      }
      r = Math.random() * 2.0 * Math.PI;
      out[0] = Math.cos(r) * scale;
      out[1] = Math.sin(r) * scale;
      return out;
    };
    Vec2.transformMat3 = function(out, a, m) {
      out[0] = m[0] * a[0] + m[1] * a[1] + m[2];
      out[1] = m[3] * a[0] + m[4] * a[1] + m[5];
      return out;
    };
    Vec2.perpendicular = function(out, a) {
      out[0] = a[1];
      out[1] = -a[0];
      return out;
    };
    Vec2.str = function(a) {
      return "vec2(" + (a[0].toFixed(2)) + ", " + (a[1].toFixed(2)) + ")";
    };
    return Vec2;
  });

}).call(this);

(function() {
  "use strict";
  define('matrix3',["mathutil"], function(MathUtil) {
    var Matrix3;
    Matrix3 = {};
    Matrix3.create = function() {
      var out;
      out = new MathUtil.ARRAY_TYPE(9);
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 1;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.inverse = function(out, a) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b01, b11, b21, det;
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a10 = a[3];
      a11 = a[4];
      a12 = a[5];
      a20 = a[6];
      a21 = a[7];
      a22 = a[8];
      b01 = a22 * a11 - a12 * a21;
      b11 = -a22 * a10 + a12 * a20;
      b21 = a21 * a10 - a11 * a20;
      det = a00 * b01 + a01 * b11 + a02 * b21;
      if (!det) {
        return null;
      }
      det = 1.0 / det;
      out[0] = b01 * det;
      out[1] = (-a22 * a01 + a02 * a21) * det;
      out[2] = (a12 * a01 - a02 * a11) * det;
      out[3] = b11 * det;
      out[4] = (a22 * a00 - a02 * a20) * det;
      out[5] = (-a12 * a00 + a02 * a10) * det;
      out[6] = b21 * det;
      out[7] = (-a21 * a00 + a01 * a20) * det;
      out[8] = (a11 * a00 - a01 * a10) * det;
      return out;
    };
    Matrix3.translate = function(x, y) {
      var out;
      out = new MathUtil.ARRAY_TYPE(9);
      out[0] = 1;
      out[1] = 0;
      out[2] = x;
      out[3] = 0;
      out[4] = 1;
      out[5] = y;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.scale = function(out, scaleX, scaleY) {
      if (scaleX == null) {
        scaleX = 1;
      }
      if (scaleY == null) {
        scaleY = 1;
      }
      out[0] = scaleX;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = scaleY;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.rotate = function(angle) {
      var out;
      out = new MathUtil.ARRAY_TYPE(9);
      out[0] = Math.cos(angle);
      out[1] = -Math.sin(angle);
      out[2] = 0;
      out[3] = Math.sin(angle);
      out[4] = Math.cos(angle);
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.transpose = function(out, a) {
      var a01, a02, a12;
      if (out === a) {
        a01 = a[1];
        a02 = a[2];
        a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
      } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
      }
      return out;
    };
    Matrix3.clone = function(a) {
      var out;
      out = new MathUtil.ARRAY_TYPE(9);
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[8] = a[8];
      return out;
    };
    Matrix3.copy = function(a) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[8] = a[8];
      return out;
    };
    Matrix3.identity = function(out) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 1;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.mul = function(out, a, b) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b00, b01, b02, b10, b11, b12, b20, b21, b22;
      out = [];
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a10 = a[3];
      a11 = a[4];
      a12 = a[5];
      a20 = a[6];
      a21 = a[7];
      a22 = a[8];
      b00 = b[0];
      b01 = b[1];
      b02 = b[2];
      b10 = b[3];
      b11 = b[4];
      b12 = b[5];
      b20 = b[6];
      b21 = b[7];
      b22 = b[8];
      out[0] = b00 * a00 + b01 * a10 + b02 * a20;
      out[1] = b00 * a01 + b01 * a11 + b02 * a21;
      out[2] = b00 * a02 + b01 * a12 + b02 * a22;
      out[3] = b10 * a00 + b11 * a10 + b12 * a20;
      out[4] = b10 * a01 + b11 * a11 + b12 * a21;
      out[5] = b10 * a02 + b11 * a12 + b12 * a22;
      out[6] = b20 * a00 + b21 * a10 + b22 * a20;
      out[7] = b20 * a01 + b21 * a11 + b22 * a21;
      out[8] = b20 * a02 + b21 * a12 + b22 * a22;
      return out;
    };
    return Matrix3;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('camera',["vec2", "halalentity", "renderer", "matrix3"], function(Vec2, HalalEntity, Renderer, Matrix3) {
    var Camera;
    Camera = (function(_super) {
      __extends(Camera, _super);

      function Camera(ctx, cam_bounds, scene) {
        var _this = this;
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
        this.camera_speed = 1.8;
        this.angle = 0;
        this.view_frustum = [];
        this.recalcCamera();
        this.setViewFrustum(cam_bounds);
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
            _this.viewport = Hal.math.transformRect([_this.x, _this.y, _this.w, _this.h], Matrix3.mul(Matrix3.scale(_this.zoom, _this.zoom), Matrix3.translate(-_this.x, -_this.y)));
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
        llogd("Camera view frustum setted");
        return llogd(this.view_frustum);
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

(function() {
  "use strict";
  define('geometry',["vec2", "matrix3", "mathutil"], function(Vec2, Matrix3, MathUtil) {
    var Geometry;
    Geometry = new Object();
    Geometry.toDegrees = function(radians) {
      return radians * MathUtil.RADIAN;
    };
    Geometry.toRadians = function(degrees) {
      return degrees * MathUtil.DEGREE;
    };
    /*
        Returns angle of point with respect to the origin (x-axis half-plane)
    */

    Geometry.angleOfPoint = function(p) {
      var atan;
      atan = Math.atan2(-p[1], p[0]);
      if (atan < 0) {
        atan += Math.PI * 2;
      }
      return atan;
    };
    /*
        Returns angle between two lines in radians (x-axis half-plane)
    */

    Geometry.angleOfLines = function(a, b) {
      var a1, b1;
      a1 = Vec2.acquire();
      b1 = Vec2.acquire();
      Vec2.normalize(a1, a);
      Vec2.normalize(b1, b);
      return Math.acos(Vec2.dot(a1, b1));
    };
    /*
        Returns a set of points of a regular AA polygon, with the origin at [0, 0]
        numsides: Number of sides
        sidelen: Length of each side
    */

    Geometry.createRegularPolygon = function(numedges, edgelen) {
      var ang, ang_step, out, t, x, y, _i;
      out = [];
      ang_step = MathUtil.TAU / numedges;
      ang = 0;
      for (t = _i = 0; 0 <= numedges ? _i < numedges : _i > numedges; t = 0 <= numedges ? ++_i : --_i) {
        x = edgelen * Math.cos(ang);
        y = edgelen * Math.sin(ang);
        out.push(Vec2.from(x, y));
        ang += ang_step;
      }
      return out;
    };
    Geometry.createStarPolygon = function(base_radius, num_krakova, kraklen) {
      var base, i, len, mid, p, p1, p2;
      base = this.createRegularPolygon(num_krakova, base_radius);
      len = base.length;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      mid = Vec2.acquire();
      i = 0;
      while (i < len) {
        Vec2.copy(p1, base[i]);
        Vec2.copy(p2, base[(i + 1) % len]);
        Vec2.addAndScale(mid, p1, p2, 0.5);
        p = Vec2.acquire();
        Vec2.sub(p, p2, p1);
        Vec2.perpendicular(p1, p);
        Vec2.normalize(p2, p1);
        Vec2.scale(p, p2, kraklen);
        p[0] += mid[0];
        p[1] += mid[1];
        base.push(p);
        ++i;
      }
      Vec2.release(p1);
      Vec2.release(p2);
      Vec2.release(mid);
      return this.polygonSortVertices(base);
    };
    /*
        Returns a set of 4 points, representing AA polygon with respect to the origin
    */

    Geometry.createPolygonFromRectangle = function(w2, h2) {
      return [Vec2.from(-w2, -h2), Vec2.from(w2, -h2), Vec2.from(w2, h2), Vec2.from(-w2, h2)];
    };
    Geometry.isPointInRectangle = function(p, rect) {
      return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3]);
    };
    /*
        Returns true if point pt is in the circle
    */

    Geometry.isPointInCircle = function(pt, circpos, radius) {
      var dist, distX, distY;
      distX = pt[0] - circpos[0] || 0;
      distY = pt[1] - circpos[1] || 0;
      dist = Math.sqrt((distX * distX) + (distY * distY));
      return dist < radius;
    };
    /*
        This one has some strage corner cases, don't use it.
        @deprecated
    */

    Geometry.isPointInPolygonDeprecated = function(p, poly) {
      var e1, e2, hits, i, len, _i;
      e1 = Vec2.acquire();
      Vec2.set(e1, -10000000, p[1] - MathUtil.EPSILON);
      e2 = p;
      hits = 0;
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        if (this.lineIntersectsLine(e1, e2, poly[i], poly[(i + 1) % len])) {
          hits++;
        }
      }
      Vec2.release(e1);
      return (hits % 2) !== 0;
    };
    /*
        Returns true if polygon contains point, otherwise false
        How it works:
            For every polygon edge [v1,v2], check if the point is always on the same half-plane,
            as it winds around.
    */

    Geometry.isPointInPolygon = function(p, poly) {
      var left, len, lr, right, v1, v2, _i;
      v1 = v2 = lr = 0;
      left = right = false;
      len = poly.length;
      v1 = len - 1;
      for (v2 = _i = 0; 0 <= len ? _i < len : _i > len; v2 = 0 <= len ? ++_i : --_i) {
        lr = this.isPointLeftOrRightOfLine(p, poly[v1], poly[v2]);
        if (lr > 0) {
          right = true;
        }
        if (lr < 0) {
          left = true;
        }
        v1 = v2;
      }
      return !(left && right);
    };
    /*
        Returns true if polygon is convex, otherwise false
        Same idea as above
    */

    Geometry.isPolygonConvex = function(poly) {
      var left, len, lr, right, v0, v1, v2, _i;
      v0 = v1 = lr;
      left = right = false;
      len = poly.length;
      if (len <= 3) {
        return true;
      }
      v0 = len - 2;
      v1 = len - 1;
      for (v2 = _i = 0; 0 <= len ? _i < len : _i > len; v2 = 0 <= len ? ++_i : --_i) {
        lr = this.isPointLeftOrRightOfLine(poly[v2], poly[v0], poly[v1]);
        if (lr > 0) {
          right = true;
        }
        if (lr < 0) {
          left = true;
        }
        v0 = v1;
        v1 = v2;
      }
      return !(left && right);
    };
    /* 
        When delta is 0, point p is collinear to [a, b] segment
        When delta is less than 0, it's on the left (assuming ccw ordering)
        Otherwise, it's on the right (assuming ccw ordering)
    */

    Geometry.isPointLeftOrRightOfLine = function(p, a, b) {
      var delta;
      delta = (b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + a[1] * b[0] - a[0] * b[1];
      return delta;
    };
    /*
        @todo Need to revise these rect in rect, etc.
    */

    Geometry.rectangleContainsRectangle = function(rectA, rectB) {
      return rectA[0] >= rectB[0] && rectA[1] >= rectB[1] && (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) && (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3]);
    };
    Geometry.rectangleContainsCircle = function(circpos, radius, rect) {
      return false;
    };
    Geometry.rectangleIntersectsRectangle = function(rectA, rectB) {
      return rectA[0] <= (rectB[0] + rectB[2]) && (rectA[0] + rectA[2]) >= rectB[0] && rectA[1] <= (rectB[1] + rectB[3]) && (rectA[3] + rectA[1]) >= rectB[1];
    };
    Geometry.rectangleIntersectsOrContainsRectangle = function(rectA, rectB) {
      return this.rectangleIntersectsRectangle(rectA, rectB) || this.rectangleContainsRectangle(rectA, rectB) || this.rectangleContainsRectangle(rectB, rectA);
    };
    Geometry.rectangleIntersectsOrContainsCircle = function(rect, circpos, radius) {
      return this.rectangleIntersectsCircle(rect, circpos, radius) || this.isPointInRectangle(circpos, rect);
    };
    Geometry.rectangleIntersectsCircle = function(rect, circpos, radius) {
      return this.lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius);
    };
    Geometry.lineIntersectsLine = function(x1, y1, x2, y2) {
      /*
          Due to numerical instability, epsilon hack is necessarry
      */

      var bott, invbott, r, rtop, s, stop;
      rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1]);
      stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1]);
      bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0]);
      if (bott === 0.0) {
        return false;
      }
      invbott = 1.0 / bott;
      r = rtop * invbott;
      s = stop * invbott;
      return (r > 0.0) && (r < 1.0) && (s > 0.0) && (s < 1.0);
    };
    Geometry.lineIntersectsPolygon = function(a, b, poly) {
      var i, len, _i;
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        if (this.lineIntersectsLine(a, b, poly[i], poly[(i + 1) % len])) {
          return true;
        }
      }
      return false;
    };
    Geometry.lineIntersectsCircle = function(line, circpos, radius) {
      var dist;
      dist = this.perpendicularDistanceToLine(circpos, line[0], line[1]);
      return dist < radius;
    };
    Geometry.polygonPointInHull = function(poly) {
      var len, pmax, point, _i;
      pmax = poly[0];
      len = poly.length;
      for (point = _i = 1; 1 <= len ? _i < len : _i > len; point = 1 <= len ? ++_i : --_i) {
        if (point[0] > pmax[0] || (point[0] === pmax[0] && point[1] > pmax[1])) {
          pmax[0] = point[0];
          pmax[1] = point[1];
        }
      }
      return pmax;
    };
    Geometry.polygonSortVertices = function(poly) {
      var a, i, ind, indices, len, mark, t, val, _i, _j, _k, _len;
      a = new Array();
      t = this.polygonMeanPoint(poly);
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        a[i] = this.angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]]);
      }
      indices = new Array();
      for (i = _j = 0; 0 <= len ? _j < len : _j > len; i = 0 <= len ? ++_j : --_j) {
        val = a[i];
        mark = i;
        while (mark > 0 && val > a[mark - 1]) {
          a[mark] = a[mark - 1];
          indices[mark] = indices[mark - 1];
          mark--;
        }
        a[mark] = val;
        indices[mark] = i;
      }
      for (i = _k = 0, _len = indices.length; _k < _len; i = ++_k) {
        ind = indices[i];
        a[i] = poly[ind];
      }
      Vec2.release(t);
      return a;
    };
    /*
        Returns convex hull of a concave degenerate polygon
    */

    Geometry.polygonConvexHull = function(poly) {
      var a, convex, done, first, i, j, k, last, len, m, next, pmax, point, prev, t, _i, _j, _k, _l;
      len = poly.length;
      if (len <= 3) {
        return poly;
      }
      t = this.polygonMeanPoint(poly);
      a = new Array();
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        a[i] = this.angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]]);
      }
      k = 0;
      pmax = poly[0];
      for (i = _j = 1; 1 <= len ? _j < len : _j > len; i = 1 <= len ? ++_j : --_j) {
        point = poly[i];
        if (point[0] > pmax[0] || point[0] === pmax[0] && point[1] > pmax[1]) {
          pmax = point;
          k = i;
        }
      }
      prev = new Array();
      next = new Array();
      first = last = j = 0;
      for (i = _k = 1; 1 <= len ? _k < len : _k > len; i = 1 <= len ? ++_k : --_k) {
        if (a[i] <= a[first]) {
          next[i] = first;
          prev[first] = i;
          first = i;
        } else if (a[i] >= a[last]) {
          prev[i] = last;
          next[last] = i;
          last = i;
        } else {
          j = first;
          while (a[j] < a[i]) {
            j = next[j];
          }
          next[i] = j;
          prev[i] = prev[j];
          next[prev[j]] = i;
          prev[j] = i;
        }
      }
      prev[first] = last;
      next[last] = first;
      m = len;
      done = false;
      i = k;
      while (true) {
        if (this.isPointLeftOrRightOfLine(poly[next[next[i]]], poly[i], poly[next[i]]) >= 0) {
          m--;
          j = next[next[i]];
          next[i] = j;
          prev[j] = i;
          i = prev[i];
        } else {
          i = next[i];
        }
        if (next[next[i]] === k) {
          done = true;
        }
        if (!(!done || (next[i] !== k))) {
          break;
        }
      }
      convex = [];
      for (i = _l = 0; 0 <= m ? _l < m : _l > m; i = 0 <= m ? ++_l : --_l) {
        convex[i] = poly[k];
        k = next[k];
      }
      Vec2.release(t);
      return convex;
    };
    Geometry.polygonMeanPoint = function(poly) {
      var len, mxy, point, _i, _len;
      mxy = Vec2.from(0.0, 0.0);
      len = poly.length;
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        mxy[0] += point[0];
        mxy[1] += point[1];
      }
      mxy[0] /= len;
      mxy[1] /= len;
      return mxy;
    };
    Geometry.polygonArea = function(poly) {
      /*
          This will come in handy as it signifies the ordering
          of vertices
      */

      var area, i, len, p1, p2, _i;
      len = poly.length;
      area = 0.0;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        p1 = poly[i];
        p2 = poly[(i + 1) % len];
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return area * 0.5;
    };
    /* @THIS_TRANSFORMATION_HAS_SIDE_EFFECTS because it is so fucking expensive*/

    Geometry.transformPolygon = function(poly, matrix) {
      var i, len;
      len = poly.length;
      i = 0;
      while (i < len) {
        Vec2.release(poly[i]);
        poly[i] = this.transformPoint(poly[i][0], poly[i][1], matrix);
        ++i;
      }
      return poly;
    };
    Geometry.transformPoint = function(x, y, matrix) {
      var p1, p2;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      Vec2.set(p1, x, y);
      Vec2.transformMat3(p2, p1, matrix);
      Vec2.release(p1);
      return p2;
    };
    Geometry.transformRectangle = function(rect, matrix) {
      var bottom, i, left, pts, right, top;
      pts = [this.transformPoint(rect[0], rect[1], matrix), this.transformPoint(rect[0], rect[1] + rect[3], matrix), this.transformPoint(rect[0] + rect[2], rect[1], matrix), this.transformPoint(rect[0] + rect[2], rect[1] + rect[3], matrix)];
      left = pts[0][0];
      right = pts[0][0];
      top = pts[0][1];
      bottom = pts[0][1];
      i = 1;
      while (i < 4) {
        if (pts[i][0] < left) {
          left = pts[i][0];
        } else if (pts[i][0] > right) {
          right = pts[i][0];
        }
        if (pts[i][1] < top) {
          top = pts[i][1];
        } else if (pts[i][1] > bottom) {
          bottom = pts[i][1];
        }
        ++i;
      }
      Vec2.release(pts[0]);
      Vec2.release(pts[1]);
      Vec2.release(pts[2]);
      Vec2.release(pts[3]);
      pts[0] = left;
      pts[1] = top;
      pts[2] = right - left;
      pts[3] = bottom - top;
      return pts;
    };
    Geometry.polygonCentroidPoint = function(poly) {
      var area, cxy, fact, i, len, p1, p2, _i;
      cxy = Vec2.from(0, 0);
      len = poly.length;
      area = this.polygonArea(poly) * 6;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        p1 = poly[i];
        p2 = poly[(i + 1) % len];
        fact = p1[0] * p2[1] - p2[0] * p1[1];
        cxy[0] += (p1[0] + p2[0]) * fact;
        cxy[1] += (p1[1] + p2[1]) * fact;
      }
      cxy[0] = cxy[0] / area;
      cxy[1] = cxy[1] / area;
      return cxy;
    };
    Geometry.polygonIntersectsOrContainsPolygon = function(polyA, polyB, inverseB, transformA) {
      var p1, p2, ret;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      p1[0] = 0;
      p1[1] = 0;
      ret = false;
      Vec2.transformMat3(p2, p1, transformA);
      Vec2.transformMat3(p1, p2, inverseB);
      ret = this.isPointInPolygonDeprecated(p1, polyA);
      Vec2.release(p1);
      Vec2.release(p2);
      return ret || this.polygonIntersectsPolygon(polyA, polyB, inverseB, transformA);
    };
    /*
        Note however, that this doesn't tell you if one polygon contains other
    */

    Geometry.polygonIntersectsPolygon = function(polyA, polyB, inverseB, transformA) {
      var bott, i, invbott, lenA, lenB, p, p1, pA1, pA2, pB1, pB2, r, ret, rtop, s, stop, _i, _j;
      lenA = polyA.length;
      lenB = polyB.length;
      pA1 = Vec2.acquire();
      pA2 = Vec2.acquire();
      pB1 = Vec2.acquire();
      pB2 = Vec2.acquire();
      ret = false;
      for (i = _i = 0; 0 <= lenA ? _i < lenA : _i > lenA; i = 0 <= lenA ? ++_i : --_i) {
        if (ret) {
          break;
        }
        Vec2.transformMat3(pA1, polyA[i], transformA);
        Vec2.transformMat3(pA2, pA1, inverseB);
        Vec2.transformMat3(pB1, polyA[(i + 1) % lenA], transformA);
        Vec2.transformMat3(pB2, pB1, inverseB);
        for (i = _j = 0; 0 <= lenB ? _j < lenB : _j > lenB; i = 0 <= lenB ? ++_j : --_j) {
          p1 = polyB[(i + 1) % lenB];
          p = polyB[i];
          rtop = (pA2[1] - p[1]) * (p1[0] - p[0]) - (pA2[0] - p[0]) * (p1[1] - p[1]);
          stop = (pA2[1] - p[1]) * (pB2[0] - pA2[0]) - (pA2[0] - p[0]) * (pB2[1] - pA2[1]);
          bott = (pB2[0] - pA2[0]) * (p1[1] - p[1]) - (pB2[1] - pA2[1]) * (p1[0] - p[0]);
          if (bott === 0.0) {
            continue;
          }
          invbott = 1.0 / bott;
          r = rtop * invbott;
          s = stop * invbott;
          if ((ret = (r >= 0.0) && (r <= 1.0) && (s >= 0.0) && (s <= 1.0))) {
            break;
          }
        }
      }
      Vec2.release(pA1);
      Vec2.release(pA2);
      Vec2.release(pB1);
      Vec2.release(pB2);
      return ret;
    };
    Geometry.polygonMinkowskiSum = function(arrA, arrB, sign) {
      var a, b, out, _i, _j, _len, _len1;
      if (sign == null) {
        sign = 1;
      }
      out = [];
      for (_i = 0, _len = arrA.length; _i < _len; _i++) {
        a = arrA[_i];
        for (_j = 0, _len1 = arrB.length; _j < _len1; _j++) {
          b = arrB[_j];
          out.push(Vec2.from(a[0] + sign * b[0], a[1] + sign * b[1]));
        }
      }
      return out;
    };
    Geometry.polygonBottomMostPoint = function(poly) {
      var point, xymax, _i, _len;
      xymax = Vec2.from(Number.MAX_VALUE, Number.MAX_VALUE);
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        if (point[0] < xymax[0]) {
          xymax[0] = point[0];
        }
        if (point[1] < xymax[1]) {
          xymax[1] = point[1];
        }
      }
      return xymax;
    };
    Geometry.polygonTopMostPoint = function(poly) {
      var point, xymax, _i, _len;
      xymax = Vec2.from(Number.MIN_VALUE, Number.MIN_VALUE);
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        if (point[0] > xymax[0]) {
          xymax[0] = point[0];
        }
        if (point[1] > xymax[1]) {
          xymax[1] = point[1];
        }
      }
      return xymax;
    };
    Geometry.projectPointOnLine = function(pt, a, b) {
      var dotProd, lenAC, vecAB, vecAC, vecCProj;
      vecAB = Vec2.sub([], b, a);
      vecAC = Vec2.sub([], pt, a);
      Vec2.normalize(vecAB, vecAB);
      Vec2.normalize(vecAC, vecAC);
      dotProd = Vec2.dot(vecAC, vecAB);
      lenAC = Vec2.distance(a, pt);
      vecCProj = Vec2.scale([], vecAB, dotProd * lenAC);
      vecCProj = Vec2.from(a[0] + vecCProj[0], a[1] + vecCProj[1]);
      return vecCProj;
    };
    Geometry.perpendicularDistanceToLine = function(pt, a, b) {
      var c, dist;
      c = this.projectPointOnLine(pt, a, b);
      dist = Vec2.distance(pt, c);
      Vec2.release(c);
      return dist;
    };
    Geometry.perpendicularDistanceToLineSegment = function(pt, a, b) {
      var c, dist, linelen;
      c = this.projectPointOnLine(pt, a, b);
      linelen = Vec2.distance(a, b);
      if (Vec2.distance(a, c) > linelen || Vec2.distance(b, c) > linelen) {
        return Number.NaN;
      }
      dist = Vec2.distance(pt, c);
      Vec2.release(c);
      return dist;
    };
    Geometry.pointComparison = function(a, b, center) {
      var d1, d2, det;
      if (a[0] >= 0 && b[0] < 0) {
        return true;
      }
      if (a[0] === 0 && b[0] === 0) {
        return a[1] > b[1];
      }
      det = (a[0] - center[0]) * (b[1] - center[1]) - (b[0] - center[0]) * (a[1] - center[1]);
      if (det < 0) {
        return true;
      }
      if (det > 0) {
        return false;
      }
      d1 = (a[0] - center[0]) * (a[0] - center[0]) + (a[1] - center[1]) * (a[1] - center[1]);
      d2 = (b[0] - center[0]) * (b[0] - center[0]) + (b[1] - center[1]) * (b[1] - center[1]);
      return d1 > d2;
    };
    return Geometry;
  });

}).call(this);

(function() {
  "use strict";
  define('quadtree',["vec2", "geometry", "matrix3"], function(Vec2, Geometry, Matrix3) {
    var QuadTree, cache, total;
    total = 0;
    cache = {};
    QuadTree = (function() {
      function QuadTree(bounds, cap, part) {
        this.bounds = bounds;
        if (cap == null) {
          cap = 8;
        }
        this.part = part != null ? part : true;
        this.entities = [];
        this.nw = null;
        this.sw = null;
        this.ne = null;
        this.se = null;
        this.id = Hal.ID();
        this.capacity_ = cap;
      }

      QuadTree.prototype.total = function() {
        return total;
      };

      QuadTree.prototype.insert = function(ent) {
        if (!Geometry.isPointInRectangle(ent.position, this.bounds)) {
          return false;
        }
        if ((this.entities.length < this.capacity_ && !cache[ent.id]) || (!this.part && !cache[ent.id])) {
          this.entities.push(ent);
          cache[ent.id] = this;
          total++;
          return true;
        }
        if (this.part) {
          if (this.nw == null) {
            this.divide();
          }
          if (this.nw.insert(ent)) {
            return true;
          }
          if (this.ne.insert(ent)) {
            return true;
          }
          if (this.sw.insert(ent)) {
            return true;
          }
          if (this.se.insert(ent)) {
            return true;
          }
        }
        return false;
      };

      QuadTree.prototype.remove = function(ent) {
        var ind;
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          return;
        }
        total--;
        delete cache[ent.id];
        return this.entities.splice(ind, 1);
      };

      QuadTree.prototype.removeAll = function() {
        var p, _i, _len, _ref, _results;
        _ref = this.entities.slice();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          _results.push(this.remove(p));
        }
        return _results;
      };

      QuadTree.prototype.findById = function(id) {
        var findRec, out;
        out = null;
        findRec = function(where) {
          if (id === where.id) {
            return out = where;
          } else if (out == null) {
            if ((where.nw != null) && (out == null)) {
              findRec(where.nw);
            }
            if ((where.sw != null) && (out == null)) {
              findRec(where.sw);
            }
            if ((where.ne != null) && (out == null)) {
              findRec(where.ne);
            }
            if ((where.se != null) && (out == null)) {
              return findRec(where.se);
            }
          }
        };
        findRec(this);
        return out;
      };

      QuadTree.prototype.findUnder = function() {
        var out, recurseTree, root;
        out = [];
        root = this;
        recurseTree = function(root) {
          out = out.concat(root.entities);
          if (root.nw != null) {
            recurseTree(root.nw);
            recurseTree(root.ne);
            recurseTree(root.se);
            return recurseTree(root.sw);
          }
        };
        recurseTree(root);
        return out;
        return entsInRange;
      };

      QuadTree.prototype.findQuadsInRectangle = function(rect, matrix) {
        var quads, transformBnds;
        transformBnds = Geometry.transformRectangle(this.bounds, matrix);
        quads = [];
        if (!Geometry.rectangleIntersectsOrContainsRectangle(rect, transformBnds)) {
          return quads;
        }
        quads = [this];
        if (this.nw == null) {
          return quads;
        }
        quads = quads.concat(this.nw.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.ne.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.sw.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.se.findQuadsInRectangle(rect, matrix));
        return quads;
      };

      QuadTree.prototype.findEntitiesInRectangle = function(range, matrix, out) {
        var p, ret, transformBnds, _i, _len, _ref, _results;
        transformBnds = Geometry.transformRectangle(this.bounds, matrix);
        if (Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)) {
          if (this.nw != null) {
            this.nw.findEntitiesInRectangle(range, matrix, out);
            this.ne.findEntitiesInRectangle(range, matrix, out);
            this.sw.findEntitiesInRectangle(range, matrix, out);
            this.se.findEntitiesInRectangle(range, matrix, out);
          }
          _ref = this.entities;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            ret = Geometry.rectangleIntersectsOrContainsRectangle(Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)), range);
            if (!ret) {
              continue;
            }
            _results.push(out.push(p));
          }
          return _results;
        }
      };

      QuadTree.prototype.divide = function() {
        var h, w;
        w = this.bounds[2] * 0.5;
        h = this.bounds[3] * 0.5;
        this.nw = new QuadTree([this.bounds[0], this.bounds[1], w, h]);
        this.ne = new QuadTree([this.bounds[0] + w, this.bounds[1], w, h]);
        this.sw = new QuadTree([this.bounds[0], this.bounds[1] + h, w, h]);
        return this.se = new QuadTree([this.bounds[0] + w, this.bounds[1] + h, w, h]);
      };

      return QuadTree;

    })();
    QuadTree.fromCache = function(entid) {
      return cache[entid];
    };
    return QuadTree;
  });

}).call(this);

(function() {
  "use strict";
  define('transformable',["vec2", "matrix3"], function(Vec2, Matrix3) {
    var Transformable;
    Transformable = (function() {
      function Transformable() {
        this.origin = Vec2.from(0, 0);
        this.scale = Vec2.from(1, 1);
        this.position = Vec2.from(0, 0);
        this.angle = 0.0;
        this._transform = Matrix3.create();
        this._inverse = Matrix3.create();
        this._update_transform = true;
        this._update_inverse = true;
      }

      return Transformable;

    })();
    Transformable.prototype.destructor = function() {
      Vec2.release(this.origin);
      Vec2.release(this.scale);
      return Vec2.release(this.position);
    };
    Transformable.prototype.setOrigin = function(x, y, move) {
      if (move == null) {
        move = true;
      }
      if (move) {
        this.move(x - this.origin[0], y - this.origin[1]);
      }
      Vec2.set(this.origin, x, y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setPosition = function(x, y) {
      Vec2.set(this.position, x, y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setScale = function(scx, scy) {
      Vec2.set(this.scale, scx, scy);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setRotation = function(angle) {
      this.angle = angle;
      if (this.angle < 0.0) {
        this.angle += Math.PI * 2;
      }
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.rotate = function(angle) {
      this.angle += angle;
      if (this.angle < 0) {
        this.angle += Math.PI * 2;
      }
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.move = function(x, y) {
      Vec2.set(this.position, this.position[0] + x, this.position[1] + y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.transform = function() {
      if (this._update_transform) {
        this._transform[3] = -Math.sin(-this.angle) * this.scale[0];
        this._transform[0] = Math.cos(-this.angle) * this.scale[0];
        this._transform[1] = Math.sin(-this.angle) * this.scale[1];
        this._transform[4] = Math.cos(-this.angle) * this.scale[1];
        this._transform[2] = -this.origin[0] * this._transform[0] - this.origin[1] * this._transform[1] + this.position[0];
        this._transform[5] = -this.origin[0] * this._transform[3] - this.origin[1] * this._transform[4] + this.position[1];
        this._update_transform = false;
      }
      return this._transform;
    };
    Transformable.prototype.calcTransform = function() {
      if (this._update_transform) {
        this._transform[3] = -Math.sin(-this.angle) * this.scale[0];
        this._transform[0] = Math.cos(-this.angle) * this.scale[0];
        this._transform[1] = Math.sin(-this.angle) * this.scale[1];
        this._transform[4] = Math.cos(-this.angle) * this.scale[1];
        this._transform[2] = -this.origin[0] * this._transform[0] - this.origin[1] * this._transform[1] + this.position[0];
        this._transform[5] = this.origin[0] * this._transform[3] - this.origin[1] * this._transform[4] + this.position[1];
        this._update_transform = false;
      }
      return this._transform;
    };
    Transformable.prototype.combineTransform = function(matrix) {
      if (!this._update_transform) {
        return this.transform();
      }
      this.transform();
      this._transform = Matrix3.mul([], this._transform, matrix);
      this._update_transform = false;
      return this._transform;
    };
    Transformable.prototype.inverseTransform = function() {
      if (this._update_inverse) {
        Matrix3.inverse(this._inverse, this._transform);
        this._update_inverse = false;
      }
      return this._inverse;
    };
    return Transformable;
  });

}).call(this);

(function() {
  "use strict";
  define('groupy',["eventdispatcher"], function(EventDispatcher) {
    var Groupy;
    Groupy = (function() {
      function Groupy() {
        this.ent_groups = {};
        this.group = "default";
        this.on("ENTITY_DESTROYED", this.group_ent_destr = function(ent) {
          var group, ind;
          group = this.ent_groups[ent.group];
          if (group != null) {
            ind = group.indexOf(ent);
            return group.splice(ind, 1);
          }
        });
        this.on("ENTITY_ADDED", function(ent) {
          return this.trigger("GROUP_CHANGE", ent);
        });
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

      Groupy.prototype.findGroup = function(group) {
        if (this.ent_groups[group] == null) {
          return [];
        }
        return this.ent_groups[group].slice();
      };

      return Groupy;

    })();
    return Groupy;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('scene',["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2", "geometry", "transformable", "groupy"], function(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2, Geometry, Transformable, Groupy) {
    var Scene, reactives;
    reactives = ["angle", "scale", "position", "origin"];
    Scene = (function(_super) {
      __extends(Scene, _super);

      Scene.include(Transformable);

      Scene.include(Groupy);

      function Scene(meta) {
        if (meta == null) {
          meta = {};
        }
        Scene.__super__.constructor.call(this);
        this.parseMeta(meta);
        this.bounds = Hal.viewportBounds();
        this.world_bounds = Hal.viewportBounds();
        this.entities = [];
        this.ent_cache = {};
        this.z = 0;
        this.renderer = new Renderer(this.bounds, null, this.z, true);
        this.ctx = this.renderer.getLayerContext(this.z);
        this.draw_stat = true;
        this.update_ents = true;
        this.cam_move_vector = Vec2.from(0, 0);
        this.is_camera_panning = false;
        this.camera_panning_point = [0, 0];
        this.zoom_step = 0.05;
        this.camera_speed = 2;
        this._update_zoom = false;
        this.center = Vec2.from(this.bounds[2] * 0.5, this.bounds[3] * 0.5);
        this.view_matrix = Matrix3.create();
        this.camera_moved = false;
        this.view_matrix[2] = this.center[0];
        this.view_matrix[5] = this.center[1];
        this.combineTransform(this.view_matrix);
        this.prev_pos = [this.position[0], this.position[1]];
        this.zoom_limits = [0.1, 2.3];
        this.visible_ents = [];
        return this;
      }

      Scene.prototype.parseMeta = function(meta) {
        this.name = meta.name != null ? meta.name : "" + (Hal.ID());
        this.bg_color = meta.bg_color != null ? meta.bg_color : "white";
        this.draw_stat = meta.draw_stat != null ? meta.draw_stat : true;
        return this.world_bounds = meta.world_bounds != null ? meta.world_bounds : Hal.viewportBounds();
      };

      Scene.prototype.addEntity = function(ent, ctx) {
        if (ctx == null) {
          ctx = this.ctx;
        }
        if (ent == null) {
          lloge("Entity is null");
          return;
        }
        ent.attr("ctx", ctx);
        ent.attr("scene", this);
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
        this.trigger("ENTITY_ADDED", ent);
        this.update_ents = true;
        ent.trigger("ON_SCENE");
        return ent;
      };

      Scene.prototype.addEntityToQuadSpace = function(ent, ctx) {
        if (ctx == null) {
          ctx = this.ctx;
        }
        this.addEntity(ent, ctx);
        this.quadtree.insert(ent);
        ent.trigger("IN_QUADSPACE");
        return ent;
      };

      Scene.prototype.drawStat = function() {
        Hal.glass.ctx.clearRect(0, 0, 400, 300);
        Hal.glass.ctx.fillText("FPS: " + Hal.fps, 0, 10);
        Hal.glass.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        Hal.glass.ctx.fillText("Camera position: " + (this.position[0].toFixed(2)) + ", " + (this.position[1].toFixed(2)), 0, 40);
        Hal.glass.ctx.fillText("Camera origin: " + (this.origin[0].toFixed(2)) + ", " + (this.origin[1].toFixed(2)), 0, 55);
        Hal.glass.ctx.fillText("Num of visible entities: " + this.visible_ents.length, 0, 70);
        Hal.glass.ctx.fillText("Num of free pool vectors: " + Vec2.free, 0, 85);
        Hal.glass.ctx.fillText("View origin: " + (this.view_matrix[2].toFixed(2)) + ", " + (this.view_matrix[5].toFixed(2)), 0, 100);
        return Hal.glass.ctx.fillText("View scale: " + (this.view_matrix[0].toFixed(2)) + ", " + (this.view_matrix[4].toFixed(2)), 0, 115);
      };

      Scene.prototype.getAllEntities = function() {
        return this.entities.slice();
      };

      Scene.prototype.update = function(delta) {
        var en, _i, _len, _ref, _results;
        if (this._update_transform) {
          this.combineTransform(this.view_matrix);
          this.update_ents = true;
        }
        if (this.update_ents) {
          this.visible_ents = [];
          this.quadtree.findEntitiesInRectangle(this.search_range, this._transform, this.visible_ents);
        }
        _ref = this.visible_ents;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          _results.push(en.update(delta));
        }
        return _results;
      };

      Scene.prototype.checkForCollisions = function() {
        var enA, enB, _i, _len, _ref, _results;
        _ref = this.entities;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          enA = _ref[_i];
          _results.push((function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.entities;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              enB = _ref1[_j];
              if (enA === enB) {
                continue;
              }
              if (Geometry.polygonIntersectsOrContainsPolygon(enA._mesh, enB._mesh, enB.inverseTransform(), enA.transform())) {
                _results1.push(enA.trigger("COLLISION_HAPPENED", enB));
              } else {
                _results1.push(void 0);
              }
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      Scene.prototype.draw = function(delta) {
        var en, _i, _len, _ref;
        this.clearRenderers();
        if (this.draw_stat) {
          this.drawStat();
        }
        _ref = this.visible_ents;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          en.draw(delta);
        }
        return this.update_ents = false;
      };

      Scene.prototype.clearRenderers = function() {
        var ctx, _i, _len, _ref;
        _ref = this.renderer.contexts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ctx = _ref[_i];
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, this.bounds[2], this.bounds[3]);
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
        return this.ctx.strokeRect(this.center[0] - 1, this.center[1] - 1, 2, 2);
      };

      Scene.prototype.pause = function() {
        return this.attr("paused", true);
      };

      Scene.prototype.resume = function() {
        return this.attr("paused", false);
      };

      Scene.prototype.removeEntity = function(ent) {
        var ind, _ref;
        if (!this.ent_cache[ent.id]) {
          lloge("No such entity " + ent.id + " in cache");
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          lloge("No such entity " + ent.id + " in entity list");
          return;
        }
        if ((_ref = QuadTree.fromCache(ent.id)) != null) {
          _ref.remove(ent);
        }
        delete this.ent_cache[ent.id];
        this.trigger("ENTITY_DESTROYED", ent);
        this.entities.splice(ind, 1);
        return this.update_ents = true;
      };

      Scene.prototype.removeAllEntities = function(destroy_children) {
        var ent, _i, _len, _ref;
        if (destroy_children == null) {
          destroy_children = false;
        }
        _ref = this.getAllEntities();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ent = _ref[_i];
          this.removeEntity(ent);
        }
      };

      Scene.prototype.removeEntityByID = function(entid) {
        var ent;
        ent = this.ent_cache[entid];
        if (ent != null) {
          return ent.removeEntity(ent);
        } else {
          return llogw("No such entity " + entid + " in entity cache");
        }
      };

      /* valja sve unregistorovati posle*/


      Scene.prototype.init = function() {
        Scene.__super__.init.call(this);
        this.pause();
        this.search_range = this.bounds.slice();
        this.camera_panning_started = null;
        this.camera_panning_started = null;
        this.camera_panning_ended = null;
        this.camera_zoom_listener = null;
        this.camera_lerp_listener = null;
        this.camera_frame_listener = null;
        this.resize_listener = null;
        this.resetQuadTree(this.world_bounds);
        return this.resume();
      };

      Scene.prototype.screenToWorld = function(point) {
        return Geometry.transformPoint(point[0], point[1], this.inverseTransform());
      };

      Scene.prototype.worldToScreen = function(point) {
        return Geometry.transformPoint(point[0], point[1], this.transform());
      };

      Scene.prototype.resetQuadTree = function(bounds) {
        if (this.quadtree != null) {
          this.quadtree.removeAll();
        }
        this.quadtree = new QuadTree(bounds);
        return this.quadtree.divide();
      };

      Scene.prototype.setWorldBounds = function(world_bounds) {
        this.world_bounds = world_bounds;
        this.resetQuadTree(this.world_bounds);
      };

      Scene.prototype.setBounds = function(bounds) {
        this.bounds = bounds;
      };

      Scene.prototype.drawQuadTree = function(quadtree) {
        if (this.paused) {
          return;
        }
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        if (quadtree.nw != null) {
          this.drawQuadTree(quadtree.nw);
          this.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3]);
          this.ctx.fillText("" + quadtree.nw.id, quadtree.nw.bounds[0] + quadtree.nw.bounds[2] * 0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3] * 0.5);
        }
        if (quadtree.ne != null) {
          this.drawQuadTree(quadtree.ne);
          this.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3]);
          this.ctx.fillText("" + quadtree.ne.id, quadtree.ne.bounds[0] + quadtree.ne.bounds[2] * 0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3] * 0.5);
        }
        if (quadtree.sw != null) {
          this.drawQuadTree(quadtree.sw);
          this.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3]);
          this.ctx.fillText("" + quadtree.sw.id, quadtree.sw.bounds[0] + quadtree.sw.bounds[2] * 0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3] * 0.5);
        }
        if (quadtree.se != null) {
          this.drawQuadTree(quadtree.se);
          this.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3]);
          return this.ctx.fillText("" + quadtree.se.id, quadtree.se.bounds[0] + quadtree.se.bounds[2] * 0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3] * 0.5);
        }
      };

      Scene.prototype.disablePanning = function() {
        Hal.removeTrigger("DRAG_STARTED", this.camera_panning_started);
        Hal.removeTrigger("DRAG_ENDED", this.camera_panning_ended);
        return Hal.removeTrigger("MOUSE_MOVE", this.camera_panning_listener);
      };

      Scene.prototype.destroy = function() {
        this.pause();
        Vec2.release(this.center);
        Vec2.release(this.cam_move_vector);
        this.removeAllEntities();
        this.renderer.destroy();
        this.quadtree.removeAll();
        this.quadtree = null;
        this.renderer = null;
        Hal.trigger("SCENE_REQ_DESTROY", this);
        return Scene.__super__.destroy.call(this);
      };

      Scene.prototype.destroyListeners = function() {
        Scene.__super__.destroyListeners.call(this);
        Hal.removeTrigger("SCROLL", this.camera_zoom_listener);
        Hal.removeTrigger("MOUSE_MOVE", this.camera_panning_listener);
        Hal.removeTrigger("DRAG_STARTED", this.camera_panning_started);
        Hal.removeTrigger("DRAG_ENDED", this.camera_panning_ended);
        Hal.removeTrigger("RIGHT_CLICK", this.camera_lerp_listener);
        Hal.removeTrigger("RESIZE", this.resize_listener);
        return Hal.removeTrigger("EXIT_FRAME", this.camera_frame_listener);
      };

      Scene.prototype.initListeners = function() {
        var _this = this;
        Scene.__super__.initListeners.call(this);
        this.on("CHANGE", function(key, val) {
          if (this.paused) {
            return;
          }
          if (__indexOf.call(reactives, key) >= 0) {
            this._update_transform = true;
            return this._update_inverse = true;
          }
        });
        this.on("ENTITY_REQ_DESTROYING", function(entity) {
          return this.removeEntity(entity);
        });
        this.resize_listener = Hal.on("RESIZE", function(area) {
          _this.renderer.resize(area.width, area.height);
          _this.bounds[2] = area.width;
          _this.bounds[3] = area.height;
          _this._update_transform = true;
          return _this._update_inverse = true;
        });
        this.camera_lerp_listener = Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          Vec2.set(_this.cam_move_vector, (_this.center[0] - pos[0]) + _this.position[0], (_this.center[1] - pos[1]) + _this.position[1]);
          if (_this.camera_frame_listener) {
            Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
            _this.camera_frame_listener = null;
            _this._update_transform = true;
            _this._update_inverse = true;
          }
          return _this.camera_frame_listener = Hal.on("EXIT_FRAME", function(delta) {
            Vec2.lerp(_this.position, _this.position, _this.cam_move_vector, delta * 2);
            if ((~~Math.abs(_this.position[0] - _this.cam_move_vector[0]) + ~~Math.abs(-_this.position[1] + _this.cam_move_vector[1])) < 2) {
              Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
              _this.camera_frame_listener = null;
            }
            _this._update_transform = true;
            return _this._update_inverse = true;
          });
        });
        this.camera_panning_started = Hal.on("DRAG_STARTED", function(pos) {
          if (_this.paused) {
            return;
          }
          _this.is_camera_panning = true;
          _this.camera_panning_point[0] = pos[0];
          _this.camera_panning_point[1] = pos[1];
          _this.prev_pos = [_this.position[0], _this.position[1]];
          _this._update_transform = true;
          _this._update_inverse = true;
          if (_this.camera_frame_listener) {
            Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
            return _this.camera_frame_listener = null;
          }
        });
        this.camera_panning_ended = Hal.on("DRAG_ENDED", function(pos) {
          _this.is_camera_panning = false;
          _this._update_transform = true;
          return _this._update_inverse = true;
        });
        this.camera_panning_started = Hal.on("MOUSE_MOVE", function(pos) {
          if (_this.paused) {
            return;
          }
          if (_this.is_camera_panning) {
            _this.position[0] = _this.prev_pos[0] + (pos[0] - _this.camera_panning_point[0]);
            _this.position[1] = _this.prev_pos[1] + (pos[1] - _this.camera_panning_point[1]);
            _this._update_transform = true;
            return _this._update_inverse = true;
          }
        });
        return this.camera_zoom_listener = Hal.on("SCROLL", function(ev) {
          if (_this.paused) {
            return;
          }
          if (ev.down) {
            _this.view_matrix[0] -= _this.zoom_step;
            _this.view_matrix[4] -= _this.zoom_step;
          } else {
            _this.view_matrix[0] += _this.zoom_step;
            _this.view_matrix[4] += _this.zoom_step;
          }
          _this.view_matrix[0] = Hal.math.clamp(_this.view_matrix[0], _this.zoom_limits[0], _this.zoom_limits[1]);
          _this.view_matrix[4] = Hal.math.clamp(_this.view_matrix[4], _this.zoom_limits[0], _this.zoom_limits[1]);
          _this._update_transform = true;
          return _this._update_inverse = true;
        });
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);

(function() {
  "use strict";
  define('dommanager',[], function() {
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
      canvas.style["z-index"] = ind;
      if (!transp) {
        canvas.style["background"] = "white";
      } else {
        canvas.style["background-color"] = "transparent";
        canvas.style["background"] = "transparent";
        console.log("it shall be transparent " + ind);
      }
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
      return canvas = this.createCanvas(width, height, z, transp);
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

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define('deferredcounter',["deferred"], function(Deferred) {
    var DeferredCounter;
    DeferredCounter = (function(_super) {
      __extends(DeferredCounter, _super);

      function DeferredCounter(total_trigs) {
        this.total_trigs = total_trigs;
        this.num_approved = 0;
        this.num_rejected = 0;
        DeferredCounter.__super__.constructor.call(this);
      }

      DeferredCounter.prototype.resolve = function(target, args) {
        if ((this.num_approved + this.num_rejected) === this.total_trigs) {
          return DeferredCounter.__super__.resolve.call(this, target, {
            num_approved: this.num_approved,
            num_rejected: this.num_rejected
          }, args);
        }
      };

      DeferredCounter.prototype.reject = function(target, args) {
        DeferredCounter.__super__.reject.call(this, target, {
          num_approved: this.num_approved,
          num_rejected: this.num_rejected
        }, args);
        if ((this.num_approved + this.num_rejected) === this.total_trigs) {
          return this.resolve(target, args);
        }
      };

      DeferredCounter.prototype.acquire = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        this.num_rejected++;
        return this.reject(target, args);
      };

      DeferredCounter.prototype.release = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        this.num_approved++;
        return this.resolve(target, args);
      };

      return DeferredCounter;

    })(Deferred);
    return DeferredCounter;
  });

}).call(this);

(function() {
  "use strict";
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('domeventmanager',[], function() {
    var DOMEventManager;
    DOMEventManager = (function() {
      function DOMEventManager() {
        this.getMousePos = __bind(this.getMousePos, this);
        this.mouseDown = __bind(this.mouseDown, this);
        this.mouseUp = __bind(this.mouseUp, this);
        this.mouseMove = __bind(this.mouseMove, this);
        this.mouseClick = __bind(this.mouseClick, this);
        this.mouseDblClick = __bind(this.mouseDblClick, this);
        this.keyUp = __bind(this.keyUp, this);
        this.keyDown = __bind(this.keyDown, this);
        this.wheelMoved = __bind(this.wheelMoved, this);
        this.mouse_leftbtn_down = false;
        this.mouse_rightbtn_down = false;
        this.can_drag = true;
        this.pos = [0, 0];
        this.viewport = Hal.dom.renderspace;
        this.hud = Hal.dom.hud;
        this.dragging = false;
        this.under_hud = false;
        /* @todo ovo izbaciti iz engina posle*/

        /* end @todo*/

        this.viewport.addEventListener("mousedown", this.mouseDown);
        this.viewport.addEventListener("mouseup", this.mouseUp);
        this.viewport.addEventListener("mousemove", this.mouseMove);
        this.viewport.addEventListener("onmousewheel", this.wheelMoved);
        this.viewport.addEventListener("onContextMenu", function() {
          return false;
        });
        this.viewport.addEventListener("mousewheel", this.wheelMoved);
        this.viewport.addEventListener("click", this.mouseClick);
        this.viewport.addEventListener("dblclick", this.mouseDblClick);
        window.addEventListener("keydown", this.keyDown);
        window.addEventListener("keyup", this.keyUp);
      }

      DOMEventManager.prototype.wheelMoved = function(evt) {
        this.getMousePos(evt);
        return Hal.trigger("SCROLL", {
          down: evt.wheelDelta < 0,
          pos: this.pos
        });
      };

      DOMEventManager.prototype.keyDown = function(evt) {
        if (this.under_hud) {
          return;
        }
        return Hal.trigger("KEY_DOWN", evt);
      };

      DOMEventManager.prototype.keyUp = function(evt) {
        if (this.under_hud) {
          return;
        }
        return Hal.trigger("KEY_UP", evt);
      };

      DOMEventManager.prototype.mouseDblClick = function(evt) {
        this.getMousePos(evt);
        return Hal.trigger("LEFT_DBL_CLICK", this.pos);
      };

      DOMEventManager.prototype.mouseClick = function(evt) {
        if (this.under_hud) {
          return;
        }
        this.getMousePos(evt);
        return Hal.trigger("MOUSE_CLICK", this.pos);
      };

      DOMEventManager.prototype.mouseMove = function(evt) {
        this.under_hud = this.hud.querySelectorAll(':hover').length > 0;
        if (this.under_hud) {
          return;
        }
        this.getMousePos(evt);
        Hal.trigger("MOUSE_MOVE", this.pos);
        if (this.mouse_leftbtn_down && (!this.dragging && this.can_drag)) {
          Hal.trigger("DRAG_STARTED", this.pos);
          this.dragging = true;
          return this.can_drag = false;
        }
      };

      DOMEventManager.prototype.mouseUp = function(evt) {
        if (this.under_hud) {
          this.mouse_leftbtn_down = false;
          return;
        }
        this.getMousePos(evt);
        if (this.dragging) {
          this.dragging = false;
          Hal.trigger("DRAG_ENDED", this.pos);
          this.can_drag = true;
        }
        if (this.mouse_rightbtn_down && !this.dragging) {
          Hal.trigger("RIGHT_CLICK", this.pos);
          return this.mouse_rightbtn_down = false;
        } else if (this.mouse_leftbtn_down && !this.dragging) {
          Hal.trigger("LEFT_CLICK", this.pos);
          return this.mouse_leftbtn_down = false;
        }
      };

      DOMEventManager.prototype.mouseDown = function(evt) {
        if (this.under_hud) {
          this.mouse_leftbtn_down = false;
          return;
        }
        this.getMousePos(evt);
        if (evt.button === 0) {
          return this.mouse_leftbtn_down = true;
        } else if (evt.button === 2) {
          return this.mouse_rightbtn_down = true;
        }
      };

      DOMEventManager.prototype.getMousePos = function(evt) {
        this.pos[0] = evt.clientX - Hal.dom.area.left;
        return this.pos[1] = evt.clientY - Hal.dom.area.top;
      };

      return DOMEventManager;

    })();
    return DOMEventManager;
  });

}).call(this);

(function() {
  "use strict";
  var __slice = [].slice;

  define('ajax',[], function() {
    var Ajax, Result;
    Result = (function() {
      function Result(url) {
        this.url = url;
        this.success_ = this.fail_ = this.always_ = function() {};
        this.success = function(success_) {
          this.success_ = success_;
          return this;
        };
        this.fail = function(fail_) {
          this.fail_ = fail_;
          return this;
        };
        this.always = function(always_) {
          this.always_ = always_;
          return this;
        };
      }

      return Result;

    })();
    Ajax = new Object();
    Ajax.get = function() {
      var ajaxreq, callbacks, con_url, data, result, url;
      url = arguments[0], data = arguments[1], callbacks = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (data == null) {
        data = '';
      }
      result = new Result(document.domain + '/' + url);
      ajaxreq = new XMLHttpRequest();
      con_url = url;
      if (typeof data === "function") {
        url = "" + url + "?" + data;
        callbacks.unshift(data);
      }
      ajaxreq.open("GET", con_url);
      ajaxreq.send();
      ajaxreq.onreadystatechange = function() {
        var type;
        if (ajaxreq.readyState === 4) {
          type = ajaxreq.getResponseHeader("Content-Type");
          if (ajaxreq.status === 200) {
            data = ajaxreq.responseText;
            if (type === "application/json" && url.indexOf("json") === -1) {
              data = JSON.parse(data);
            }
            result.success_(data);
            if (callbacks[0]) {
              callbacks[0](data);
            }
          } else {
            result.fail_(ajaxreq.responseText);
            if (callbacks[1]) {
              callbacks[1](data);
            }
          }
          result.always_(url || data);
          if (callbacks[2]) {
            return callbacks[2](data);
          }
        }
      };
      return result;
    };
    Ajax.post = function() {
      var ajaxreq, callbacks, data, result, url;
      url = arguments[0], data = arguments[1], callbacks = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      result = new Result(document.domain + '/' + url);
      ajaxreq = new XMLHttpRequest();
      ajaxreq.open("POST", url);
      ajaxreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      ajaxreq.send(data);
      ajaxreq.onreadystatechange = function() {
        var type;
        if (ajaxreq.readyState === 4) {
          type = ajaxreq.getResponseHeader("Content-Type");
          if (ajaxreq.status === 200) {
            data = ajaxreq.responseText;
            if (type === "application/json") {
              data = JSON.parse(data);
            }
            result.success_(data);
            if (callbacks[0]) {
              callbacks[0](data);
            }
          } else {
            result.fail_(ajaxreq.responseText);
            if (callbacks[1]) {
              callbacks[1](data);
            }
          }
          result.always_(url || data);
          if (callbacks[2]) {
            return callbacks[2](data);
          }
        }
      };
      return result;
    };
    return Ajax;
  });

}).call(this);

(function() {
  "use strict";
  define('metaconfig',[], function() {
    var MetaConfig;
    MetaConfig = {
      Regex: {
        SpriteMatcher: /\/assets\/sprites\/(.*\/)(.*)\.png/,
        AssetType: /^(.*)\.(.*)$/
      },
      URI: {
        Sprites: "sprites/",
        Assets: "/assets/",
        Maps: "/map/",
        Websockets: "http://localhost:8080"
      }
    };
    return MetaConfig;
  });

}).call(this);

(function() {
  "use strict";
  define('sprite',["metaconfig"], function(MetaConfig) {
    var Sprite;
    Sprite = (function() {
      function Sprite(img, name, x, y, w, h) {
        var spl;
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        spl = this.img.src.match(MetaConfig.Regex.SpriteMatcher);
        this.name = spl && spl[2] ? spl[2] : "";
        this.w2 = this.w * 0.5;
        this.h2 = this.h * 0.5;
        this.folder = spl && spl[1] ? spl[1] : "";
        this.onLazyLoad = null;
      }

      Sprite.prototype.changeSprite = function(other) {
        this.img = other.img;
        this.name = other.name;
        this.x = other.x;
        this.y = other.y;
        this.w = other.w;
        this.h = other.h;
        this.folder = other.folder;
        this.w2 = other.w2;
        this.h2 = other.h2;
        if (this.onLazyLoad != null) {
          return this.onLazyLoad();
        }
      };

      Sprite.prototype.getName = function() {
        return this.folder + this.name;
      };

      return Sprite;

    })();
    return Sprite;
  });

}).call(this);

(function() {
  "use strict";
  define('imgutils',[], function() {
    var ImageUtils;
    ImageUtils = (function() {
      function ImageUtils() {
        this.hit_ctx = this.createCanvas(1, 1).getContext("2d");
        /* 
         @todo 
            Ovo treba biti maks velicine
        */

        this.tint_ctx = this.createCanvas(800, 600).getContext("2d");
      }

      ImageUtils.prototype.createCanvas = function(w, h) {
        var canvas;
        canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        return canvas;
      };

      ImageUtils.prototype.clipImage = function(img, area) {
        var canvas, ctx;
        canvas = this.createCanvas(area.w, area.h);
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h);
        img = new Image();
        img.src = canvas.toDataURL("image/png");
        return img;
      };

      ImageUtils.prototype.isTransparent = function(img, x, y) {
        var data;
        this.hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
        data = this.hit_ctx.getImageData(0, 0, 1, 1).data;
        this.hit_ctx.clearRect(0, 0, 1, 1);
        return data[3] < 255;
      };

      ImageUtils.prototype.getPixelAt = function(img, x, y) {
        var data, pos;
        this.hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
        data = this.hit_ctx.getImageData(0, 0, 1, 1).data;
        pos = (x + y) * 4;
        return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
        return this.hit_ctx.clearRect(0, 0, 1, 1);
      };

      ImageUtils.prototype.tintImage = function(img, color, opacity) {
        var tint_buff, tint_ctx;
        tint_buff = this.createCanvas(img.width, img.height);
        tint_ctx = tint_buff.getContext("2d");
        tint_ctx.globalAlpha = 1.0;
        tint_ctx.drawImage(img, 0, 0);
        tint_ctx.globalAlpha = opacity;
        tint_ctx.globalCompositeOperation = 'source-atop';
        tint_ctx.fillStyle = color;
        tint_ctx.fillRect(0, 0, img.width, img.height);
        return tint_buff;
      };

      return ImageUtils;

    })();
    return ImageUtils;
  });

}).call(this);

(function() {
  "use strict";
  define('spritefactory',["sprite", "imgutils"], function(Sprite, ImgUtils) {
    var SpriteFactory;
    SpriteFactory = {};
    SpriteFactory.clipFromSpriteSheet = function(img, name, cliprect) {
      return new Sprite(ImgUtils.clipImage(img, cliprect), name, 0, 0, cliprect.w, cliprect.h);
    };
    SpriteFactory.fromSingleImage = function(img, name) {
      return new Sprite(img, name, 0, 0, img.width, img.height);
    };
    SpriteFactory.dummySprite = function() {
      var img;
      img = new Image();
      img.src = "";
      return new Sprite(img, "n/a", 0, 0, img.width, img.height);
    };
    return SpriteFactory;
  });

}).call(this);

(function() {
  "use strict";
  define('spritesheet',[], function() {
    var SpriteSheet;
    SpriteSheet = (function() {
      function SpriteSheet(path, img, meta, sprites) {
        var matches;
        this.path = path;
        this.img = img;
        this.meta = meta;
        this.sprites = sprites != null ? sprites : {};
        matches = this.path.match(/.*\/(.*)\.json/);
        if (matches && matches.length > 0) {
          this.name = matches[1];
        } else {
          this.name = this.path;
        }
      }

      SpriteSheet.prototype.addSprite = function(spr) {
        return this.sprites[spr.name] = spr;
      };

      return SpriteSheet;

    })();
    return SpriteSheet;
  });

}).call(this);

/*
Deferred i DeferredCounter
AssetManager
 -> @load()
    -> loads everything, updates on progress
        loading is executed upon establishing a connection to a websockets server
        or with an explicit function call that accepts a string referring to a 
        a file with a list of assets 
        . server listens on a port 9000 and sends out a message of a format which 
          is described in it's source file
          e.g 
            {type: "sprites", files: ["fileA.png"]}
            {type: "audio", files: ["fileB.ogg"]}

 -> @loadFromArray(@@type: string, @@in: array)
        @@insets from @@in array
         e.g @loadFromArray("sprites", ["fileA.png"])

 -> @loadFromFileList(@@list: string)
        @@list: 
         loads assets that are listed in a file 
         e.g 
            @loadFromFileList("assets_amjad_01.list")

 -> what gets loaded and how?
  - sprites 
    . located in assets/sprite folder
    . just a single image, that is, it isn't a spritesheet
  
  - spritesheets
    . located in assets/spritesheets folder
    . sheets of images in a TexturePacker format and perhaps in the future
      in one of my own (with tar compression support)

  - audio
    . wav or ogg formats which are 
      the most widely supported on today's web browsers
      aac is left out because of its size which isn't very practical
      for a game engine

  - how it's loaded and stored?

    @assets = {
        @sprites: []
        @spritesheets: []
        @audio: []
        @animation: []
    }
    
    Hal("load sprites from folder abcde")
    Hal("
        spr = sprite("horse");
        move spr to @x @y
    ")

    @on "each frame if selected"
        crtaj se u nekom fazonu

    @on["each frame"] = on_selected radi ono gore

    on frame repeat true
    @on "each right click and frame if selected" () ->
        moveonpath @pos @mpos

    a onda moveonpath moze da boji tajlove pod kojima entitet prolazi
    ili da ih markira, ili samo da se proseta
    mozda da ide napred-nazad?

-> provides specialized functions to retrieve assets by their name

-> @getSprite(group_name)
 -group
    refers to a folder where the sprite is
 -name 
    refers to a image file name

usage:
    @getSprite("horses/whitehorse")
    @getSprite("horses/white/shadowfax)

-> @getSpritesFrom(folder)
folder
    refers to a folder where the sprites are
returns:
    list of all sprites in a folder
usage: 
    @getSpritesFrom("horses")
*/


(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('assetmanager',["deferred", "deferredcounter", "ajax", "spritefactory", "sprite", "spritesheet", "eventdispatcher", "metaconfig"], function(Deferred, DeferredCounter, Ajax, SpriteFactory, Sprite, SpriteSheet, EventDispatcher, MetaConfig) {
    var AssetManager;
    AssetManager = (function(_super) {
      __extends(AssetManager, _super);

      function AssetManager() {
        AssetManager.__super__.constructor.call(this);
        this.assets = {
          sprites: {},
          spritesheets: {},
          audio: {},
          animation: {}
        };
        this.tint_cache = {};
        this.wait_queue = [];
      }

      return AssetManager;

    })(EventDispatcher);
    AssetManager.prototype.setResourcesRelativeURL = function(url) {
      return MetaConfig.URI.Assets = url;
    };
    AssetManager.prototype.resolvePath = function(url) {
      var g, grps, key, top, _i, _len, _ref;
      grps = url.split("/");
      if (this.assets.hasOwnProperty(grps[0])) {
        top = this.assets[grps[0]];
      }
      _ref = grps.slice(1, grps.length - 1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        g = _ref[_i];
        if (!top.hasOwnProperty(g)) {
          top[g] = new Object();
        }
        top = top[g];
        key = grps[grps.length - 1];
        key = key.substring(0, key.lastIndexOf("."));
      }
      return [top, key];
    };
    AssetManager.prototype.addToStorage = function(url, obj) {
      var key, top, _ref;
      _ref = this.resolvePath(url), top = _ref[0], key = _ref[1];
      top[key] = obj;
      return top[key];
    };
    AssetManager.prototype.deleteFromStorage = function(url) {
      var key, top, _ref;
      _ref = this.resolvePath(url), top = _ref[0], key = _ref[1];
      top[key] = null;
      return delete top[key];
    };
    AssetManager.prototype.loadImage = function(imgURL) {
      var defer, img,
        _this = this;
      defer = new Deferred();
      img = new Image();
      img.src = imgURL;
      img.onload = function() {
        return defer.resolve(img, img);
      };
      img.onerror = function() {
        return defer.reject(img, imgURL);
      };
      return defer.promise();
    };
    AssetManager.prototype.loadImages = function(imgs) {
      var defer, img, _i, _len;
      defer = new DeferredCounter(imgs.length);
      for (_i = 0, _len = imgs.length; _i < _len; _i++) {
        img = imgs[_i];
        this.loadImage(img).then(function(x) {
          return defer.release(this, x);
        }).fail(function(x) {
          return defer.acquire(this, x);
        });
      }
      return defer.promise();
    };
    AssetManager.prototype.getTintedSprite = function(sprite, color, alpha) {
      var id;
      if (color == null) {
        color = "red";
      }
      if (alpha == null) {
        alpha = 0.5;
      }
      /*
          @todo 
          Treba proveriti velicinu tint kesa, isprazniti ga 
          ako predje neke threshold
      */

      id = sprite.getName() + color;
      if (!this.tint_cache[id]) {
        this.tint_cache[id] = Hal.imgutils.tintImage(sprite.img, color, alpha);
      }
      return this.tint_cache[id];
    };
    AssetManager.prototype.loadSprite = function(url) {
      var defer,
        _this = this;
      url = MetaConfig.URI.Assets + url;
      defer = new Deferred();
      this.loadImage(url).then(function(img) {
        var name, sprite;
        sprite = SpriteFactory.fromSingleImage(img, url);
        name = sprite.getName();
        if (_this.wait_queue[name]) {
          llogi("Sprite was in a waiting queue: SPRITE = " + name);
          _this.wait_queue[name].changeSprite(sprite);
          delete _this.wait_queue[url];
        }
        Hal.trigger("SPRITE_LOADED", sprite);
        return defer.resolve(_this, sprite);
      }).fail(function(x) {
        return defer.reject(_this, x);
      });
      return defer.promise();
    };
    AssetManager.prototype.loadSound = function(url) {
      var defer;
      url = MetaConfig.URI.Assets + url;
      return defer = new Deferred();
    };
    AssetManager.prototype.addSprite = function(g) {
      var _this = this;
      return this.loadSprite(g).then(function(sprite) {
        return _this.addToStorage(g, sprite);
      });
    };
    AssetManager.prototype.addSound = function() {
      var _this = this;
      return this.loadSound(g).then(function(sound) {
        return _this.addToStorage(g, sound);
      });
    };
    AssetManager.prototype.resolveFolderPath = function(url) {
      var g, grps, key, top, _i, _len, _ref;
      grps = url.split("/");
      if (this.assets.hasOwnProperty(grps[0])) {
        top = this.assets[grps[0]];
        if (grps.length > 3) {
          _ref = grps.slice(1, grps.length - 2);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            g = _ref[_i];
            if (!top.hasOwnProperty(g)) {
              top[g] = {};
            }
            top = top[g];
          }
        }
      }
      key = grps[grps.length - 2];
      return [top, key];
    };
    AssetManager.prototype.loadViaSocketIO = function() {
      var _this = this;
      if (typeof io === "undefined" || io === null) {
        lloge("Couldn't find socket.io library");
        return;
      }
      this.socket = io.connect(MetaConfig.URI.Websockets);
      this.socket.on("connect", function() {
        return llogd("Connected via socket.io");
      });
      this.socket.on("LOAD_SPRITES", function(data) {
        var g, i, len, list, _i, _len, _results;
        list = JSON.parse(data.files);
        len = list.length - 1;
        _this.trigger("SPRITES_LOADING", len);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSprite(data.url + g).then(function() {
              _this.trigger("SPRITE_LOADED", g);
              if (i === len) {
                console.log("WTF WTF WTF");
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("LOAD_SOUNDS", function(data) {
        var g, i, len, list, _i, _len, _results;
        list = JSON.parse(data.files);
        len = list.length - 1;
        _this.trigger("SOUNDS_LOADING", len);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSound(data.url + g).then(function() {
              _this.trigger("SOUND_LOADED");
              if (i === len) {
                return _this.trigger("SOUNDS_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("SPRITE_FOLDER_ADDED", function(data) {
        var file, i, len, _fn, _i, _len, _ref, _results;
        llogd("Sprite folder added: data.url");
        len = data.files.length;
        _this.trigger("SPRITES_LOADING");
        _ref = data.files;
        _fn = function(file, i) {};
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          file = _ref[i];
          llogd("Adding sprite: " + file);
          _fn(file, i);
          _results.push(_this.addSprite(data.url + file).then(function() {
            _this.trigger("SPRITE_LOADED", file);
            if (i === len) {
              return _this.trigger("SPRITES_LOADED");
            }
          }));
        }
        return _results;
      });
      this.socket.on("SPRITE_ADDED", function(data) {
        llogd("Sprite added: " + data.url);
        return _this.addSprite(data.url);
      });
      this.socket.on("SPRITESHEET_ADDED", function(data) {
        return llogd("Spritesheet added: " + data.url);
      });
      this.socket.on("SPRITE_DELETED", function(data) {
        llogd("Sprite deleted: " + data.url);
        return _this.deleteFromStorage(data.url);
      });
      this.socket.on("SPRITE_FOLDER_DELETED", function(data) {
        var key, storage, _ref;
        llogd("Sprite folder deleted: " + data.url);
        _ref = _this.resolveFolderPath(data.url), storage = _ref[0], key = _ref[1];
        delete storage[key];
        return _this.trigger("SPRITES_LOADED");
      });
      return this.socket.on("SPRITESHEET_DELETED", function(data) {
        llogd("Spritesheet deleted: " + data.url);
        return llogd(data);
      });
    };
    AssetManager.prototype.loadSpritesFromFileList = function(list) {
      var _this = this;
      return Ajax.get(list, function(data) {
        var i, len, spr, _i, _len, _results;
        data = data.split("\n");
        data.splice(-1);
        len = data.length - 1;
        _this.trigger("SPRITES_LOADING", len);
        _results = [];
        for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
          spr = data[i];
          _results.push((function(spr, i) {
            return _this.addSprite(spr).then(function() {
              _this.trigger("SPRITE_LOADED", spr);
              if (i === len) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(spr, i));
        }
        return _results;
      });
    };
    AssetManager.prototype.loadFromArray = function(type, array) {
      if (__indexOf.call(this.assets, type) < 0) {

      }
    };
    AssetManager.prototype.getSprite = function(spr) {
      var key, store, _ref;
      _ref = this.resolvePath(MetaConfig.URI.Sprites + spr + "."), store = _ref[0], key = _ref[1];
      return store[key];
    };
    AssetManager.prototype.getSpritesFromFolder = function(folder) {
      var ind, k, key, out, storage, v, _ref, _ref1;
      if (folder === "/") {
        return this.getSpriteFolders();
      }
      ind = folder.indexOf("/");
      if (ind === 0) {
        folder = folder.substring(ind + 1);
      }
      ind = folder.charAt(folder.length - 1);
      if (ind !== "/") {
        folder = "" + folder + "/";
      }
      out = {};
      _ref = this.resolveFolderPath(MetaConfig.URI.Sprites + folder), storage = _ref[0], key = _ref[1];
      _ref1 = storage[key];
      for (k in _ref1) {
        v = _ref1[k];
        if (v.img != null) {
          out[k] = v;
        }
      }
      return out;
    };
    AssetManager.prototype.getSpriteFoldersFromFolder = function(folder) {
      var ind, k, key, out, storage, v, _ref, _ref1;
      ind = folder.indexOf("/");
      if (ind === 0) {
        folder = folder.substring(ind + 1);
      }
      ind = folder.charAt(folder.length - 1);
      if (ind !== "/") {
        folder = "" + folder + "/";
      }
      out = {};
      _ref = this.resolveFolderPath(MetaConfig.URI.Sprites + folder), storage = _ref[0], key = _ref[1];
      _ref1 = storage[key];
      for (k in _ref1) {
        v = _ref1[k];
        if (v.img == null) {
          out[k] = v;
        }
      }
      return out;
    };
    AssetManager.prototype.getSpriteFolders = function() {
      return this.assets.sprites;
    };
    AssetManager.prototype.waitFor = function(spr_instance, sprurl) {
      return this.wait_queue[sprurl] = spr_instance;
    };
    return AssetManager;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('bboxalgos',["vec2"], function(Vec2) {
    var BBoxAlgos, BBoxDownSampler, BBoxResolver, BBoxSampler, DouglasPecker, HorizontalSampler, _ref, _ref1;
    BBoxAlgos = {
      polyBBoxFromSprite: function(sprite, sampler, downsampler) {
        if (sampler == null) {
          sampler = HorizontalSampler;
        }
        if (downsampler == null) {
          downsampler = DouglasPecker;
        }
        return BBoxResolver(sprite, sampler, downsampler);
      },
      rectBBoxFromSprite: function(sprite) {
        return [-sprite.w * 0.5, -sprite.h * 0.5, sprite.w, sprite.h];
      },
      rectFromPolyShape: function(shape) {
        var maxX, maxY, minX, minY, pt, _i, _len;
        minX = Number.MAX_VALUE;
        minY = Number.MAX_VALUE;
        maxX = -Number.MIN_VALUE;
        maxY = -Number.MIN_VALUE;
        for (_i = 0, _len = shape.length; _i < _len; _i++) {
          pt = shape[_i];
          minX = Math.min(pt[0], minX);
          minY = Math.min(pt[1], minY);
          maxX = Math.max(pt[0], maxX);
          maxY = Math.max(pt[1], maxY);
        }
        return [minX, minY, Math.abs(minX) + maxX, Math.abs(minY) + maxY];
      },
      circularBBoxFromSprite: function(sprite) {
        var rad;
        rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5;
        return [rad];
      },
      rectIntersectsRect: function(rect) {
        return Hal.math.rectIntersectsRect(rect, [this.pos[0], this.pos[1], this.bounds[2], this.bounds[3]]);
      },
      rectIntersectsCircle: function(rect) {
        return Hal.math.rectIntersectsAndHullsCircle(rect, this.pos, this.bounds[0]);
      },
      rectBoundCheck: function(pos) {
        return Hal.math.isPointInRect(pos, [this.pos[0], this.pos[1], this.bounds[2], this.bounds[3]]);
      },
      circularBoundCheck: function(pos) {
        return Hal.math.isPointInCircle(pos, this.pos, this.bounds[0]);
      }
    };
    BBoxResolver = function(sprite, sampler, downsampler) {
      var canvas, critical, criticals, ctx, findCriticalPoint, height, pixels, points, width;
      points = [];
      width = sprite.w;
      height = sprite.h;
      canvas = Hal.dom.createCanvas(width, height);
      ctx = canvas.getContext("2d");
      criticals = [];
      ctx.drawImage(sprite.img, 0, 0);
      pixels = ctx.getImageData(0, 0, width, height);
      findCriticalPoint = function() {
        var angle_treshold, degs, degs_diff, dot, first, next, p, prev_degs, pt, q, second, third, vecA, vecB, _i, _len;
        prev_degs = 0;
        degs = 0;
        angle_treshold = 1 / 33;
        if (points.length < 2) {
          return void 0;
        }
        for (q = _i = 0, _len = points.length; _i < _len; q = ++_i) {
          p = points[q];
          next = points[q + 1];
          if (next == null) {
            break;
          }
          first = Vec2.fromValues(p.x, p.y);
          second = Vec2.fromValues(next.x, next.y);
          vecA = Vec2.sub([], second, first);
          if (vecA != null) {
            third = points[q + 2];
            if (third == null) {
              break;
            }
            vecB = Vec2.sub([], second, Vec2.fromValues(third.x, third.y));
          }
          if ((vecA != null) && (vecB != null)) {
            Vec2.normalize(vecA, vecA);
            Vec2.normalize(vecB, vecB);
            dot = Vec2.dot(vecA, vecB);
            prev_degs = degs;
            degs = Vec2.dot(vecA, vecB);
            degs_diff = Math.abs(degs - prev_degs);
            if (degs_diff > angle_treshold) {
              pt = [points[q + 2].x - Hal.math.epsilon, points[q + 2].y - Hal.math.epsilon];
              points.splice(0, q + 2);
              return pt;
            }
          }
        }
      };
      points = new sampler(pixels.data, width, height);
      while ((critical = findCriticalPoint())) {
        criticals.push(critical);
      }
      Hal.log.debug("num criticals: " + criticals.length);
      return new downsampler(criticals);
    };
    BBoxSampler = (function() {
      function BBoxSampler(data, width, height, sample_rate) {
        this.data = data != null ? data : [];
        this.width = width;
        this.height = height;
        this.sample_rate = sample_rate != null ? sample_rate : 1;
        return this.samplingFunc();
      }

      BBoxSampler.prototype.samplingFunc = function() {
        return [];
      };

      BBoxSampler.prototype.getPixelAt = function(x, y) {
        var pos;
        pos = (x + this.width * y) * 4;
        return [this.data[pos], this.data[pos + 1], this.data[pos + 2], this.data[pos + 3]];
      };

      return BBoxSampler;

    })();
    HorizontalSampler = (function(_super) {
      __extends(HorizontalSampler, _super);

      function HorizontalSampler() {
        _ref = HorizontalSampler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HorizontalSampler.prototype.samplingFunc = function() {
        var alpha_treshold, i, j, pix, points, _i, _j, _k, _l, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
        alpha_treshold = 130;
        points = [];
        for (i = _i = 0, _ref1 = this.width - 1, _ref2 = this.sample_rate; _ref2 > 0 ? _i <= _ref1 : _i >= _ref1; i = _i += _ref2) {
          for (j = _j = 0, _ref3 = this.height; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; j = 0 <= _ref3 ? ++_j : --_j) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.push({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        for (i = _k = 0, _ref4 = this.width - 1, _ref5 = this.sample_rate; _ref5 > 0 ? _k <= _ref4 : _k >= _ref4; i = _k += _ref5) {
          for (j = _l = _ref6 = this.height; _l >= 0; j = _l += -1) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.unshift({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        return points;
      };

      return HorizontalSampler;

    })(BBoxSampler);
    BBoxDownSampler = (function() {
      function BBoxDownSampler(pts) {
        return this.downsamplingFunc(pts);
      }

      BBoxDownSampler.prototype.downsamplingFunc = function() {
        return [];
      };

      return BBoxDownSampler;

    })();
    DouglasPecker = (function(_super) {
      __extends(DouglasPecker, _super);

      function DouglasPecker() {
        _ref1 = DouglasPecker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DouglasPecker.prototype.downsamplingFunc = function(pts) {
        var dist, end, epsilon, i, index, max_dist, res, res1, res2, start, _i, _ref2;
        epsilon = 3;
        start = pts[0];
        end = pts[pts.length - 1];
        max_dist = 0;
        index = 0;
        res = [];
        if (pts.length < 2) {
          return pts;
        }
        for (i = _i = 1, _ref2 = pts.length - 2; 1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
          dist = Hal.math.perpDistance(pts[i], start, end);
          if (dist > max_dist) {
            index = i;
            max_dist = dist;
          }
        }
        if (max_dist > epsilon) {
          res1 = this.downsamplingFunc(pts.slice(0, +index + 1 || 9e9));
          res2 = this.downsamplingFunc(pts.slice(index, +(pts.length - 1) + 1 || 9e9));
          res1 = res1.slice(0, res1.length - 1);
          res = res1.concat(res2);
        } else {
          res.push(pts[0]);
          res.push(pts[pts.length - 1]);
        }
        return res;
      };

      return DouglasPecker;

    })(BBoxDownSampler);
    return BBoxAlgos;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('entity',["halalentity", "scene", "matrix3", "bboxalgos", "vec2"], function(HalalEntity, Scene, Matrix3, BBoxAlgos, Vec2) {
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

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('spriteentity',["entity", "bboxalgos", "spritefactory"], function(Entity, BBoxAlgos, SpriteFactory) {
    var SpriteEntity;
    SpriteEntity = (function(_super) {
      __extends(SpriteEntity, _super);

      function SpriteEntity(meta) {
        var _this = this;
        SpriteEntity.__super__.constructor.call(this, meta);
        this.sprite = Hal.asm.getSprite(meta.sprite);
        this.visible_sprite = meta.visible_sprite != null ? meta.visible_sprite : true;
        this.h = meta.height != null ? meta.height : 0;
        this.w = meta.width != null ? meta.width : 0;
        if (this.sprite == null) {
          this.sprite = SpriteFactory.dummySprite();
          Hal.asm.waitFor(this.sprite, meta.sprite);
        } else {
          this.calcShapeAndBBox();
        }
        this.sprite.onLazyLoad = function() {
          return _this.calcShapeAndBBox();
        };
      }

      SpriteEntity.prototype.init = function() {
        return SpriteEntity.__super__.init.call(this);
      };

      SpriteEntity.prototype.inShapeBounds = function(pos) {
        pos = this.worldToLocal(this.scene.localToWorld(pos));
        if (Hal.math.isPointInRect(pos, this.bbox)) {
          if (!Hal.im.isTransparent(this.sprite.img, pos[0] + this.bbox[2] * 0.5, pos[1] + this.bbox[3] * 0.5)) {
            return true;
          }
        }
        return false;
      };

      SpriteEntity.prototype.calcShapeAndBBox = function() {
        return this.attr("bbox", BBoxAlgos.rectBBoxFromSprite(this.sprite));
      };

      SpriteEntity.prototype.draw = function() {
        SpriteEntity.__super__.draw.call(this);
        if (this.visible_sprite) {
          return this.scene.g.drawSprite(this.sprite, this.w, this.h);
        }
      };

      return SpriteEntity;

    })(Entity);
    return SpriteEntity;
  });

}).call(this);

(function() {
  "use strict";
  /*
   Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
  */

  define('drawable',["vec2", "geometry", "sprite"], function(Vec2, Geometry, Sprite) {
    var Drawable;
    Drawable = (function() {
      Drawable.prototype.drawableToggleState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return this._drawableState ^= state;
      };

      Drawable.prototype.drawableOnState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return this._drawableState |= state;
      };

      Drawable.prototype.drawableOffState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        this.drawableOnState(state);
        return this.drawableToggleState(state);
      };

      Drawable.prototype.drawableIsState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return (this._drawableState & state) === state;
      };

      Drawable.prototype.destructor = function() {};

      function Drawable() {
        this._drawableState = 0xF00;
        this.stroke_color = "white";
        this.fill_color = "orange";
        this.sprite = null;
        this.glow_amount = 1;
        this.glow_color = "blue";
        this.stroke_width = 1;
        this.opacity = 1;
        this.on("CHANGE", function(key, val) {
          if (key === "sprite") {
            if ((this.sprite == null) || !this.sprite instanceof Sprite) {
              return;
            }
            this.trigger("SPRITE_ADDED", this.sprite);
            this.drawableOnState(Drawable.DrawableStates.Sprite);
            this.drawableOffState(Drawable.DrawableStates.Fill);
            return this.drawableOffState(Drawable.DrawableStates.Stroke);
          } else if (key === "glow" && val === true) {
            this.drawableOnState(Drawable.DrawableStates.Stroke);
            return this.drawableOnState(Drawable.DrawableStates.Glow);
          } else if (key === "glow" && val === false) {
            return this.drawableOffState(Drawable.DrawableStates.Glow);
          }
        });
        this.on("POST_FRAME", function(delta) {
          /* @FILL*/

          var i, mid, p, p1, p2;
          if (this.drawableIsState(Drawable.DrawableStates.Fill)) {
            this.ctx.fillStyle = this.fill_color;
            this.ctx.beginPath();
            this.ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              this.ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            this.ctx.closePath();
            this.ctx.fill();
          }
          /* @DRAW @SPRITE*/

          if (this.drawableIsState(Drawable.DrawableStates.Sprite) && (this.sprite != null)) {
            this.ctx.drawImage(this.sprite.img, -this.sprite.w2, -this.sprite.h2);
          }
          /* @GLOW*/

          if (this.drawableIsState(Drawable.DrawableStates.Glow)) {
            this.ctx.shadowColor = this.glow_color;
            this.ctx.shadowBlur = this.glow_amount;
          }
          /* @STROKE*/

          if (this.drawableIsState(Drawable.DrawableStates.Stroke)) {
            this.ctx.lineWidth = this.stroke_width;
            this.ctx.strokeStyle = this.stroke_color;
            this.ctx.beginPath();
            this.ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              this.ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.lineWidth = 1;
          }
          if (this.drawableIsState(Drawable.DrawableStates.Glow)) {
            this.ctx.shadowBlur = 0;
          }
          /* @DRAW @NORMALS*/

          if (this.drawableIsState(Drawable.DrawableStates.DrawNormals)) {
            i = 0;
            p1 = Vec2.acquire();
            p2 = Vec2.acquire();
            mid = Vec2.acquire();
            p = Vec2.acquire();
            while (i < this._numvertices) {
              Vec2.copy(p1, this._mesh[i]);
              Vec2.copy(p2, this._mesh[(i + 1) % this._numvertices]);
              Vec2.addAndScale(mid, p1, p2, 0.5);
              Vec2.sub(p, p2, p1);
              Vec2.perpendicular(p1, p);
              Vec2.normalize(p2, p1);
              Vec2.scale(p1, p2, 50);
              Vec2.add(p, p1, mid);
              this.ctx.strokeStyle = "yellow";
              this.ctx.beginPath();
              this.ctx.moveTo(mid[0], mid[1]);
              this.ctx.lineTo(p[0], p[1]);
              this.ctx.closePath();
              this.ctx.stroke();
              ++i;
            }
            Vec2.release(p1);
            Vec2.release(p2);
            Vec2.release(mid);
            Vec2.release(p);
          }
          if (this.drawableIsState(Drawable.DrawableStates.DrawCenter)) {
            this.ctx.strokeRect(0, 0, 1, 1);
          }
          if (this.drawableIsState(Drawable.DrawableStates.DrawBBox)) {
            return this.ctx.strokeRect(this._bbox[0], this._bbox[1], this._bbox[2], this._bbox[3]);
          }
        });
      }

      return Drawable;

    })();
    Drawable.DrawableStates = {
      DrawCenter: 0x01,
      DrawOriginNormals: 0x02,
      Glow: 0x04,
      DrawNormals: 0x08,
      Fill: 0x10,
      Sprite: 0x20,
      DrawBBox: 0x40,
      Stroke: 0x80
    };
    return Drawable;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('bbresolvers',["vec2", "mathutil", "geometry"], function(Vec2, MathUtil, Geometry) {
    var BBDownSampler, BBResolvers, BBSampler, BBSamplerResolver, DouglasPecker, HorizontalSampler, _ref, _ref1;
    BBResolvers = {
      AABPolygonFromSprite: function(sprite, sampler, downsampler) {
        if (sampler == null) {
          sampler = HorizontalSampler;
        }
        if (downsampler == null) {
          downsampler = DouglasPecker;
        }
        return BBSamplerResolver(sprite, sampler, downsampler);
      },
      AABBoxFromSprite: function(sprite) {
        var out;
        out = new MathUtil.ARRAY_TYPE(4);
        out[0] = -sprite.w * 0.5;
        out[1] = -sprite.h * 0.5;
        out[2] = sprite.w;
        out[3] = sprite.h;
        return out;
      },
      AABCircleFromSprite: function(sprite) {
        var rad;
        rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5;
        return rad;
      },
      AABBFromPolygon: function(polygon) {
        var maxX, maxY, minX, minY, out, pt, _i, _len;
        minX = Number.MAX_VALUE;
        minY = Number.MAX_VALUE;
        maxX = -Number.MIN_VALUE;
        maxY = -Number.MIN_VALUE;
        for (_i = 0, _len = polygon.length; _i < _len; _i++) {
          pt = polygon[_i];
          minX = Math.min(pt[0], minX);
          minY = Math.min(pt[1], minY);
          maxX = Math.max(pt[0], maxX);
          maxY = Math.max(pt[1], maxY);
        }
        out = new MathUtil.ARRAY_TYPE(4);
        out[0] = minX;
        out[1] = minY;
        out[2] = Math.abs(minX) + maxX;
        out[3] = Math.abs(minY) + maxY;
        return out;
      }
    };
    BBSamplerResolver = function(sprite, sampler, downsampler) {
      var canvas, critical, criticals, ctx, findCriticalPoint, height, pixels, points, width;
      points = [];
      width = sprite.w;
      height = sprite.h;
      canvas = Hal.dom.createCanvas(width, height);
      ctx = canvas.getContext("2d");
      criticals = [];
      ctx.drawImage(sprite.img, 0, 0);
      pixels = ctx.getImageData(0, 0, width, height);
      findCriticalPoint = function() {
        var angle_treshold, degs, degs_diff, dot, first, next, p, prev_degs, pt, q, second, third, vecA, vecB, _i, _len;
        prev_degs = 0;
        degs = 0;
        angle_treshold = 1 / 33;
        if (points.length < 2) {
          return points;
        }
        for (q = _i = 0, _len = points.length; _i < _len; q = ++_i) {
          p = points[q];
          next = points[q + 1];
          if (next == null) {
            break;
          }
          first = Vec2.from(p[0], p[1]);
          second = Vec2.from(next[0], next[1]);
          vecA = Vec2.sub([], second, first);
          if (vecA != null) {
            third = points[q + 2];
            if (third == null) {
              break;
            }
            vecB = Vec2.sub([], second, Vec2.from(third[0], third[1]));
          }
          if ((vecA != null) && (vecB != null)) {
            Vec2.normalize(vecA, vecA);
            Vec2.normalize(vecB, vecB);
            dot = Vec2.dot(vecA, vecB);
            prev_degs = degs;
            degs = Vec2.dot(vecA, vecB);
            degs_diff = Math.abs(degs - prev_degs);
            if (degs_diff > angle_treshold) {
              pt = [points[q + 2][0] - MathUtil.EPSILON, points[q + 2][1] - MathUtil.EPSILON];
              points.splice(0, q + 2);
              return pt;
            }
          }
        }
      };
      points = new sampler(pixels.data, width, height);
      while ((critical = findCriticalPoint()) != null) {
        criticals.push(critical);
      }
      llogd("Number of critical points: " + criticals.length);
      return new downsampler(criticals);
    };
    BBSampler = (function() {
      function BBSampler(data, width, height, sample_rate) {
        this.data = data != null ? data : [];
        this.width = width;
        this.height = height;
        this.sample_rate = sample_rate != null ? sample_rate : 1;
        return this.samplingFunc();
      }

      BBSampler.prototype.samplingFunc = function() {
        return [];
      };

      BBSampler.prototype.getPixelAt = function(x, y) {
        var pos;
        pos = (x + this.width * y) * 4;
        return [this.data[pos], this.data[pos + 1], this.data[pos + 2], this.data[pos + 3]];
      };

      return BBSampler;

    })();
    /*
        @todo Vertical sampler
    */

    HorizontalSampler = (function(_super) {
      __extends(HorizontalSampler, _super);

      function HorizontalSampler() {
        _ref = HorizontalSampler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HorizontalSampler.prototype.samplingFunc = function() {
        var alpha_treshold, i, j, pix, points, _i, _j, _k, _l, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
        alpha_treshold = 130;
        points = [];
        for (i = _i = 0, _ref1 = this.width, _ref2 = this.sample_rate; _ref2 > 0 ? _i < _ref1 : _i > _ref1; i = _i += _ref2) {
          for (j = _j = 0, _ref3 = this.height; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; j = 0 <= _ref3 ? ++_j : --_j) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.push({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        for (i = _k = 0, _ref4 = this.width, _ref5 = this.sample_rate; _ref5 > 0 ? _k < _ref4 : _k > _ref4; i = _k += _ref5) {
          for (j = _l = _ref6 = this.height; _l > 0; j = _l += -1) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.unshift({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        return points;
      };

      return HorizontalSampler;

    })(BBSampler);
    BBDownSampler = (function() {
      function BBDownSampler(pts) {
        return this.downsamplingFunc(pts);
      }

      BBDownSampler.prototype.downsamplingFunc = function() {
        return [];
      };

      return BBDownSampler;

    })();
    DouglasPecker = (function(_super) {
      __extends(DouglasPecker, _super);

      function DouglasPecker() {
        _ref1 = DouglasPecker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DouglasPecker.prototype.downsamplingFunc = function(pts) {
        var dist, end, epsilon, i, index, len, max_dist, res, res1, res2, start, _i, _ref2;
        epsilon = 3;
        start = pts[0];
        len = pts.length;
        end = pts[len - 1];
        max_dist = 0;
        index = 0;
        res = [];
        if (len < 2) {
          return pts;
        }
        for (i = _i = 1, _ref2 = len - 1; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
          dist = Geometry.perpDistance(pts[i], start, end);
          if (dist > max_dist) {
            index = i;
            max_dist = dist;
          }
        }
        if (max_dist > epsilon) {
          res1 = this.downsamplingFunc(pts.slice(0, +index + 1 || 9e9));
          res2 = this.downsamplingFunc(pts.slice(index, len));
          res1 = res1.slice(0, res1.length - 1);
          res = res1.concat(res2);
        } else {
          res.push(start);
          res.push(end);
        }
        return res;
      };

      return DouglasPecker;

    })(BBDownSampler);
    return BBResolvers;
  });

}).call(this);

(function() {
  "use strict";
  /*
   Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
  */

  define('collidable',["vec2", "geometry", "bbresolvers"], function(Vec2, Geometry, BBResolvers) {
    var Collidable;
    Collidable = (function() {
      function Collidable() {
        this.in_collision = false;
        this._bbox = new Array();
        this.on("SHAPE_CHANGED", function(mesh) {
          return this._bbox = BBResolvers.AABBFromPolygon(mesh);
        });
        this.on("SPRITE_ADDED", function(sprite) {
          return this._bbox = BBResolvers.AABBoxFromSprite(sprite);
        });
        this.on("COLLISION_STARTED", function(en) {
          this.stroke_color = "yellow";
          return this.in_collision = true;
        });
        this.on("COLLISION_ENDED", function(en) {
          this.stroke_color = "white";
          return this.in_collision = false;
        });
      }

      Collidable.prototype.intersectsWithBBox = function(other) {
        return Geometry.rectangleIntersectsRectangle(Geometry.transformRectangle(other._bbox, this.transform()), Geometry.transformRectangle(this._bbox, other.transform()));
      };

      return Collidable;

    })();
    return Collidable;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('shape',["vec2", "matrix3", "halalentity", "transformable", "drawable", "geometry", "collidable", "bbresolvers", "sprite", "groupy"], function(Vec2, Matrix3, HalalEntity, Transformable, Drawable, Geometry, Collidable, BBResolvers, Sprite, Groupy) {
    var Shape, reactives;
    reactives = ["angle", "scale", "position", "origin"];
    Shape = (function(_super) {
      __extends(Shape, _super);

      Shape.include(Transformable);

      Shape.include(Drawable);

      Shape.include(Collidable);

      /* grupi*/


      Shape.include(Groupy);

      function Shape(meta) {
        if (meta == null) {
          meta = {};
        }
        Shape.__super__.constructor.call(this);
        this._mesh = null;
        this._numvertices = 0;
        this.scene = null;
        this.quadtree = null;
        this.ctx = null;
        this.parseMeta(meta);
        this.init();
        return this;
      }

      return Shape;

    })(HalalEntity);
    Shape.prototype.parseMeta = function(meta) {
      if (meta.shape != null) {
        this.setShape(meta.shape);
        this.drawableOnState(Drawable.DrawableStates.Stroke);
      }
      if ((meta.x != null) && (meta.y != null)) {
        return this.setPosition(meta.x, meta.y);
      }
    };
    Shape.prototype.init = function() {
      this.on("CHANGE", function(key, val) {
        if (__indexOf.call(reactives, key) >= 0) {
          this._update_mesh_transform = true;
          this._update_transform = true;
          return this._update_inverse = true;
        }
      });
      Shape.__super__.init.call(this);
      return this;
    };
    Shape.prototype.setSprite = function(sprite) {
      return this.attr("sprite", sprite);
    };
    Shape.prototype.scenePosition = function() {
      return Hal.geometry.transformPoint(this.position[0], this.position[1], Matrix3.mul([], this.scene.transform(), this.transform()));
    };
    Shape.prototype.worldPosition = function() {
      return this.position;
    };
    Shape.prototype.setShape = function(mesh) {
      var center;
      if (!Geometry.isPolygonConvex(mesh)) {
        llogw("Oh snap, mesh was degenerate");
        mesh = Geometry.polygonSortVertices(mesh);
      }
      if (this._mesh != null) {
        this.destroyMesh();
      }
      center = Hal.geometry.polygonMeanPoint(mesh);
      this.setOrigin(center[0], center[1]);
      Vec2.release(center);
      this._mesh = mesh;
      this._numvertices = this._mesh.length;
      this.trigger("SHAPE_CHANGED", this._mesh);
      return this;
    };
    Shape.prototype.addVertex = function(x, y) {
      this._numvertices = this._mesh.push(Vec2.from(x, y));
      if (!Geometry.isPolygonConvex(this._mesh)) {
        llogw("Oh snap, mesh was degenerate");
        this.setShape(Geometry.polygonSortVertices(this._mesh));
      }
      return this;
    };
    Shape.prototype.update = function(delta) {
      if (this.scene.update_ents) {
        this._update_transform = true;
      }
      this.calcTransform();
    };
    Shape.prototype.draw = function(delta) {
      this.trigger("PRE_FRAME", delta);
      this.ctx.setTransform(this.scene._transform[0], this.scene._transform[3], this.scene._transform[1], this.scene._transform[4], this.scene._transform[2], this.scene._transform[5]);
      this.ctx.transform(this._transform[0], this._transform[3], this._transform[1], this._transform[4], this._transform[2], this._transform[5]);
      this.trigger("POST_FRAME", delta);
    };
    Shape.prototype.angleWithOrigin = function(p) {
      p = Vec2.transformMat3(null, p, this._transform);
      return Geometry.angleOf([p[0] - this.origin[0], p[1] - this.origin[1]]);
    };
    Shape.prototype.addShape = function() {};
    Shape.prototype.destroy = function() {
      this.scene.trigger("ENTITY_REQ_DESTROYING", this);
      this.destroyMesh();
      this.destructor();
    };
    Shape.prototype.destroyMesh = function() {
      var p, _i, _len, _ref;
      this._numvertices = 0;
      if (this._mesh != null) {
        _ref = this._mesh;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          if (p instanceof Float32Array) {
            Vec2.release(p);
          } else {
            llogw("That is some strange mesh");
          }
        }
        return this.trigger("SHAPE_CHANGED");
      }
    };
    return Shape;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tile',["shape"], function(Shape) {
    var Tile;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.layers = new Array();
        return this;
      }

      Tile.prototype.containsLayer = function(layermeta) {
        var layer;
        layer = layermeta["layer"];
        if ((this.layers[layer] != null) && (this.layers[layer].name === layermeta.name)) {
          return true;
        }
        return false;
      };

      Tile.prototype.addTileLayer = function(layerobj) {
        var layer;
        layer = layerobj.layer;
        if (this.layers[layer] != null) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = layerobj;
        this.sortLayers();
        layerobj.attachToTile(this);
        return layerobj;
      };

      Tile.prototype.getLayers = function() {
        return this.layers.slice();
      };

      Tile.prototype.removeLayer = function(layer) {
        if (this.layers[layer] != null) {
          this.layers.splice(layer, 1);
          return this.sortLayers();
        }
      };

      Tile.prototype.init = function(meta) {
        Tile.__super__.init.call(this, meta);
        return this;
      };

      Tile.prototype.sortLayers = function() {
        return this.layers.sort(function(a, b) {
          if ((a == null) || (b == null)) {
            return 0;
          }
          return a.layer - b.layer;
        });
      };

      Tile.prototype.destroyMesh = function() {
        this._mesh = null;
        Tile.__super__.destroyMesh.call(this);
      };

      return Tile;

    })(Shape);
    return Tile;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tilelayer',["shape"], function(Shape) {
    var TileLayer;
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.setSprite(Hal.asm.getSprite(meta.sprite));
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
        this.h = 0;
        this.attr("group", meta.group);
      }

      TileLayer.prototype.attachToTile = function(tile) {
        this.tile = tile;
        return this.trigger("PLACED_ON_TILE");
      };

      TileLayer.prototype.init = function(meta) {
        return TileLayer.__super__.init.call(this, meta);
      };

      TileLayer.prototype.initListeners = function() {
        TileLayer.__super__.initListeners.call(this);
        this.on("SELECTED", function() {
          return console.log("I'm selected: " + (this.toString()));
        });
        return this.on("DESELECTED", function() {
          return console.log("I'm deselected: " + (this.toString()));
        });
      };

      TileLayer.prototype.destroy = function() {
        TileLayer.__super__.destroy.call(this);
        if (this.tile != null) {
          this.tile.removeLayer(this.layer);
        }
        return delete this.tile;
      };

      TileLayer.prototype.toString = function() {
        return "" + this.tile.row + ", " + this.tile.col;
      };

      return TileLayer;

    })(Shape);
    return TileLayer;
  });

}).call(this);

(function() {
  "use strict";
  define('tilemanager',["tile", "tilelayer"], function(Tile, TileLayer) {
    var TileManager;
    TileManager = (function() {
      function TileManager(map, tileList) {
        var _this = this;
        this.map = map;
        if (tileList == null) {
          tileList = "";
        }
        this.tile_layer_map = {};
        this.tile_name_map = {};
        this.tile_id_map = {};
        this._id = 0;
        this.max_layers = this.map.max_layers;
        Hal.on("TILE_MNGR_NEW_TILE", function(tile) {
          return _this.add(tile);
        });
        Hal.on("TILE_MNGR_LOAD_TILES", function(tiles) {
          return _this.load(tiles);
        });
      }

      TileManager.prototype.loadFromList = function(list) {
        var tiles,
          _this = this;
        if (list == null) {
          list = "assets/TilesList.list";
        }
        Ajax.get("assets/amjad/TilesList.json", function(tiles) {});
        llogd("TileManager loaded tiles.");
        tiles = JSON.parse(tiles);
        return this.load(tiles);
      };

      TileManager.prototype.load = function(tiles) {
        var i, t;
        llogd("Loading tiles...");
        for (i in tiles) {
          t = tiles[i];
          this.add(t);
        }
        return this.map.trigger("TILE_MANAGER_LOADED");
      };

      TileManager.prototype.add = function(tile) {
        this.tile_name_map[tile.name] = tile;
        this.tile_id_map[tile.id] = tile;
        if (this.tile_layer_map[tile.layer] == null) {
          this.tile_layer_map[tile.layer] = {};
        }
        return this.tile_layer_map[tile.layer][tile.name] = tile;
      };

      TileManager.prototype.getAllByLayer = function(layer) {
        return this.tile_layer_map[layer];
      };

      TileManager.prototype.findByName = function(name) {
        var t;
        t = this.tile_name_map[name];
        if (t == null) {
          llogw("No tile with name: " + name);
        }
        return t;
      };

      TileManager.prototype.findById = function(id) {
        var t;
        t = this.tile_id_map[id];
        if (t == null) {
          llogw("No tile with id: " + id);
        }
        return t;
      };

      TileManager.prototype.removeByName = function(name) {
        var t;
        t = this.tile_name_map[name];
        delete this.tile_layer_map[t.layer][t.name];
        delete this.tile_name_map[t.name];
        delete this.tile_id_map[t.id];
        return t = null;
      };

      TileManager.prototype.removeById = function(id) {
        var t;
        t = this.tile_id_map[id];
        delete this.tile_layer_map[t.layer][t.name];
        delete this.tile_id_map[t.id];
        delete this.tile_name_map[t.name];
        return t = null;
      };

      TileManager.prototype.newTileLayer = function(meta) {
        return new TileLayer(meta);
      };

      TileManager.prototype.newTile = function(meta) {
        var p, tile, _i, _ref;
        tile = new Tile(meta);
        for (p = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; p = 0 <= _ref ? ++_i : --_i) {
          tile.layers.push(null);
        }
        return tile;
      };

      TileManager.prototype.addTileLayerMetaByLayerId = function(row, col, layer_id, offset_x, offset_y) {
        var meta;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        meta = this.findById(layer_id);
        return this.addTileLayerMeta(row, col, meta, offset_x, offset_y);
      };

      TileManager.prototype.addTileLayerInstance = function(row, col, tilelayerobj, override) {
        var ctx, layermeta, off_x, off_y, tile, x, y;
        tile = this.map.getTile(row, col);
        if (tile == null) {
          lloge("No tile at " + row + ":" + col + "!!!");
          return;
        }
        layermeta = tilelayerobj.meta;
        if (layermeta == null) {
          lloge("No layermeta!!!");
          return;
        }
        if (tile.containsLayer(layermeta) && !override) {
          llogw("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if (layermeta.layer > this.max_layers) {
          lloge("You can't have more than " + this.max_layers + " layers");
          return;
        }
        x = (tile.col / 2) * this.map.tilew;
        y = (tile.row + ((tile.col % 2) / 2)) * this.map.tileh;
        tile.addTileLayer(tilelayerobj);
        off_x = tile.sprite.w * 0.5 - this.map.tilew2;
        off_y = tile.sprite.h * 0.5 - this.map.tileh2;
        tilelayerobj.attr("h", off_y);
        tilelayerobj.setPosition(x, y - off_y);
        ctx = this.map.renderer.getLayerContext(tilelayerobj.layer);
        this.map.addEntityToQuadSpace(tilelayerobj, ctx);
        tilelayerobj.trigger("ON_MAP");
        return tile;
      };

      TileManager.prototype.addTileLayerMeta = function(row, col, layermeta, offset_x, offset_y) {
        var ctx, layerobj, off_x, off_y, tile, x, y;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        tile = this.map.getTile(row, col);
        if (tile == null) {
          lloge("No holder!!!");
          return;
        }
        if (layermeta == null) {
          lloge("No layermeta!!!");
          return;
        }
        if (tile.containsLayer(layermeta)) {
          llogw("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if (layermeta.layer > this.max_layers) {
          lloge("You can't have more than " + this.max_layers + " layers");
          return;
        }
        x = (tile.col / 2) * this.map.tilew;
        y = (tile.row + ((tile.col % 2) / 2)) * this.map.tileh;
        layerobj = this.newTileLayer(layermeta);
        tile.addTileLayer(layerobj);
        off_x = layerobj.sprite.w * 0.5 - this.map.tilew2;
        off_y = layerobj.sprite.h * 0.5 - this.map.tileh2;
        layerobj.attr("h", off_y);
        layerobj.setPosition(x, y - off_y);
        ctx = this.map.renderer.getLayerContext(layerobj.layer);
        this.map.addEntityToQuadSpace(layerobj, ctx);
        layerobj.trigger("ON_MAP");
        return layerobj;
      };

      TileManager.prototype.loadTileLayerById = function(tile, id) {
        return this.addTileLayerMetaByLayerId(tile.row, tile.col, id);
      };

      return TileManager;

    })();
    return TileManager;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('isometricscene',["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], function(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) {
    var IsometricScene;
    IsometricScene = (function(_super) {
      __extends(IsometricScene, _super);

      function IsometricScene(meta) {
        var hittest, i, j, _i, _len, _ref;
        IsometricScene.__super__.constructor.call(this, meta);
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.mpos = Vec2.from(0, 0);
        this.world_pos = Vec2.from(0, 0);
        this.max_rows = this.nrows - 1;
        this.max_cols = this.ncols - 1;
        this.selected_tile_x = 0;
        this.selected_tile_y = this.tileh2;
        this.selected_tile = null;
        this.selected_tile_sprite = null;
        this.tiles_found = [];
        /* Isometric shape*/

        this.iso_shape = [Vec2.from(-this.tilew2, 0), Vec2.from(0, this.tileh2), Vec2.from(this.tilew2, 0), Vec2.from(0, -this.tileh2)];
        this.info = {
          row: "Row: ",
          col: "Col: ",
          tilename: "Tile: ",
          mouse_position: "Mouse position: ",
          tile_under_mouse: "Tile position: ",
          world_position: "Mouse world position: "
        };
        /* Create iso transparency mask*/

        this.mask = Hal.asm.getSprite("test/tilemask_128x64");
        hittest = Hal.dom.createCanvas(this.tilew, this.tileh).getContext("2d");
        hittest.drawImage(this.mask.img, 0, 0);
        this.mask_data = hittest.getImageData(0, 0, this.tilew, this.tileh).data;
        _ref = this.mask_data;
        for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
          i = _ref[j];
          this.mask_data[j] = i < 120;
        }
        this.mouse_over_sprites = {
          "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64"),
          "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")
        };
        this.world_bounds = [0, 0, (this.ncols - 1) * this.tilew2, (this.nrows - 0.5) * this.tileh];
        this.section_dim = [Math.round(this.world_bounds[2] / 3), Math.round((this.nrows * this.tileh) / 3)];
        this.cap = Math.round(this.section_dim[0] / this.tilew2) * Math.round(this.section_dim[1] / this.tileh);
        console.error(this.cap);
        this.sections = {
          "center": new QuadTree([this.section_dim[0], this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "ne": new QuadTree([0, 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "n": new QuadTree([this.section_dim[0], 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "nw": new QuadTree([2 * this.section_dim[0], 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "e": new QuadTree([0, this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "w": new QuadTree([2 * this.section_dim[0], this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "se": new QuadTree([0, 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "s": new QuadTree([this.section_dim[0], 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "sw": new QuadTree([2 * this.section_dim[0], 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false)
        };
        this.sections["center"].divide();
        this.sections["ne"].divide();
        this.sections["n"].divide();
        this.sections["nw"].divide();
        this.sections["e"].divide();
        this.sections["w"].divide();
        this.sections["se"].divide();
        this.sections["s"].divide();
        this.sections["sw"].divide();
      }

      IsometricScene.prototype.drawStat = function() {
        IsometricScene.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          Hal.glass.ctx.fillText(this.info.mouse_position + Vec2.str(this.mpos), 0, 130);
          Hal.glass.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 145);
          Hal.glass.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 160);
          Hal.glass.ctx.fillText(this.info.tile_under_mouse + Vec2.str(this.tile_under_mouse.position), 0, 175);
          return Hal.glass.ctx.fillText(this.info.world_position + Vec2.str(this.world_pos), 0, 190);
        }
      };

      IsometricScene.prototype.drawQuadTree = function(quadtree) {
        this.drawQuadSections(this.sections["center"], "red");
        this.drawQuadSections(this.sections["ne"], "gold");
        this.drawQuadSections(this.sections["n"], "green");
        this.drawQuadSections(this.sections["nw"], "blue");
        this.drawQuadSections(this.sections["e"], "cyan");
        this.drawQuadSections(this.sections["w"], "orange");
        this.drawQuadSections(this.sections["se"], "yellow");
        this.drawQuadSections(this.sections["s"], "violet");
        return this.drawQuadSections(this.sections["sw"], "brown");
      };

      IsometricScene.prototype.drawQuadSections = function(quadtree, color) {
        if (this.paused) {
          return;
        }
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = color;
        if (quadtree.nw != null) {
          this.drawQuadSections(quadtree.nw);
          this.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3]);
          this.ctx.fillText("" + quadtree.nw.id, quadtree.nw.bounds[0] + quadtree.nw.bounds[2] * 0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3] * 0.5);
        }
        if (quadtree.ne != null) {
          this.drawQuadSections(quadtree.ne);
          this.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3]);
          this.ctx.fillText("" + quadtree.ne.id, quadtree.ne.bounds[0] + quadtree.ne.bounds[2] * 0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3] * 0.5);
        }
        if (quadtree.sw != null) {
          this.drawQuadSections(quadtree.sw);
          this.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3]);
          this.ctx.fillText("" + quadtree.sw.id, quadtree.sw.bounds[0] + quadtree.sw.bounds[2] * 0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3] * 0.5);
        }
        if (quadtree.se != null) {
          this.drawQuadSections(quadtree.se);
          this.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3]);
          return this.ctx.fillText("" + quadtree.se.id, quadtree.se.bounds[0] + quadtree.se.bounds[2] * 0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3] * 0.5);
        }
      };

      IsometricScene.prototype.parseMeta = function(meta) {
        IsometricScene.__super__.parseMeta.call(this, meta);
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = +meta.rows;
        this.ncols = +meta.cols;
        return this.max_layers = meta.max_layers || 5;
      };

      IsometricScene.prototype.init = function() {
        IsometricScene.__super__.init.call(this);
        /* @SUPPORTED_EDITOR_MODES*/

        this.clicked_layer = null;
        this.tile_under_mouse = null;
        return this.initMap();
      };

      IsometricScene.prototype.maxRows = function() {
        return Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.scale[0])) + 4));
      };

      IsometricScene.prototype.maxCols = function() {
        return Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.scale[1])) + 4));
      };

      IsometricScene.prototype.toOrtho = function(pos) {
        var coldiv, off_x, off_y, rowdiv, transp;
        coldiv = (pos[0] + this.tilew2) * this.tilew2prop;
        rowdiv = (pos[1] + this.tileh2) * this.tileh2prop;
        off_x = ~~((pos[0] + this.tilew2) - ~~(coldiv * 0.5) * this.tilew);
        off_y = ~~((pos[1] + this.tileh2) - ~~(rowdiv * 0.5) * this.tileh);
        transp = this.mask_data[(off_x + this.tilew * off_y) * 4 + 3];
        return [coldiv - (transp ^ !(coldiv & 1)), (rowdiv - (transp ^ !(rowdiv & 1))) / 2];
      };

      IsometricScene.prototype.getNeighbours = function(tile) {
        var dir, n, out, _i, _len, _ref;
        out = [];
        if (tile == null) {
          return out;
        }
        _ref = Object.keys(tile.direction);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          dir = _ref[_i];
          n = this.getTile(tile.row, tile.col, tile.direction[dir]);
          if (n != null) {
            out.push(n);
          }
        }
        return out;
      };

      IsometricScene.prototype.findInDirectionOf = function(tile, dirstr, len) {
        var dir, fromc, fromr, out, t;
        if (tile == null) {
          return [];
        }
        out = [];
        out.push(tile);
        fromr = tile.row;
        fromc = tile.col;
        dir = tile.direction[dirstr];
        while (len > 0) {
          t = this.getTile(fromr, fromc, dir);
          if (t != null) {
            out.push(t);
            fromr = t.row;
            fromc = t.col;
            dir = t.direction[dirstr];
          } else {
            break;
          }
          len--;
        }
        return out;
      };

      IsometricScene.prototype.isAdjacentTo = function(cellA, cellB) {
        var in_neighs, neighs;
        if (cellB == null) {
          return false;
        }
        neighs = this.getNeighbours(cellB);
        in_neighs = neighs.some(function(el) {
          return el.row === cellA.row && el.col === cellA.col;
        });
        return in_neighs;
      };

      IsometricScene.prototype.getTile = function(row, col, dir) {
        if (dir == null) {
          dir = [0, 0];
        }
        return this.map[(col + dir[1]) + (row + dir[0]) * this.ncols];
      };

      IsometricScene.prototype.getTileAt = function(pos) {
        var coord;
        coord = this.toOrtho(pos);
        if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= this.nrows || coord[0] >= this.ncols) {
          return null;
        }
        return this.map[Math.floor(coord[0]) + Math.floor(coord[1]) * this.ncols];
      };

      IsometricScene.prototype.initMapTiles = function() {
        var i, j, k, t, t1, t2, x, y, z, z_indices, _i, _j, _k, _ref, _ref1, _ref2;
        this.pause();
        this.section_center = [];
        z_indices = [];
        for (z = _i = 1, _ref = this.max_layers; 1 <= _ref ? _i <= _ref : _i >= _ref; z = 1 <= _ref ? ++_i : --_i) {
          z_indices.push(z);
        }
        this.renderer.createLayers(z_indices);
        this.map = new Array(this.nrows * this.ncols);
        k = 0;
        t1 = performance.now();
        for (i = _j = 0, _ref1 = this.nrows - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          for (j = _k = 0, _ref2 = this.ncols - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; j = 0 <= _ref2 ? ++_k : --_k) {
            x = (j / 2) * this.tilew;
            y = (i + ((j % 2) / 2)) * this.tileh;
            t = this.tm.newTile({
              "shape": this.iso_shape,
              "x": x,
              "y": y,
              "row": i,
              "col": j
            });
            this.map[k] = this.addEntity(t);
            this.sections["center"].insert(this.map[k]);
            this.sections["ne"].insert(this.map[k]);
            this.sections["n"].insert(this.map[k]);
            this.sections["nw"].insert(this.map[k]);
            this.sections["e"].insert(this.map[k]);
            this.sections["w"].insert(this.map[k]);
            this.sections["se"].insert(this.map[k]);
            this.sections["s"].insert(this.map[k]);
            this.sections["sw"].insert(this.map[k]);
            k++;
          }
        }
        t2 = performance.now() - t1;
        llogd("Initializing sections took: " + t2 + " ms");
        this.trigger("MAP_TILES_INITIALIZED");
        return this.resume();
      };

      IsometricScene.prototype.initMap = function() {
        this.clicked_layer = null;
        this.on("TILE_MANAGER_LOADED", function() {
          return this.loadMap();
        });
        return this.tm = new TileManager(this);
      };

      IsometricScene.prototype.saveBitmapMap = function() {
        var h, layer, layer_ind, map_c, map_r, meta, meta_id, out, t, t1, t2, t_col, t_row, tiles, _i, _j, _len, _ref;
        this.pause();
        t1 = performance.now();
        out = [];
        tiles = this.map.slice();
        map_r = this.nrows << 32;
        map_c = this.ncols << 16;
        out.push(map_r | map_c);
        for (_i = 0, _len = tiles.length; _i < _len; _i++) {
          t = tiles[_i];
          t_row = t.row << 32;
          t_col = t.col << 16;
          out.push(t_row | t_col);
          for (layer_ind = _j = 0, _ref = this.max_layers; 0 <= _ref ? _j < _ref : _j > _ref; layer_ind = 0 <= _ref ? ++_j : --_j) {
            layer = t.layers[layer_ind];
            if (layer == null) {
              out.push(-1);
              continue;
            }
            meta = this.tm.findByName(layer.name);
            meta_id = meta.id << 32;
            h = layer.h << 16;
            out.push(h | meta_id);
          }
        }
        t2 = performance.now() - t1;
        this.resume();
        console.info("Saving took: " + t2 + " ms");
        this.trigger("SECTION_SAVED", out);
        return out;
      };

      IsometricScene.prototype.loadBitmapMap = function(bitmap) {
        var layer, layer_height, layer_id, layer_qword, map_cols, map_rows, mask, qword, t1, t2, tile, tile_col, tile_qword, tile_row, total, _i, _ref;
        bitmap = bitmap.slice();
        t1 = performance.now();
        this.pause();
        mask = 0xFFFF;
        qword = bitmap.shift();
        map_rows = (qword >> 32) & mask;
        map_cols = (qword >> 16) & mask;
        total = map_rows * map_cols;
        if (total > this.nrows * this.ncols) {
          console.error("Can't load this bitmap, it's too big");
          this.resume();
          return false;
        }
        this.nrows = map_rows;
        this.ncols = map_cols;
        while ((tile_qword = bitmap.shift()) != null) {
          tile_row = (tile_qword >> 32) & mask;
          tile_col = (tile_qword >> 16) & mask;
          tile = this.getTile(tile_row, tile_col);
          if (tile == null) {
            console.warn("Oh snap, something's wrong");
            console.warn("Trying to recover");
            continue;
          }
          for (layer = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; layer = 0 <= _ref ? ++_i : --_i) {
            layer_qword = bitmap.shift();
            if (layer_qword === -1) {
              continue;
            }
            layer_id = (layer_qword >> 32) & mask;
            layer_height = (layer_qword >> 16) & mask;
            this.tm.addTileLayerMetaByLayerId(tile_row, tile_col, layer_id, 0, layer_height);
          }
        }
        t2 = performance.now() - t1;
        this.resume();
        console.info("Loading took: " + t2 + " ms");
        this.trigger("MAP_LOADED");
        return true;
      };

      IsometricScene.prototype.loadMap = function() {
        this.setWorldBounds(this.world_bounds);
        return this.initMapTiles();
      };

      IsometricScene.prototype.processLeftClick = function() {
        var layer, t1, t2, transp, _i, _len, _ref;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        t1 = performance.now();
        this.tiles_found = [];
        this.quadtree.findEntitiesInRectangle(this.search_range, this._transform, this.tiles_found);
        _ref = this.tiles_found;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          transp = Geometry.transformPoint(this.world_pos[0], this.world_pos[1], layer.inverseTransform());
          if (Hal.im.isTransparent(layer.sprite.img, transp[0] + layer.sprite.w2, transp[1] + layer.sprite.h2)) {
            Vec2.release(transp);
            continue;
          }
          Vec2.release(transp);
          if (this.clicked_layer == null) {
            this.clicked_layer = layer;
          } else {
            if ((layer.tile.col === this.clicked_layer.tile.col) && (layer.tile.row === this.clicked_layer.tile.row)) {
              if (layer.layer > this.clicked_layer.layer) {
                this.clicked_layer = layer;
              }
            } else if (layer.tile.row === this.clicked_layer.tile.row) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if (layer.tile.col === this.clicked_layer.tile.col) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if ((layer.tile.col !== this.clicked_layer.tile.col) && (layer.tile.row !== this.clicked_layer.tile.row)) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            }
          }
        }
        t2 = performance.now() - t1;
        llogd("Searching took: " + (t2.toFixed(2)) + " ms");
        llogd("Tiles found: " + this.tiles_found.length);
        if (this.clicked_layer != null) {
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          return this.clicked_layer.trigger("SELECTED");
        }
      };

      IsometricScene.prototype.destroy = function() {
        /* @todo @tm.destroy()*/

        Vec2.release(this.mpos);
        Vec2.release(this.world_pos);
        Hal.removeTrigger("MOUSE_MOVE", this.mouse_moved_listener);
        Hal.removeTrigger("LEFT_CLICK", this.left_click_listener);
        return IsometricScene.__super__.destroy.call(this);
      };

      IsometricScene.prototype.initListeners = function() {
        var _this = this;
        IsometricScene.__super__.initListeners.call(this);
        this.mouse_moved_listener = Hal.on("MOUSE_MOVE", function(pos) {
          Vec2.copy(_this.mpos, pos);
          if (_this.world_pos != null) {
            Vec2.release(_this.world_pos);
          }
          _this.world_pos = _this.screenToWorld(pos);
          return _this.tile_under_mouse = _this.getTileAt(_this.world_pos);
        });
        Hal.on("SAVE_MAP", function() {
          return _this.saveBitmapMap();
        });
      };

      IsometricScene.prototype.saveMap = function() {};

      return IsometricScene;

    })(Scene);
    return IsometricScene;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('line',["vec2", "matrix3", "shape", "geometry", "mathutil"], function(Vec2, Matrix3, Shape, Geometry, MathUtil) {
    var Line;
    Line = (function(_super) {
      __extends(Line, _super);

      function Line(x1, y1) {
        Line.__super__.constructor.call(this);
        this.setShape([Vec2.from(0, 0), Vec2.from(x1, y1)]);
        return this;
      }

      return Line;

    })(Shape);
    Line.prototype.setShape = function(points) {
      if (points.length > 2) {
        lloge("This is a line, not a polygon");
        this.destroyShape();
        return;
      }
      Line.__super__.setShape.call(this, points);
      this.setOrigin(Number.MIN_VALUE, Number.MIN_VALUE);
      return this;
    };
    Line.prototype.angleBetween = function(l1) {
      var p;
      p = Vec2.transformMat3(null, l1._mesh[1], this._transform);
      return Geometry.angleBetweenLines(p, this._mesh[1]);
    };
    return Line;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('halal',["logger", "eventdispatcher", "scene", "dommanager", "renderer", "geometry", "vec2", "matrix3", "deferred", "deferredcounter", "domeventmanager", "assetmanager", "imgutils", "entity", "spriteentity", "isometricscene", "ajax", "shape", "line", "mathutil", "bbresolvers", "drawable"], function(Logger, EventDispatcher, Scene, DOMManager, Renderer, Geometry, Vec2, Matrix3, Deferred, DeferredCounter, DOMEventManager, AssetManager, ImgUtils, Entity, SpriteEntity, IsometricScene, Ajax, Shape, Line, MathUtil, BBResolvers, Drawable) {
    /*
        A shim (sort of) to support RAF execution
    */

    var Halal, cur_fps_time, cur_time, delta, draw_info, focused_scene, fps_cap, fps_counter, fps_trigger_time, fstep, last_frame_id, paused, prev_time, rafLoop;
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
    last_frame_id = 0;
    prev_time = 0;
    fps_cap = 30;
    fstep = 1 / fps_cap;
    draw_info = null;
    paused = true;
    focused_scene = null;
    rafLoop = function() {
      prev_time = cur_time;
      cur_time = performance.now();
      delta = (cur_time - prev_time) * 0.001;
      cur_fps_time += delta;
      delta = Math.min(delta, fstep);
      Hal.trigger("ENTER_FRAME", delta);
      if ((focused_scene != null) && !focused_scene.paused) {
        focused_scene.update(delta);
        focused_scene.draw(delta);
      }
      if (cur_fps_time >= fps_trigger_time) {
        Hal.fps = fps_counter;
        cur_fps_time = 0;
        fps_counter = 0;
        Hal.trigger("FPS_UPDATE", Hal.fps);
      }
      Hal.trigger("EXIT_FRAME", delta);
      last_frame_id = requestAnimFrame(rafLoop);
      return fps_counter++;
    };
    Halal = (function(_super) {
      __extends(Halal, _super);

      function Halal() {
        Halal.__super__.constructor.call(this);
        this.dom = new DOMManager(this);
        this.glass_z_index = 100;
        this.id = 0;
        this.debug_mode = false;
        this.pressed_keys = [];
        this.scenes = [];
        this.fps = 0;
        this.glass = null;
        llogd("Engine constructed");
      }

      return Halal;

    })(EventDispatcher);
    Halal.prototype.setFocusedScene = function(scene) {
      return focused_scene = scene;
    };
    Halal.prototype.addScene = function(scene, to_focus) {
      if (to_focus == null) {
        to_focus = true;
      }
      if (this.scenes.length === 0 && (this.glass == null)) {
        this.start();
      }
      if (!(scene instanceof Scene)) {
        lloge("Not a Scene instance");
        return null;
      }
      if (!scene.bounds) {
        lloge("Bounds not set on scene " + scene.name);
        return null;
      }
      if (!scene.name) {
        llogw("Name for scene wasn't provided");
        scene.name = "#scene" + "_" + scene.id;
      }
      scene.init();
      this.scenes.unshift(scene);
      llogd("Added scene: " + scene.name);
      Hal.trigger("SCENE_ADDED", scene);
      if (to_focus) {
        focused_scene = scene;
      }
      return scene;
    };
    Halal.prototype.pause = function() {
      paused = true;
      cancelAnimationFrame(last_frame_id);
      return this.trigger("ENGINE_PAUSED");
    };
    Halal.prototype.resume = function() {
      paused = false;
      rafLoop();
      return this.trigger("ENGINE_RESUMED");
    };
    Halal.prototype.viewportBounds = function() {
      return [0, 0, this.dom.area.width, this.dom.area.height];
    };
    Halal.prototype.supports = function(feature) {
      return this.trigger("SUPPORTS_" + feature);
    };
    Halal.prototype.init = function() {
      this.evm = new DOMEventManager();
      this.glass = new Renderer(this.viewportBounds(), null, this.glass_z_index, true);
      this.glass.ctx.font = "9pt monospace";
      this.glass.ctx.fillStyle = "black";
      this.on("SCENE_REQ_DESTROY", function(scene) {
        var ind;
        ind = this.scenes.indexOf(scene);
        if (ind === -1) {
          lloge("No such scene: " + scene.name);
        }
        this.scenes.splice(ind, 1);
        if (focused_scene === scene) {
          focused_scene = null;
        }
        if (this.scenes.length === 0) {
          this.dom.removeCanvasLayer(this.glass_z_index);
          this.pause();
        }
        llogi("Destroyed scene: " + scene.name);
        return scene = null;
      });
      return llogd("Engine initialized");
    };
    Halal.prototype.start = function() {
      this.init();
      paused = false;
      this.trigger("ENGINE_STARTED");
      llogd("Engine started");
      return rafLoop();
    };
    Halal.prototype.isPaused = function() {
      return paused;
    };
    Halal.prototype.debug = function(debug_mode) {
      this.debug_mode = debug_mode;
      return Hal.trigger("DEBUG_MODE", this.debug_mode);
    };
    Halal.prototype.ID = function() {
      return ++this.id;
    };
    Halal.prototype.tween = function(obj, property, t, from, to, repeat, arr_index) {
      var $, accul, defer, speed, val;
      if (repeat == null) {
        repeat = 1;
      }
      defer = new Deferred();
      t *= 0.001;
      accul = 0;
      speed = (to - from) / t;
      val = from;
      Hal.on("ENTER_FRAME", $ = function(delta) {
        accul += delta;
        val += speed * delta;
        obj.attr(property, val, arr_index);
        accul = Math.min(accul, t);
        if (t === accul) {
          repeat--;
          obj.attr(property, to, arr_index);
          if (repeat === 0) {
            defer.resolve(obj, $);
            Hal.removeTrigger("ENTER_FRAME", $);
          } else {
            accul = 0;
            return val = from;
          }
        }
      });
      return [defer.promise(), $];
    };
    Halal.prototype.tweenF = function(t, func, from, to, repeat) {
      var $, accul, speed, val;
      if (repeat == null) {
        repeat = 1;
      }
      t *= 0.001;
      accul = 0;
      speed = (to - from) / t;
      val = from;
      Hal.on("ENTER_FRAME", $ = function(delta) {
        accul += delta;
        val += speed * delta;
        func(val, delta);
        accul = Math.min(accul, t);
        if (t === accul) {
          repeat--;
          func(to, delta);
          if (repeat === 0) {
            Hal.removeTrigger("ENTER_FRAME", $);
          } else {
            accul = 0;
            return val = from;
          }
        }
      });
    };
    Halal.prototype.fadeInViewport = function(t) {
      return this.tweenF(t, (function(val) {
        return Hal.dom.viewport.style["opacity"] = val;
      }), 0, 1);
    };
    Halal.prototype.fadeOutViewport = function(t) {
      return this.tweenF(t, (function(val) {
        return Hal.dom.viewport.style["opacity"] = val;
      }), 1, 0);
    };
    /*
        @todo kontekst bi valjalo prosledjivati, mozda window ne bude window
        i undefined ne bude undefined
    */

    Halal.prototype.math = MathUtil;
    Halal.prototype.geometry = Geometry;
    Halal.prototype.asm = new AssetManager();
    Halal.prototype.im = new ImgUtils();
    /* classes*/

    Halal.prototype.Line = Line;
    Halal.prototype.Vec2 = Vec2;
    Halal.prototype.Matrix3 = Matrix3;
    Halal.prototype.Shape = Shape;
    Halal.prototype.Scene = Scene;
    Halal.prototype.Ajax = Ajax;
    Halal.prototype.BBResolvers = BBResolvers;
    Halal.prototype.DrawableStates = Drawable.DrawableStates;
    Halal.prototype.IsometricScene = IsometricScene;
    Halal.prototype.Keys = {
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
      SPACE: 32,
      LEFT: 37,
      RIGHT: 39,
      UP: 38,
      DOWN: 40,
      F: 70
    };
    return window.Hal = new Halal();
  });

}).call(this);
