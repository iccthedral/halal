(function() {
  "use strict";
  define([], function() {
    var Logger;
    Logger = {
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
          return window.llogi = window.lloge = window.llogd = window.llogw = function() {};
        }
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
