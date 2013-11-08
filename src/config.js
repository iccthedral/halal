(function() {
  require.config = {
    urlArgs: Math.random(),
    baseUrl: "src",
    paths: {
      "loglevel": "../vendor/loglevel/dist/loglevel",
      "jquery": "../vendor/jquery/jquery",
      "jquery-ui": "../vendor/jquery-ui/ui/jquery-ui",
      "jquery-contextmenu": "../vendor/jquery.contextmenu"
    },
    shim: {
      "jquery-ui": {
        exports: "$",
        deps: ['jquery', 'jquery-contextmenu']
      },
      "jquery-contextmenu": {
        exports: "$",
        deps: ["jquery"]
      },
      "loglevel": {
        exports: "log"
      }
    }
  };

}).call(this);
