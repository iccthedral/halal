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
