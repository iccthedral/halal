(function() {
  define([], function() {
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
