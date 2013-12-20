(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(["eventdispatcher", "deferred"], function(EventDispatcher, Deferred) {
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
