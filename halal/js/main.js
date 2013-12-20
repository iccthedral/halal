(function() {
  "use strict";
  require.config({
    urlArgs: Math.random(),
    baseUrl: "js",
    paths: {
      "requireLib": "../vendor/requirejs/require"
    }
  });

  require(["halal"], function(halal) {
    return halal;
  });

}).call(this);
