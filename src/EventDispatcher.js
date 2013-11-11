(function() {
  "use strict";
  define(function() {
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
          return this.listeners[type].splice(ind, 1);
        }
      }
    };
    EventDispatcher.prototype.removeAll = function(type) {
      if (type) {
        return delete this.listeners[type];
      } else {
        return this.listeners = [];
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
