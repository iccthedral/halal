(function() {
  "use strict";
  define([], function() {
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
      llogi("Added listener: TYPE = " + type);
      return clb;
    };
    EventDispatcher.prototype.remove = function(type, clb) {
      var ind;
      if (this.listeners[type] != null) {
        ind = this.listeners[type].indexOf(clb);
        if (ind !== -1) {
          this.listeners[type].splice(ind, 1);
        }
        if (ind !== -1) {
          return llogi("Removed listener: TYPE = " + type);
        }
      }
    };
    EventDispatcher.prototype.removeAll = function(type) {
      var key, keys, list, _i, _len, _results;
      if (type) {
        delete this.listeners[type];
        return llogi("Removed listeners: TYPE = " + type);
      } else {
        keys = Object.keys(this.listeners);
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          llogi("Removed listeners: KEY = " + key);
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
