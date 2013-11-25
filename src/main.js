(function() {
  "use strict";
  require.config({
    urlArgs: Math.random(),
    baseUrl: "src",
    paths: {
      "loglevel": "../vendor/loglevel/dist/loglevel"
    }
  });

  require(["halal"], function(halal) {});

}).call(this);
