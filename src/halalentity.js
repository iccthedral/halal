(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["eventdispatcher", "deferred"], function(EventDispatcher, Deferred) {
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
