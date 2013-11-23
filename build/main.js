
/*! loglevel - v0.5.0 - https://github.com/pimterry/loglevel - (c) 2013 Tim Perry - licensed MIT */
;(function (undefined) {
    var undefinedType = "undefined";

    (function (name, definition) {
        if (typeof module !== 'undefined') {
            module.exports = definition();
        } else if (typeof define === 'function' && typeof define.amd === 'object') {
            define('loglevel',definition);
        } else {
            this[name] = definition();
        }
    }('log', function () {
        var self = {};
        var noop = function() {};

        function realMethod(methodName) {
            if (typeof console === undefinedType) {
                return noop;
            } else if (console[methodName] === undefined) {
                if (console.log !== undefined) {
                    return boundToConsole(console, 'log');
                } else {
                    return noop;
                }
            } else {
                return boundToConsole(console, methodName);
            }
        }

        function boundToConsole(console, methodName) {
            var method = console[methodName];
            if (method.bind === undefined) {
                if (Function.prototype.bind === undefined) {
                    return functionBindingWrapper(method, console);
                } else {
                    try {
                        return Function.prototype.bind.call(console[methodName], console);
                    } catch (e) {
                        // In IE8 + Modernizr, the bind shim will reject the above, so we fall back to wrapping
                        return functionBindingWrapper(method, console);
                    }
                }
            } else {
                return console[methodName].bind(console);
            }
        }

        function functionBindingWrapper(f, context) {
            return function() {
                Function.prototype.apply.apply(f, [context, arguments]);
            };
        }

        var logMethods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error"
        ];

        function replaceLoggingMethods(methodFactory) {
            for (var ii = 0; ii < logMethods.length; ii++) {
                self[logMethods[ii]] = methodFactory(logMethods[ii]);
            }
        }

        function cookiesAvailable() {
            return (typeof window !== undefinedType &&
                    window.document !== undefined &&
                    window.document.cookie !== undefined);
        }

        function localStorageAvailable() {
            try {
                return (typeof window !== undefinedType &&
                        window.localStorage !== undefined);
            } catch (e) {
                return false;
            }
        }

        function persistLevelIfPossible(levelNum) {
            var levelName;

            for (var key in self.levels) {
                if (self.levels.hasOwnProperty(key) && self.levels[key] === levelNum) {
                    levelName = key;
                    break;
                }
            }

            if (localStorageAvailable()) {
                window.localStorage['loglevel'] = levelName;
            } else if (cookiesAvailable()) {
                window.document.cookie = "loglevel=" + levelName + ";";
            } else {
                return;
            }
        }

        var cookieRegex = /loglevel=([^;]+)/;

        function loadPersistedLevel() {
            var storedLevel;

            if (localStorageAvailable()) {
                storedLevel = window.localStorage['loglevel'];
            }

            if (!storedLevel && cookiesAvailable()) {
                var cookieMatch = cookieRegex.exec(window.document.cookie) || [];
                storedLevel = cookieMatch[1];
            }

            self.setLevel(self.levels[storedLevel] || self.levels.WARN);
        }

        /*
         *
         * Public API
         *
         */

        self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
            "ERROR": 4, "SILENT": 5};

        self.setLevel = function (level) {
            if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
                persistLevelIfPossible(level);

                if (level === self.levels.SILENT) {
                    replaceLoggingMethods(function () {
                        return noop;
                    });
                    return;
                } else if (typeof console === undefinedType) {
                    replaceLoggingMethods(function (methodName) {
                        return function () {
                            if (typeof console !== undefinedType) {
                                self.setLevel(level);
                                self[methodName].apply(self, arguments);
                            }
                        };
                    });
                    return "No console available for logging";
                } else {
                    replaceLoggingMethods(function (methodName) {
                        if (level <= self.levels[methodName.toUpperCase()]) {
                            return realMethod(methodName);
                        } else {
                            return noop;
                        }
                    });
                }
            } else if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
                self.setLevel(self.levels[level.toUpperCase()]);
            } else {
                throw "log.setLevel() called with invalid level: " + level;
            }
        };

        self.enableAll = function() {
            self.setLevel(self.levels.TRACE);
        };

        self.disableAll = function() {
            self.setLevel(self.levels.SILENT);
        };

        loadPersistedLevel();
        return self;
    }));
})();

(function() {
  "use strict";
  define('eventdispatcher',[], function() {
    var EventDispatcher;
    EventDispatcher = (function() {
      function EventDispatcher() {
        this.listeners = [];
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
    EventDispatcher.prototype.remove = function(type, clb) {
      var ind;
      if (this.listeners[type] != null) {
        ind = this.listeners[type].indexOf(clb);
        if (ind !== -1) {
          this.listeners[type].splice(ind, 1);
        }
        return clb = null;
      }
    };
    EventDispatcher.prototype.removeAll = function(type) {
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
              _results1.push(this.remove(key, list));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }
    };
    EventDispatcher.prototype.trigger = function(type, msg, target) {
      var clb, _i, _len, _ref, _results;
      if (target == null) {
        target = this;
      }
      if (!this.listeners[type]) {
        return;
      }
      _ref = this.listeners[type];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        clb = _ref[_i];
        if (clb != null) {
          _results.push(clb.call(target, msg, clb));
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

  define('deferred',[],function() {
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
    /* @todo izbaciti ovo*/

    window.Deferred = Deferred;
    return Deferred;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('halalentity',["eventdispatcher", "deferred"], function(EventDispatcher, Deferred) {
    var HalalEntity, Tweener;
    Tweener = (function() {
      function Tweener(obj) {
        this.obj = obj;
        this.num_tweens = 0;
        this.to_wait = 0;
        this.tween_chain = [];
        this.animating = false;
      }

      Tweener.prototype.tween = function(meta) {
        var promise,
          _this = this;
        this.num_tweens++;
        if (this.to_wait > 0) {
          this.tween_chain.push(meta);
          return this;
        }
        this.animating = true;
        promise = Hal.tween(this.obj, meta.attr, meta.duration, meta.from, meta.to, meta.repeat);
        promise.then(function() {
          _this.num_tweens--;
          if (_this.num_tweens === 0 && (_this.done_clb != null)) {
            _this.done_clb.call(_this.obj);
          }
          if (_this.to_wait > 0) {
            _this.to_wait--;
            _this.tween(_this.tween_chain.pop());
            _this.num_tweens--;
          }
          if (_this.num_tweens === 0 && _this.to_wait === 0) {
            return _this.animating = false;
          }
        });
        return this;
      };

      Tweener.prototype.wait = function(wait_clb) {
        this.wait_clb = wait_clb;
        this.to_wait++;
        return this;
      };

      Tweener.prototype.done = function(done_clb) {
        this.done_clb = done_clb;
      };

      return Tweener;

    })();
    return HalalEntity = (function(_super) {
      __extends(HalalEntity, _super);

      function HalalEntity() {
        HalalEntity.__super__.constructor.call(this);
        this.animating = false;
      }

      HalalEntity.prototype.attr = function(key, val) {
        if (arguments.length === 1) {
          if (typeof key === "string") {
            return this[key];
          }
          this.extend(key);
          return this.trigger("CHANGE", key);
        } else {
          this[key] = val;
          return this.trigger("CHANGE", [key, val]);
        }
      };

      HalalEntity.prototype.extend = function(obj) {
        var key, val;
        if (obj == null) {
          return this;
        }
        for (key in obj) {
          val = obj[key];
          if (this === val) {
            continue;
          }
          this[key] = val;
        }
        return this;
      };

      HalalEntity.prototype.tween = function(meta) {
        return new Tweener(this).tween(meta);
      };

      return HalalEntity;

    })(EventDispatcher);
  });

}).call(this);

(function() {
  "use strict";
  define('renderer',[], function() {
    var Renderer;
    Renderer = (function() {
      function Renderer(bounds, canvas, z) {
        this.bounds = bounds;
        if (canvas != null) {
          this.canvas = canvas;
        } else {
          this.canvas = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], z);
          Hal.dom.addCanvas(this.canvas, this.bounds[0], this.bounds[1], true);
        }
        this.ctx = this.canvas.getContext("2d");
      }

      return Renderer;

    })();
    Renderer.prototype.resize = function(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.prev_bnds = this.bounds.slice();
      this.bounds[2] = w;
      return this.bounds[3] = h;
    };
    Renderer.prototype.strokePolygon = function(points, style) {
      var p, _i, _len, _ref;
      this.ctx.strokeStyle = style;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);
      _ref = points.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        this.ctx.lineTo(p[0], p[1]);
      }
      this.ctx.closePath();
      return this.ctx.stroke();
    };
    Renderer.prototype.drawLine = function(x0, y0, x1, y1, style) {
      this.ctx.strokeStyle = style;
      this.ctx.beginPath();
      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.closePath();
      return this.ctx.stroke();
    };
    Renderer.prototype.strokeRect = function(pts, style) {
      this.ctx.strokeStyle = style;
      return this.ctx.strokeRect(pts[0], pts[1], pts[2], pts[3]);
    };
    Renderer.prototype.drawSprite = function(sprite, x, y) {
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      return this.ctx.drawImage(sprite.img, -sprite.w2 - x, -sprite.h2 - y);
    };
    return Renderer;
  });

}).call(this);

define(
    'vec2',[],function() {
        var Vec2 = {};

        Vec2.create = function() {
            var out = []; //or Int32Array
            out[0] = 0;
            out[1] = 0;
            return out;
        };

        Vec2.clone = function(a) {
            var out = [];
            out[0] = a[0];
            out[1] = a[1];
            return out;
        };

        Vec2.fromValues = function(x, y) {
            var out = [];
            out[0] = x;
            out[1] = y;
            return out;
        };

        Vec2.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            return out;
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

        Vec2.subtract = function(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            return out;
        };
        Vec2.sub = Vec2.subtract;

        Vec2.multiply = function(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            return out;
        };
        Vec2.mul = Vec2.multiply;

        Vec2.divide = function(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            return out;
        };
        Vec2.div = Vec2.divide;

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

        Vec2.scale = function(out, a, sc) {
            out[0] = a[0] * sc;
            out[1] = a[1] * sc;
            return out;
        };

        Vec2.scaleAndAdd = function(out, a, b, sc) {
            out[0] = a[0] + (b[0] * sc);
            out[1] = a[1] + (b[1] * sc);
            return out;
        };

        Vec2.distance = function(a, b) {
            var x = a[0] - b[0],
                y = a[1] - b[1];
            return Math.sqrt(x*x + y*y);
        };
        Vec2.dist = Vec2.distance;

        Vec2.sqDistance = function(a, b) {
            var x = a[0] - b[0],
                y = a[1] - b[1];
            return x*x + y*y;
        };
        Vec2.sqDist = Vec2.sqDistance;

        Vec2.length = function(a) {
            /*
             * Koliko bi ovo bilo brzo
             * kada ne bih kopirao vrednosti?
             */
            var x = a[0],
                y = a[1];
            return Math.sqrt(x*x + y*y);
        };
        Vec2.len = Vec2.length;

        Vec2.sqLength = function(a) {
            var x = a[0],
                y = a[1];
            return x*x + y*y;
        };
        Vec2.sqLen = Vec2.sqLength;

        Vec2.negate = function(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            return out;
        };

        Vec2.normalize = function(out, a) {
            var x = a[0],
                y = a[1];
            var len = x*x + y*y;
            if(len > 0) {
                len = 1 / Math.sqrt(len);
                out[0] = a[0] * len;
                out[1] = a[1] * len;
            }
            return out;
        };

        Vec2.dot = function(a, b) {
            return a[0]*b[0] + a[1]*b[1];
        };

        Vec2.perp = function(a) {
            return Vec2.fromValues(a[1], -a[0]);
        };

        Vec2.clerp = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            return out;
        };
        
        Vec2.cross = function(a, b) {
            var z = a[0] * b[1] - a[1] * b[0];
            out[0] = out[1] = 0;
            out[2] = z;
            return out;
        };

        Vec2.lerp = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            return out;
        };

        Vec2.lerpInt = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = Math.floor(ax + t * (b[0] - ax));
            out[1] = Math.floor(ay + t * (b[1] - ay));
            return out;
        };

        Vec2.random = function(out, sc) {
            sc = sc || 1;
            var r = Math.random() * 2 * Math.PI;
            out[0] = Math.cos(r) * sc;
            out[1] = Math.sin(r) * sc;
            return out;
        };

        Vec2.transformMat2 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y;
            out[1] = m[1] * x + m[3] * y;
            return out;
        };

        Vec2.transformMat2d = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y + m[4];
            out[1] = m[1] * x + m[3] * y + m[5];
            return out;
        };

        /*
        [x] * [m11 m12 m13]
        [y]   [m21 m22 m23]
        [1]   [m31 m32 m33] = 
        x*m[0] + y*m[3] + z*m[6];
        x*m[1] + y*m[4] + z*m[7];
        x*m[2] + y*m[5] + z*m[8];
        */
        Vec2.transformMat3 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = x*m[0] + y*m[3] + m[6];
            out[1] = x*m[1] + y*m[4] + m[7];
            return out;
        };

        /*
        treca komponenta je implicitno 0
        [x] * [m11 m12 m13 m14]
        [y]   [m21 m22 m23 m24]
        [0]   [m31 m32 m33 m34]
        [1]   [m41 m42 m44 m44] = 
        x*m[0] + y*m[4] + z*m[8] + z'*m[12];
        x*m[1] + y*m[5] + z*m[9] + z'*m[13];
        x*m[2] + y*m[6] + z*m[10] + z'*m[14];
        x*m[3] + y*m[7] + z*m[11] + z'*m[15];
        */
        Vec2.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = x*m[0] + y*m[4] + m[12];
            out[1] = x*m[1] + y*m[5] + m[13];
            return out;
        };

        /* 
         * ova ideja mi se bas svidja, toji je zamislio da napravi
         * closure nad promenljivom koju ce da koristi u inner funkciji
         * @param {Array} a The array of vectors to iterate over
         * @param {Number} stride Number of elements between the start of 
         * of each Vec2. If 0 assumes tightly packed
         * @param {Number} offset Number of elements to skip at the 
         * beginning of the array
         * @param {Number} count Number of Vec2s to iterate over. If 0
         * iterates over the entire array
         * @param {Function} fn Function to call for each vector in the array
         * @param {Object} [arg] Additional arguments to pass to fn
         * @returns {Array} a
         * @function
         */
        Vec2.forEach = (function() {
            var vec = Vec2.create();
            return function(a, stride, offset, count, fn, arg) {
                var i, l;
                if(!stride) {
                    stride = 2; //we assume it's vec2
                }
                
                if(!offset) {
                    offset = 0;
                }

                if(count) {
                    l = Math.min((count * stride) + offset, a.length);
                } else {
                    l = a.length;
                }

                for(i = offset; i < l; i += stride) {
                    vec[0] = a[i];
                    vec[1] = a[i+1];
                    fn(vec, vec, arg);
                    a[i] = vec[0];
                    a[i+1] = vec[1];
                }

                return a;
            };
        }());

        Vec2.str = function(a) {
            return 'vec2(' + a[0] + ', ' + a[1] + ')';
        };
        /*
        Vec2.prototype = {
            clone: function() {
                return new Vec2(this.x, this.y);
            },
            add: function (v) {
                    this.x += v.x;
                    this.y += v.y;
                    return this;
            },
            sub: function(v) {
                this.x -= v.x;
                this.y -= v.y;
                return this;
            },
            normalize: function() {
                var len = 1 / this.length();
                this.x *= len;
                this.y *= len;
            },
            mul: function(sc) {
                this.x *= sc;
                this.y *= sc;
                return this;
            },
            dot: function(v) {
                return (this.x * this.x + v.y * v.y) / (this.length() * v.length());
            },
            angle: function(v, todeg) {
                var angrad = Math.acos(this.dot(v));
                return todeg ? angrad * 180/Math.PI : angrad;
            },
            length: function() {
                return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); //+ mathbox.epsilon?
            },
            equals: function(v) {
                //rounds to two decimal places
                return (Math.round((this.length() - v.length()) * 100) / 100) === 0;
            }
        }
        */
        window.Vec2 = Vec2;
        return Vec2;
    }
);
(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('camera',["vec2", "halalentity", "renderer"], function(Vec2, HalalEntity, Renderer) {
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

(function() {
  "use strict";
  define('matrix3',[], function() {
    var Matrix3;
    Matrix3 = {};
    Matrix3.create = function() {
      var out;
      out = [];
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
    Matrix3.invert = function(out, a) {
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
      if (det === 0) {
        log.debug("oh god no");
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
    Matrix3.mul = function(a, b) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b00, b01, b02, b10, b11, b12, b20, b21, b22, out;
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
    window.Matrix3 = Matrix3;
    return Matrix3;
  });

}).call(this);

(function() {
  "use strict";
  define('quadtree',["vec2"], function(Vec2) {
    var QuadTree, capacity;
    capacity = 12;
    QuadTree = (function() {
      function QuadTree(bounds) {
        this.bounds = bounds;
        this.pts = [];
        this.nw = null;
        this.sw = null;
        this.ne = null;
        this.se = null;
      }

      QuadTree.prototype.insert = function(ent) {
        if (!Hal.math.isPointInRect(ent.worldPos(), this.bounds)) {
          return false;
        }
        if (this.pts.length < capacity) {
          ent.quadspace = this;
          this.pts.push(ent);
          return true;
        }
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
        return false;
      };

      QuadTree.prototype.remove = function(ent) {
        var ind;
        ind = this.pts.indexOf(ent);
        return this.pts.splice(ind, 1);
      };

      QuadTree.prototype.searchInRange = function(pos, range, scene) {
        var cp, entsInRange, lab, p, _i, _len, _ref;
        entsInRange = [];
        lab = [pos[0] - range, pos[1] - range, 2 * range, 2 * range];
        if (!Hal.math.rectIntersectsRect(lab, this.bounds)) {
          return entsInRange;
        }
        _ref = this.pts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          cp = p.worldToLocal(scene.localToWorld(pos));
          if (Hal.math.rectIntersectsRect(p.bbox, [cp[0] - range, cp[1] - range, 2 * range, 2 * range])) {
            entsInRange.push(p);
          }
        }
        if (this.nw == null) {
          return entsInRange;
        }
        entsInRange = entsInRange.concat(this.nw.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.ne.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.sw.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.se.searchInRange(pos, range, scene));
        return entsInRange;
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
    return QuadTree;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('scene',["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2"], function(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2) {
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
        this.resetQuadSpace([0, 0, this.cam_bounds[2], this.cam_bounds[3]]);
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

      Scene.prototype.addEntityToQuadspace = function(ent) {
        ent = this.addEntity(ent);
        this.quadspace.insert(ent);
        return ent;
      };

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
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
          log.error("No such entity " + ent.id + " in cache");
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          log.error("No such entity " + ent.id + " in entity list");
          return;
        }
        delete this.ent_cache[ent.id];
        this.trigger("ENTITY_DESTROYED", ent);
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
          return log.error("No such entity " + entid + " in entity cache");
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

(function() {
  "use strict";
  define('dommanager',[], function() {
    var DOMManager;
    DOMManager = (function() {
      function DOMManager(Hal) {
        var _this = this;
        this.renderspace = document.getElementById('renderspace');
        this.hud = document.getElementById('hud');
        this.viewport = document.getElementById('viewport');
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
              c.setAttribute('style', (c.getAttribute('style') || '') + ' ' + '-webkit-transform: scale3d(' + _this.fullscreen_scale[0] + ',' + _this.fullscreen_scale[1] + ', 1.0); -webkit-transform-origin: 0 0 0;');
            }
            _this.area = _this.renderspace.getBoundingClientRect();
            return Hal.scm.enterFullScreen(_this.fullscreen_scale);
          } else {
            _this.renderspace.style["width"] = Hal.r.prev_bounds[2] + "px";
            _this.renderspace.style["height"] = Hal.r.prev_bounds[3] + "px";
            Hal.r.resize(Hal.r.prev_bounds[2], Hal.r.prev_bounds[3]);
            _ref1 = _this.canvases;
            for (_ in _ref1) {
              c = _ref1[_];
              c.setAttribute('style', (c.getAttribute('style') || '') + ' ' + '-webkit-transform: scale3d(1.0, 1.0, 1.0); -webkit-transform-origin: 0 0 0;');
            }
            _this.area = _this.renderspace.getBoundingClientRect();
            return Hal.scm.exitFullScreen([1, 1]);
          }
        });
        Hal.on("DOM_ADD", function(callb) {
          if (callb != null) {
            return callb.call(null, _this.hud);
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
        }, false);
        document.addEventListener("webkitfullscreenchange", function() {
          this.in_fullscreen = !this.in_fullscreen;
          return Hal.trigger("FULLSCREEN_CHANGE", this.in_fullscreen);
        }, false);
        document.addEventListener("mozfullscreenchange", function() {
          this.in_fullscreen = !this.in_fullscreen;
          return Hal.trigger("FULLSCREEN_CHANGE", this.in_fullscreen);
        }, false);
        Hal.on("REQUEST_FULLSCREEN", function(scene) {
          if (!Hal.supports("FULLSCREEN")) {
            log.warn("Fullscreen not supported");
            return;
          }
          if (!_this.in_fullscreen) {
            _this.renderspace.style["width"] = _this.screen_w + "px";
            _this.renderspace.style["height"] = _this.screen_h + "px";
            return _this.renderspace.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
          }
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
      z = canvas.style['z-index'];
      if (this.canvases[z]) {
        return;
      }
      canvas.style.left = x + "px";
      canvas.style.top = y + "px";
      if (!isTransp) {
        canvas.style['background-color'] = "white";
      }
      this.viewport.appendChild(canvas);
      return this.canvases[z] = canvas;
    };
    return DOMManager;
  });

}).call(this);

(function() {
  "use strict";
  define('mathutil',["vec2"], function(Vec2) {
    var MathUtil, pointComparison;
    MathUtil = {
      MAT_ARRAY: typeof Float32Array !== 'undefined' ? Float32Array : Array,
      epsilon: 0.000001
    };
    MathUtil.createRegularon = function(numsides, sidelen) {
      var ang, ang_step, out, t, x, y, _i, _ref;
      out = [];
      ang_step = (Math.PI * 2) / numsides;
      ang = 0;
      for (t = _i = 0, _ref = numsides - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; t = 0 <= _ref ? ++_i : --_i) {
        x = sidelen * Math.cos(ang);
        y = sidelen * Math.sin(ang);
        out.push([x, y]);
        ang += ang_step;
      }
      return out;
    };
    MathUtil.clamp = function(val, from, to) {
      if (val < from) {
        val = from;
      }
      if (val > to) {
        val = to;
      }
      return val;
    };
    MathUtil.toDegrees = function(radians) {
      return radians * 180 / Math.PI;
    };
    MathUtil.isPointInRect = function(p, rect) {
      return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3]);
    };
    MathUtil.isRectInRect = function(rectA, rectB) {
      return rectA[0] >= rectB[0] && rectA[1] >= rectB[1] && (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) && (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3]);
    };
    MathUtil.rectIntersectsRect = function(rectA, rectB) {
      return rectA[0] < (rectB[0] + rectB[2]) && (rectA[0] + rectA[2]) > rectB[0] && rectA[1] < (rectB[1] + rectB[3]) && (rectA[3] + rectA[1]) > rectB[1];
    };
    MathUtil.createRectPolygon = function(x, y, w, h) {
      return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    };
    MathUtil.doLinesIntersect = function(x1, y1, x2, y2) {
      /*
          Due to numerical instability, epsilon hack is necessarry
      */

      var bott, invbott, r, rtop, s, stop;
      rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1]);
      stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1]);
      bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0]);
      if (bott === 0) {
        return false;
      }
      invbott = 1 / bott;
      r = rtop * invbott;
      s = stop * invbott;
      if ((r > 0) && (r < 1) && (s > 0) && (s < 1)) {
        return true;
      }
      return false;
    };
    MathUtil.isPointInPoly = function(p, points) {
      var e1, e2, hits, i, len, _i, _ref;
      e1 = [-10000, p[1]];
      e2 = p;
      hits = 0;
      len = points.length;
      for (i = _i = 0, _ref = len - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this.doLinesIntersect(e1, e2, points[i], points[(i + 1) % len])) {
          hits++;
        }
      }
      return (hits % 2) !== 0;
    };
    MathUtil.projectPointOnLine = function(pt, a, b) {
      var dotProd, lenAC, vecAB, vecAC, vecCProj;
      vecAB = Vec2.sub([], b, a);
      vecAC = Vec2.sub([], pt, a);
      Vec2.normalize(vecAB, vecAB);
      Vec2.normalize(vecAC, vecAC);
      dotProd = Vec2.dot(vecAC, vecAB);
      lenAC = Vec2.distance(a, pt);
      vecCProj = Vec2.scale([], vecAB, dotProd * lenAC);
      vecCProj = Vec2.fromValues(a[0] + vecCProj[0], a[1] + vecCProj[1]);
      return vecCProj;
    };
    MathUtil.rectIntersectsCircle = function(rect, circpos, radius) {
      return this.lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius);
    };
    MathUtil.rectIntersectsOrHullsCircle = function(rect, circpos, radius) {
      return this.rectIntersectsCircle(rect, circpos, radius) || this.isPointInRect(circpos, rect);
    };
    MathUtil.lineIntersectsCircle = function(line, circpos, radius) {
      var dist;
      dist = this.perpDistanceToSegment(circpos, line[0], line[1]);
      return dist < radius;
    };
    MathUtil.perpDistance = function(pt, a, b) {
      var c;
      c = this.projectPointOnLine(pt, a, b);
      return Vec2.distance(pt, c);
    };
    MathUtil.perpDistanceToSegment = function(pt, a, b) {
      var c, linelen;
      c = this.projectPointOnLine(pt, a, b);
      linelen = Vec2.distance(a, b);
      if (Vec2.distance(a, c) > linelen || Vec2.distance(b, c) > linelen) {
        return Number.NaN;
      }
      return Vec2.distance(pt, c);
    };
    MathUtil.isPointInCircle = function(pt, circpos, radius) {
      var dist, distX, distY;
      distX = pt[0] - circpos[0];
      distY = pt[1] - circpos[1];
      dist = Math.sqrt((distX * distX) + (distY * distY));
      return dist < radius;
    };
    pointComparison = function(a, b, center) {
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
    return MathUtil;
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
        this.viewport = null;
        this.mouse_leftbtn_down = false;
        this.mouse_rightbtn_down = false;
        this.can_drag = true;
        this.pos = [0, 0];
        this.viewport = Hal.dom.hud;
        this.dragging = false;
        this.under_dom = false;
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
        return Hal.trigger("KEY_DOWN", evt);
      };

      DOMEventManager.prototype.keyUp = function(evt) {
        return Hal.trigger("KEY_UP", evt);
      };

      DOMEventManager.prototype.mouseDblClick = function(evt) {
        this.getMousePos(evt);
        return Hal.trigger("LEFT_DBL_CLICK", this.pos);
      };

      DOMEventManager.prototype.mouseClick = function(evt) {
        if (this.under_dom) {
          return;
        }
        this.getMousePos(evt);
        return Hal.trigger("MOUSE_CLICK", this.pos);
      };

      DOMEventManager.prototype.mouseMove = function(evt) {
        this.under_dom = this.viewport.querySelectorAll(':hover').length > 0;
        if (this.under_dom) {
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
        if (this.under_dom) {
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
        if (this.under_dom) {
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
  var __slice = [].slice;

  define('ajax',[],function() {
    var Ajax, Result;
    Result = (function() {
      function Result(url) {
        this.url = url;
        this.success_ = this.fail_ = this.always_ = Function();
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
      var ajaxreq, callbacks, data, result, url;
      url = arguments[0], data = arguments[1], callbacks = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      result = new Result(document.domain + '/' + url);
      ajaxreq = new XMLHttpRequest();
      ajaxreq.open("GET", "" + url + "?" + data);
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
    return (window.ajx = Ajax);
  });

}).call(this);

(function() {
  "use strict";
  define('sprite',[], function() {
    var Sprite;
    Sprite = (function() {
      function Sprite(img, name, x, y, w, h) {
        var spl;
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        spl = this.img.src.match(/\/assets\/sprites\/(.*\/)(.*)\.png/);
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
        return data[3] === 255;
      };

      ImageUtils.prototype.getPixelAt = function(img, x, y) {
        var ctx, data, pos;
        ctx = this.hit_canvas.getContext("2d");
        ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
        data = ctx.getImageData(0, 0, 1, 1).data;
        pos = (x + y) * 4;
        return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
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

  define('assetmanager',["deferred", "deferredcounter", "ajax", "spritefactory", "sprite", "spritesheet", "eventdispatcher"], function(Deferred, DeferredCounter, Ajax, SpriteFactory, Sprite, SpriteSheet, EventDispatcher) {
    var AssetManager, extract_type, res_url, ws_url;
    res_url = "/assets/";
    ws_url = "http://localhost:8080";
    extract_type = /^(.*)\.(.*)$/;
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
      return res_url = url;
    };
    AssetManager.prototype.resolvePath = function(url) {
      var g, grps, key, top, _i, _len, _ref;
      grps = url.split("/");
      if (this.assets.hasOwnProperty(grps[0])) {
        top = this.assets[grps[0]];
        _ref = grps.slice(1, +(grps.length - 2) + 1 || 9e9);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          g = _ref[_i];
          if (!top.hasOwnProperty(g)) {
            top[g] = {};
          }
          top = top[g];
        }
      }
      key = grps[grps.length - 1];
      key = key.substring(0, key.lastIndexOf("."));
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
    AssetManager.prototype.tint = function(spr, color) {
      /*
        @todo 
          Treba proveriti velicinu tint kesa, isprazniti ga 
          ako predje neke threshold
      */

      var id;
      id = spr.folder + spr.name + color;
      if (!this.tint_cache[id]) {
        this.tint_cache[id] = Hal.im.tintImage(spr.img, color, 0.5);
      }
      return this.tint_cache[id];
    };
    AssetManager.prototype.loadSprite = function(url) {
      var defer,
        _this = this;
      url = res_url + url;
      defer = new Deferred();
      this.loadImage(url).then(function(img) {
        var name, sprite;
        sprite = SpriteFactory.fromSingleImage(img, url);
        name = sprite.getName();
        if (_this.wait_queue[name]) {
          log.debug(_this.wait_queue[name]);
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
    AssetManager.prototype.loadAudio = function(audioURL) {
      var audio, defer;
      defer = new Deferred();
      return audio = new Audio(audioURL);
    };
    AssetManager.prototype.loadSound = function(url) {
      var defer;
      url = res_url + url;
      defer = new Deferred();
      return this.loadAudio();
    };
    AssetManager.prototype.addSprite = function(g) {
      var _this = this;
      return this.loadSprite(g).then(function(sprite) {
        return _this.addToStorage(g, sprite);
      });
    };
    AssetManager.prototype.addSound = function(g) {
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
          _ref = grps.slice(1, +(grps.length - 3) + 1 || 9e9);
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
        log.error("Couldn't find socket.io library");
        return;
      }
      this.socket = io.connect(ws_url);
      this.socket.on("connect", function() {
        return log.debug("connected");
      });
      this.socket.on("LOAD_SPRITES", function(data) {
        var g, i, length, list, _i, _len, _results;
        list = JSON.parse(data.files);
        length = list.length;
        _this.trigger("SPRITES_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSprite(data.url + g).then(function() {
              _this.trigger("SPRITE_LOADED", g);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("LOAD_SOUNDS", function(data) {
        var g, i, length, list, _i, _len, _results;
        list = JSON.parse(data.files);
        length = list.length;
        _this.trigger("SOUNDS_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSound(data.url + g).then(function() {
              _this.trigger("SOUND_LOADED");
              if (i >= (length - 1)) {
                return _this.trigger("SOUNDS_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("SPRITE_ADDED", function(data) {
        log.debug("sprite added");
        log.debug(data);
        return _this.addSprite(data.url);
      });
      this.socket.on("SPRITESHEET_ADDED", function(data) {
        return log.debug(data);
      });
      this.socket.on("SPRITE_DELETED", function(data) {
        log.debug("sprite deleted");
        log.debug(data);
        return _this.deleteFromStorage(data.url);
      });
      this.socket.on("SPRITE_FOLDER_DELETED", function(data) {
        var key, storage, _ref;
        log.debug("sprite folder deleted");
        log.debug(data);
        _ref = _this.resolveFolderPath(data.url), storage = _ref[0], key = _ref[1];
        delete storage[key];
        return _this.trigger("SPRITES_LOADED");
      });
      this.socket.on("SPRITE_FOLDER_ADDED", function(data) {
        var file, i, length, _i, _len, _ref, _results;
        log.debug("sprite folder added");
        log.debug(data);
        length = data.files.length;
        _this.trigger("SPRITES_LOADING");
        _ref = data.files;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          file = _ref[i];
          log.debug("file: " + file);
          _results.push((function(file, i) {
            log.debug(data.url + file);
            return _this.addSprite(data.url + file).then(function() {
              _this.trigger("SPRITE_LOADED", file);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(file, i));
        }
        return _results;
      });
      return this.socket.on("SPRITESHEET_DELETED", function(data) {
        return log.debug(data);
      });
    };
    AssetManager.prototype.loadSpritesFromFileList = function(list) {
      var _this = this;
      return Ajax.get(list, function(data) {
        var i, length, spr, _i, _len, _results;
        data = data.split("\n");
        data.splice(-1);
        length = data.length;
        _this.trigger("SPRITES_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
          spr = data[i];
          _results.push((function(spr, i) {
            return _this.addSprite(spr).then(function() {
              _this.trigger("SPRITE_LOADED", spr);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(spr, i));
        }
        return _results;
      });
    };
    AssetManager.prototype.loadFromArray = function(type, array) {
      var _ref;
      if (_ref = !type, __indexOf.call(this.assets, _ref) >= 0) {

      }
    };
    AssetManager.prototype.getSprite = function(spr) {
      var key, store, _ref;
      _ref = this.resolvePath("sprites/" + spr + "."), store = _ref[0], key = _ref[1];
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
      _ref = this.resolveFolderPath("sprites/" + folder), storage = _ref[0], key = _ref[1];
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
      _ref = this.resolveFolderPath("sprites/" + folder), storage = _ref[0], key = _ref[1];
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
      log.debug("num criticals: " + criticals.length);
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
        this.quadspace = null;
        this.needs_updating = true;
        this.draw_origin = false;
        this.local_matrix = this.localMatrix();
        this.bbox = BBoxAlgos.rectFromPolyShape(this.shape);
        this.children = [];
        this.shapes = [];
        this.drawables = [];
        this.scene = null;
        this.selected_color = "white";
        this.unselected_color = this.stroke_color;
        this.on("CHANGE", function(attr) {
          var ch, prop, _i, _len, _ref, _results;
          prop = attr[0];
          if (prop === "angle" || prop === "scale" || prop === "x" || prop === "y" || prop === "glow" || prop === "parent" || prop === "line_width" || prop === "h") {
            this.needs_updating = true;
          }
          if (prop === "shape") {
            if (this.sprite == null) {
              this.bbox = BBoxAlgos.rectFromPolyShape(this.shape);
              this.needs_updating = true;
            }
          }
          if (prop === "x" || prop === "y") {
            if ((this.parent != null) && (this.quadspace != null)) {
              this.parent.trigger("ENTITY_MOVING", this);
              _ref = this.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ch = _ref[_i];
                _results.push(this.parent.trigger("ENTITY_MOVING", ch));
              }
              return _results;
            }
          }
        });
        this.on("ENTITY_ADDED", function() {
          return this.init();
        });
      }

      Entity.prototype.localMatrix = function() {
        return [this.scale, 0, this.x, 0, this.scale, this.y, 0, 0, 1];
      };

      Entity.prototype.rotationMatrix = function() {
        return [Math.cos(this.angle), -Math.sin(this.angle), 0, Math.sin(this.angle), Math.cos(this.angle), 0, 0, 0, 1];
      };

      Entity.prototype.init = function() {
        var _this = this;
        if (this.parent instanceof Scene) {
          this.parent.camera.on("CHANGE", function() {
            return _this.needs_updating = true;
          });
        }
        this.on("EXIT_FRAME", function() {
          return this.scene.g.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        return this.on("LEFT_CLICK", function(attr) {
          this.selected = !this.selected;
          if (this.selected) {
            this.trigger("SELECTED");
          } else {
            this.trigger("DESELECTED");
          }
          return log.debug("yay, i've been selected: " + this.id);
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
        var inv;
        inv = Matrix3.transpose([], this.local_matrix);
        return Vec2.transformMat3([], pos, inv);
      };

      Entity.prototype.worldToLocal = function(pos) {
        return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], this.local_matrix)));
      };

      Entity.prototype.addEntity = function(ent) {
        this.children.push(ent);
        this.scene.addEntity(ent);
        this.trigger("CHILD_ENTITY_ADDED", ent);
        ent.attr("scene", this.scene);
        return ent.attr("parent", this);
      };

      Entity.prototype.addEntityToQuadspace = function(ent) {
        this.children.push(ent);
        this.scene.addEntityToQuadspace(ent);
        this.trigger("CHILD_ENTITY_ADDED", ent);
        ent.attr("scene", this.scene);
        ent.attr("parent", this);
        return ent;
      };

      Entity.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = true;
        }
        this.removeAll();
        this.scene.removeEntity(this);
        if (destroy_children) {
          this.destroyChildren();
        }
        this.children = null;
        this.drawables = null;
        this.parent = null;
        if (this.quadspace == null) {
          log.warn("this entity had no quadspace");
        } else {
          this.quadspace.remove(this);
        }
        this.quadspace = null;
        this.scene = null;
        return this.trigger("ON_DESTROY");
      };

      Entity.prototype.destroyChildren = function() {
        var c, _i, _len, _ref, _results;
        _ref = this.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.destroy());
        }
        return _results;
      };

      Entity.prototype.update = function(delta) {
        this.scene.g.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        if (this.needs_updating) {
          this.local_matrix = Matrix3.mul(this.rotationMatrix(), this.localMatrix());
          this.local_matrix = Matrix3.mul(this.local_matrix, this.parent.local_matrix);
          this.needs_updating = false;
          if (!this.glow) {
            return this.scene.g.ctx.shadowBlur = 0;
          }
        }
      };

      Entity.prototype.addDrawable = function(drawableFunc) {
        return this.drawables.push(drawableFunc);
      };

      Entity.prototype.addShape = function(shape) {
        return this.shapes.push(shape);
      };

      Entity.prototype.draw = function(delta) {
        var s, _i, _j, _len, _len1, _ref, _ref1, _results;
        this.scene.g.ctx.globalAlpha = this.opacity;
        if (this.draw_shape) {
          if (this.line_width > 1.0) {
            this.scene.g.ctx.lineWidth = this.line_width;
          }
        }
        if (this.glow) {
          this.scene.g.ctx.shadowBlur = this.glow_amount;
          this.scene.g.ctx.shadowColor = this.glow_color;
        }
        if (this.draw_shape) {
          this.scene.g.strokePolygon(this.shape, !this.selected ? this.stroke_color : this.selected_color);
        }
        if (this.glow) {
          this.scene.g.ctx.shadowBlur = 0;
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
        _ref = this.drawables;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          s.call(this, delta);
        }
        _ref1 = this.shapes;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          s = _ref1[_j];
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
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tilemanager',["spriteentity"], function(SpriteEntity) {
    var Tile, TileLayer, TileManager;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.layers = [null, null, null, null, null];
      }

      Tile.prototype.addTileLayer = function(tile, layer) {
        var ent, layer_present;
        layer = layer || tile.layer;
        layer_present = this.layers[layer] != null;
        if (layer_present && this.layers[layer].name === tile.name) {
          log.debug("You're trying to add the same layer");
          return;
        }
        if (layer_present) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = tile;
        ent = this.addEntityToQuadspace(tile);
        ent.attr("shape", this.shape);
        return ent.attr("draw_shape", false);
      };

      Tile.prototype.update = function(delta) {
        var layer, _i, _len, _ref, _results;
        Tile.__super__.update.call(this, delta);
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          if (layer != null) {
            _results.push(layer.update(delta));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Tile.prototype.draw = function(delta) {
        var layer, _i, _len, _ref, _results;
        Tile.__super__.draw.call(this, delta);
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          if (layer != null) {
            _results.push(layer.draw(delta));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return Tile;

    })(SpriteEntity);
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
        this.on("SELECTED", function() {
          this.attr("glow", true);
          this.attr("glow_color", "blue");
          this.attr("draw_shape", true);
          this.attr("stroke_color", "white");
          return Hal.tween(this, "line_width", 200, 1, 14.5, 5);
        });
        this.on("DESELECTED", function() {
          this.attr("line_width", 1);
          this.attr("glow", false);
          return this.attr("draw_shape", false);
        });
      }

      TileLayer.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = true;
        }
        log.debug("destroying myself");
        log.debug(this);
        this.parent.layers[this.layer] = null;
        return TileLayer.__super__.destroy.call(this, destroy_children);
      };

      return TileLayer;

    })(SpriteEntity);
    return TileManager = (function() {
      function TileManager(tilew, tileh, tileList) {
        var _this = this;
        this.tilew = tilew;
        this.tileh = tileh;
        if (tileList == null) {
          tileList = "";
        }
        this.TilesByID = {};
        this.TilesByName = {};
        this._id = 0;
        Hal.on("TILE_MNGR_NEW_TILE", function(tile) {
          return _this.add(tile);
        });
        Hal.on("TILE_MNGR_LOAD_TILES", function(tiles) {
          return _this.load(tiles);
        });
      }

      TileManager.prototype.loadFromList = function(list) {
        var k, t, tiles, _results,
          _this = this;
        if (list == null) {
          list = "assets/TilesList.list";
        }
        Ajax.get("assets/amjad/TilesList.json", function(tiles) {});
        log.debug("TileManager loaded tiles.");
        tiles = JSON.parse(tiles);
        _results = [];
        for (k in tiles) {
          t = tiles[k];
          _results.push(this.add(t));
        }
        return _results;
      };

      TileManager.prototype.load = function(tiles) {
        var i, t, _results;
        log.debug("Loading tiles...");
        log.debug(tiles);
        _results = [];
        for (i in tiles) {
          t = tiles[i];
          _results.push(this.add(t));
        }
        return _results;
      };

      TileManager.prototype.add = function(tile) {
        tile.id = ++this._id;
        this.TilesByName[tile.name] = tile;
        return this.TilesByID[tile.id] = tile;
      };

      TileManager.prototype.removeByName = function(name) {
        var t;
        t = this.TilesByName[name];
        delete this.TilesByID[t.id];
        delete this.TilesByName[t.name];
        return t = null;
      };

      TileManager.prototype.newTileLayer = function(meta) {
        return new TileLayer(meta);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        return new Tile(meta);
      };

      TileManager.prototype.addTileLayerToHolder = function(holder, tile, layer) {
        if ((holder == null) || (tile == null)) {
          log.debug("holder or tile is null");
          return;
        }
        return holder.addTileLayer(tile, layer);
      };

      return TileManager;

    })();
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('isometricmap',["scene", "spriteentity", "entity", "tilemanager"], function(Scene, SpriteEntity, Entity, TileManager) {
    var IsometricMap;
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        var hittest, i, j, _i, _len, _ref,
          _this = this;
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = meta.rows;
        this.ncols = meta.cols;
        this.tm = new TileManager(this.tilew, this.tileh);
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.total_rendered = 0;
        this.translate_x = 0;
        this.max_rows = this.nrows - 1;
        this.max_cols = this.ncols - 1;
        this.selected_tile = null;
        this.old_camx = 0;
        this.supported_modes = {
          "mode-default": function() {
            _this.processMouseClick();
          },
          "mode-erase": function() {
            _this.processMouseClick();
            if ((_this.clicked_layer == null) || _this.clicked_layer.animating) {
              return;
            }
            _this.clicked_layer.tween({
              attr: "h",
              from: 0,
              to: 100,
              duration: 500
            }).tween({
              attr: "opacity",
              from: 1,
              to: 0,
              duration: 700
            }).done(function() {
              return this.destroy();
            });
            return _this.clicked_layer = null;
          },
          "mode-place": function() {
            _this.tm.addTileLayerToHolder(_this.tile_under_mouse, _this.tm.newTileLayer(_this.selected_tile));
          }
        };
        this.camera_moved = false;
        this.current_mode = this.supported_modes["mode-default"];
        meta.cam_bounds = [this.tilew2, this.tileh2, this.ncols * this.tilew2, (this.nrows - 0.5) * this.tileh];
        IsometricMap.__super__.constructor.call(this, meta);
        this.iso_shape = [[-this.tilew2, 0], [0, this.tileh2], [this.tilew2, 0], [0, -this.tileh2]];
        this.display = {
          startr: 0,
          endr: 0,
          startc: 0,
          endc: 0
        };
        this.info = {
          row: "row: ",
          col: "col: ",
          tilename: "tile: ",
          start_row: "starting row: ",
          start_col: "staring col: ",
          end_row: "end row: ",
          end_col: "end_col: ",
          tile_x: "tile_x: ",
          tile_y: "tile_y: ",
          num_rendering: "no. rendereded entities: ",
          cam_mouse: "camera_mouse: "
        };
        this.mask = Hal.asm.getSprite("test/tilemask_128x64");
        hittest = Hal.dom.createCanvas(this.tilew, this.tileh).getContext("2d");
        hittest.drawImage(this.mask.img, 0, 0);
        this.mask_data = hittest.getImageData(0, 0, this.tilew, this.tileh).data;
        _ref = this.mask_data;
        for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
          i = _ref[j];
          this.mask_data[j] = i < 120;
        }
        this.over = {
          "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64"),
          "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")
        };
        this.last_clicked_layer = null;
        this.tile_under_mouse = null;
        this.search_range = this.bounds[2] * 0.5;
      }

      IsometricMap.prototype.showRegion = function(pos, range_row, range_col) {
        var b_left, b_right, c, c_col, c_row, shape, t_left, t_right;
        c = this.getTileAt(this.worldToLocal(pos));
        if (c == null) {
          return;
        }
        c_row = c.row;
        c_col = c.col;
        if (c_col % 2 === 0) {
          range_row -= 1;
        }
        t_left = this.getTile(Hal.math.clamp(c_row - range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col - range_col, c_col, this.ncols - 1));
        b_right = this.getTile(Hal.math.clamp(c_row + range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col + range_col, c_col, this.ncols - 1));
        t_right = this.getTile(Hal.math.clamp(c_row - range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col + range_col, c_col, this.ncols - 1));
        b_left = this.getTile(Hal.math.clamp(c_row + range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col - range_col, c_col, this.ncols - 1));
        if (!((t_left != null) && (t_right != null) && (b_left != null) && (b_right != null))) {
          return;
        }
        shape = [t_left.x - (t_right.x - t_left.x), t_left.y - (b_right.y - t_left.y), (t_right.x - t_left.x) * 2, (b_right.y - t_left.y) * 2];
        return this.g.strokeRect(shape, "cyan");
      };

      IsometricMap.prototype.drawStat = function() {
        IsometricMap.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          this.g.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 195);
          this.g.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 210);
          this.g.ctx.fillText(this.info.tile_x + this.tile_under_mouse.x, 0, 225);
          this.g.ctx.fillText(this.info.tile_y + this.tile_under_mouse.y, 0, 240);
        }
        this.g.ctx.fillText(this.info.start_row + this.display.startr, 0, 115);
        this.g.ctx.fillText(this.info.start_col + this.display.startc, 0, 130);
        this.g.ctx.fillText(this.info.end_row + this.display.endr, 0, 145);
        this.g.ctx.fillText(this.info.end_col + this.display.endc, 0, 160);
        this.g.ctx.fillText(this.info.num_rendering + this.total_rendered, 0, 175);
        return this.g.ctx.fillText(this.info.cam_mouse + ("" + (-this.camera.x + this.mpos[0]) + ", " + (-this.camera.y + this.mpos[1])), 0, 255);
      };

      IsometricMap.prototype.init = function() {
        var _this = this;
        IsometricMap.__super__.init.call(this);
        /*
            @todo: Ovo posle treba ukloniti!
        */

        this.camera.on("CHANGE", function() {
          return _this.calcDrawingArea();
        });
        Hal.on("LEFT_CLICK", function() {
          return _this.current_mode();
        });
        /*map editor stuff*/

        Hal.on("EDITOR_MODE_CHANGED", function(mode) {
          if (_this.supported_modes[mode]) {
            _this.current_mode = _this.supported_modes[mode];
          } else {
            log.warn("Mode " + mode + " not supported");
          }
          return log.debug(mode);
        });
        Hal.on("TILE_LAYER_SELECTED", function(tile) {
          log.debug("Tile layer selected from editor");
          log.debug(tile);
          return _this.selected_tile = tile;
        });
        Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          return _this.camera.lerpTo(_this.localToWorld(_this.world_pos));
        });
        this.on("ENTITY_DESTROYED", function(ent) {
          var ind;
          ind = _this.map.indexOf(ent);
          if (ind === -1) {
            return log.debug("oh shit, no such entity " + ent.id);
          } else {
            return _this.map[ind] = null;
          }
        });
        Hal.on("MOUSE_MOVE", function(pos) {
          var t;
          t = _this.getTileAt(_this.worldToLocal(pos));
          if (t !== _this.tile_under_mouse) {
            if (_this.tile_under_mouse) {
              _this.tile_under_mouse.attr("line_width", 1);
              _this.tile_under_mouse.attr("glow", false);
              _this.tile_under_mouse.attr("draw_shape", false);
            }
            _this.tile_under_mouse = t;
            if (t != null) {
              t.attr("glow", true);
              t.attr("draw_shape", true);
              t.attr("stroke_color", "white");
              return Hal.tween(t, "line_width", 400, 1, 3.5, 1);
            }
          }
        });
        return this.initMap();
      };

      IsometricMap.prototype.draw = function(delta) {
        var i, j, tile, _i, _j, _ref, _ref1, _ref2, _ref3;
        if (this.paused) {
          return;
        }
        IsometricMap.__super__.draw.call(this);
        this.total_rendered = 0;
        for (i = _i = _ref = this.display.startr, _ref1 = this.display.startr + this.display.endr; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          for (j = _j = _ref2 = this.display.startc, _ref3 = this.display.endc + this.display.startc; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; j = _ref2 <= _ref3 ? ++_j : --_j) {
            tile = this.map[j + i * this.ncols];
            if (tile == null) {
              continue;
            }
            tile.update(delta);
            tile.draw(delta);
            this.total_rendered++;
          }
        }
        this.camera_moved = false;
        this.g.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        return this.showRegion(this.mpos, 3, 3);
      };

      IsometricMap.prototype.calcDrawingArea = function() {
        /* mozda da pomerim granicu, jel da?*/

        var sc, sr, top_left;
        this.old_camx = this.camera.x;
        if ((this.camera.x % this.tilew2) === 0) {
          log.debug("oh jea");
          this.camera_moved = true;
        }
        top_left = this.getTileAt(this.worldToLocal([0, 0]));
        if (top_left == null) {
          sc = 0;
          sr = 0;
        } else {
          sc = top_left.col;
          sr = top_left.row;
        }
        return this.display = {
          startc: sc,
          endr: this.maxRows(),
          startr: sr,
          endc: this.maxCols()
        };
      };

      IsometricMap.prototype.maxRows = function() {
        return Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.camera.zoom)) + 4));
      };

      IsometricMap.prototype.maxCols = function() {
        return Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.camera.zoom)) + 4));
      };

      IsometricMap.prototype.toOrtho = function(pos) {
        var coldiv, off_x, off_y, rowdiv, transp;
        coldiv = (pos[0] + this.tilew2) * this.tilew2prop;
        rowdiv = (pos[1] + this.tileh2) * this.tileh2prop;
        off_x = ~~((pos[0] + this.tilew2) - ~~(coldiv * 0.5) * this.tilew);
        off_y = ~~((pos[1] + this.tileh2) - ~~(rowdiv * 0.5) * this.tileh);
        transp = this.mask_data[(off_x + this.tilew * off_y) * 4 + 3];
        return [coldiv - (transp ^ !(coldiv & 1)), (rowdiv - (transp ^ !(rowdiv & 1))) / 2];
      };

      IsometricMap.prototype.getTile = function(row, col, dir) {
        if (dir == null) {
          dir = [0, 0];
        }
        return this.map[(col + dir[1]) + (row + dir[0]) * this.ncols];
      };

      IsometricMap.prototype.getTileAt = function(pos) {
        var coord;
        coord = this.toOrtho(pos);
        if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= this.nrows || coord[0] >= this.ncols) {
          return null;
        }
        return this.map[Math.floor(coord[0]) + Math.floor(coord[1]) * this.ncols];
      };

      IsometricMap.prototype.initMap = function() {
        var i, j, k, t, t1, t2, x, y, _i, _j, _ref, _ref1;
        this.clicked_layer = null;
        log.debug("max rows: " + (this.maxRows()));
        log.debug("max cols: " + (this.maxCols()));
        log.debug("total at this resolution: " + (this.maxRows() * this.maxCols()));
        this.max_rows = this.maxRows();
        this.max_cols = this.maxCols();
        this.map = new Array(this.nrows * this.ncols);
        k = 0;
        t1 = performance.now();
        for (i = _i = 0, _ref = this.nrows - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          for (j = _j = 0, _ref1 = this.ncols - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
            x = (j / 2) * this.tilew;
            y = (i + ((j % 2) / 2)) * this.tileh;
            t = this.tm.newTileHolder({
              "shape": this.iso_shape,
              "draw_shape": false,
              "x": x,
              "y": y,
              "row": i,
              "col": j,
              "visible_sprite": true,
              "sprite": "test/grid_unit_128x64"
            });
            this.map[k] = this.addEntity(t);
            k++;
          }
        }
        t2 = performance.now() - t1;
        log.debug("it took: " + t1);
        this.calcDrawingArea();
        return this.camera.trigger("CHANGE");
      };

      IsometricMap.prototype.processMouseClick = function() {
        var ents, t, t1, tile, _i, _len;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        t = performance.now();
        ents = this.quadspace.searchInRange(this.world_pos, this.search_range, this);
        t1 = performance.now() - t;
        log.info(t1);
        log.info(ents.length);
        for (_i = 0, _len = ents.length; _i < _len; _i++) {
          tile = ents[_i];
          if (!tile.inShapeBounds(this.world_pos)) {
            continue;
          }
          log.debug(tile);
          if (this.clicked_layer == null) {
            this.clicked_layer = tile;
          } else {
            if ((tile.parent.col === this.clicked_layer.parent.col) && (tile.parent.row === this.clicked_layer.parent.row)) {
              if (tile.layer > this.clicked_layer.layer) {
                this.clicked_layer = tile;
              }
            } else if (tile.parent.row === this.clicked_layer.parent.row) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            } else if (tile.parent.col === this.clicked_layer.parent.col) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            } else if ((tile.parent.col !== this.clicked_layer.parent.col) && (tile.parent.row !== this.clicked_layer.parent.row)) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            }
          }
        }
        if (this.clicked_layer != null) {
          log.debug("clicked layer");
          log.debug(this.clicked_layer);
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          return this.clicked_layer.trigger("LEFT_CLICK");
        }
      };

      IsometricMap.prototype.splitMap = function() {
        var map;
        return map = {
          nw: null,
          ns: null,
          s: null,
          w: null,
          e: null,
          n: null,
          sw: null,
          se: null,
          c: null
        };
      };

      IsometricMap.prototype.loadRandomMap = function(i, data) {
        var j, k, t, _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = this.ncols - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push((function() {
            var _j, _ref1, _results1;
            _results1 = [];
            for (j = _j = 0, _ref1 = this.nrows - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
              t = this.getTile(i, j);
              k = 5;
              _results1.push((function() {
                var _results2;
                _results2 = [];
                while (k > 0 && !t.isFull()) {
                  this.addRandomLayer(t);
                  _results2.push(--k);
                }
                return _results2;
              }).call(this));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      IsometricMap.prototype.addRandomLayer = function(t) {
        var index, randt, randts, tileLayer, tiles, tkeys, tskeys;
        tskeys = Object.keys(this.tmngr.Tiles);
        randts = ~~(Math.random() * tskeys.length);
        index = tskeys[randts];
        tiles = amj.tmngr.Tiles[index];
        tkeys = Object.keys(tiles);
        randt = ~~(Math.random() * tkeys.length);
        index = tkeys[randt];
        return tileLayer = tiles[index];
      };

      IsometricMap.prototype.genRandomMap = function() {};

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);

(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('halal',["loglevel", "eventdispatcher", "scene", "dommanager", "renderer", "mathutil", "vec2", "deferred", "deferredcounter", "domeventmanager", "assetmanager", "imgutils", "entity", "spriteentity", "isometricmap"], function(log, EventDispatcher, Scene, DOMManager, Renderer, MathUtil, Vec2, Deferred, DeferredCounter, DOMEventManager, AssetManager, ImgUtils, Entity, SpriteEntity, IsometricMap) {
    /*
        A shim (sort of) to support RAF execution
    */

    var Halal, cur_fps_time, cur_time, delta, draw_info, fps_cap, fps_counter, fps_trigger_time, fstep, last_frame_id, paused, prev_time, rafLoop;
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
    rafLoop = function() {
      var sc, _i, _len, _ref;
      prev_time = cur_time;
      cur_time = performance.now();
      delta = (cur_time - prev_time) * 0.001;
      cur_fps_time += delta;
      delta = Math.min(delta, fstep);
      Hal.trigger("ENTER_FRAME", delta);
      _ref = Hal.scenes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sc = _ref[_i];
        sc.update(delta);
        sc.draw(delta);
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
        this.math = MathUtil;
        this.id = 0;
        this.debug_mode = false;
        this.pressed_keys = [];
        this.scenes = [];
        this.fps = 0;
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
    Halal.prototype.pause = function() {
      cancelAnimationFrame(last_frame_id);
      paused = true;
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
      this.on("MOUSE_MOVE", function(pos) {
        var sc, _i, _len, _ref, _results;
        _ref = this.scenes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sc = _ref[_i];
          sc.mpos = pos;
          _results.push(sc.world_pos = sc.worldToLocal(pos));
        }
        return _results;
      });
      this.on("DESTROY_SCENE", function(scene) {
        var ind;
        ind = this.scenes.indexOf(scene);
        if (ind === -1) {
          log.error("No such scene: " + scene.name);
        }
        this.scenes[ind] = null;
        return this.scenes.splice(ind, 1);
      });
      return log.debug("Engine initialized");
    };
    Halal.prototype.start = function() {
      this.init();
      paused = false;
      this.trigger("ENGINE_STARTED");
      log.debug("Engine started");
      return rafLoop();
    };
    Halal.prototype.isPaused = function() {
      return paused;
    };
    Halal.prototype.debug = function(debug_mode) {
      this.debug_mode = debug_mode;
    };
    Halal.prototype.ID = function() {
      return ++this.id;
    };
    Halal.prototype.drawInfo = function() {
      this.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.glass.ctx.fillStyle = "black";
      return this.glass.ctx.fillText("FPS: " + this.fps, 0, 10);
    };
    Halal.prototype.tween = function(obj, property, t, from, to, repeat) {
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
        obj.attr(property, val);
        accul = Math.min(accul, t);
        if (t === accul) {
          repeat--;
          obj.attr(property, to);
          if (repeat === 0) {
            defer.resolve(obj);
            Hal.remove("ENTER_FRAME", $);
          } else {
            accul = 0;
            return val = from;
          }
        }
      });
      return defer.promise();
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
            Hal.remove("ENTER_FRAME", $);
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
    Halal.prototype.IsometricMap = function(meta) {
      return new IsometricMap(meta);
    };
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
    window.Hal.glass = new Renderer(Hal.viewportBounds(), null, 11);
    window.Hal.asm = new AssetManager();
    window.Hal.im = new ImgUtils();
    window.log = log;
    return window.Hal;
  });

}).call(this);

(function() {
  "use strict";
  require.config({
    urlArgs: Math.random(),
    baseUrl: "src",
    paths: {
      "loglevel": "../vendor/loglevel/dist/loglevel"
    },
    shim: {
      "loglevel": {
        "exports": "log"
      }
    }
  });

  require(["halal"], function(halal) {
    log.setLevel(log.levels.DEBUG);
    return halal;
  });

}).call(this);

define("main", function(){});
