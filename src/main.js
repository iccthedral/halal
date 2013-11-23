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
        exports: "log"
      }
    }
  });

  require(["loglevel", "halal"], function(log, halal) {
    window.log = log;
    log.setLevel(log.levels.DEBUG);
    return halal;
  });

}).call(this);
