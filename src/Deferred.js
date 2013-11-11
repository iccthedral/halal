(function() {
  "use strict";
  var __slice = [].slice;

  define(function() {
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
