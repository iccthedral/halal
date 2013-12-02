(function() {
  "use strict";
  require.config({
    urlArgs: Math.random(),
    baseUrl: "js",
    paths: {
      "requireLib": "../vendor/requirejs/require",
      "loglevel": "../vendor/loglevel/dist/loglevel"
    }
  });

  require(["halal"], function(halal) {});

}).call(this);
