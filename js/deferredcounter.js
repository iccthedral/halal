(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(["deferred"], function(Deferred) {
    var DeferredCounter;
    DeferredCounter = (function(_super) {
      __extends(DeferredCounter, _super);

      function DeferredCounter(total_trigs) {
        this.total_trigs = total_trigs;
        this.num_approved = 0;
        this.num_rejected = 0;
        DeferredCounter.__super__.constructor.call(this);
      }

      DeferredCounter.prototype.resolve = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if ((this.num_approved + this.num_rejected) === this.total_trigs) {
          return DeferredCounter.__super__.resolve.call(this, target, args);
        }
      };

      DeferredCounter.prototype.reject = function() {
        var args, target;
        target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        DeferredCounter.__super__.reject.call(this, target, args);
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
