(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

  require(["loglevel"], function(log) {
    window.log = log;
    return require(["Halal", "Scene", "Entity"], function(Halal, Scene, Entity) {
      var Bla, bla, e, e1, e2, sc, _ref;
      log.debug("wtf");
      e = new Entity({
        x: 750,
        y: 100,
        shape: Hal.math.createRegularon(5, 30)
      });
      e1 = new Entity({
        shape: Hal.math.createRegularon(6, 100)
      });
      e.attr("stroke_color", "green");
      e1.attr("stroke_color", "blue");
      e1.attr("fill_color", "green");
      Bla = (function(_super) {
        __extends(Bla, _super);

        function Bla() {
          _ref = Bla.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        Bla.prototype.draw = function(delta) {
          var p, _i, _len, _ref1, _results;
          _ref1 = this.entities;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            p = _ref1[_i];
            p.update(delta);
            _results.push(p.draw(delta));
          }
          return _results;
        };

        return Bla;

      })(Scene);
      bla = new Bla({
        name: "bla scena"
      });
      bla.attr("bg_color", "gray");
      Hal.start();
      Hal.addScene(bla);
      bla.addEntity(e);
      bla.addEntity(e1);
      e2 = new Entity();
      bla.addEntity(e2);
      Hal.fadeInViewport(1000);
      /*
       script 1
      */

      Hal.debug(true);
      sc = Hal.scenes[0];
      e.attr("shape", Hal.math.createRegularon(3, 45));
      e.attr("scale", 1);
      e.attr("line_width", 9);
      e.attr("x", 0);
      e.attr("y", 0);
      e.attr("stroke_color", "white");
      e.attr("glow", true);
      e.attr("glow_color", "blue");
      e.attr("glow_amount", 32);
      e.attr("angle", -Math.PI / 2);
      e.tween({
        attr: "x",
        duration: 5000,
        from: e.attr("x"),
        to: 700,
        repeat: 1
      }).tween({
        attr: "y",
        duration: 5000,
        from: e.attr("y"),
        to: 300,
        repeat: 1
      });
      e.attr("draw_origin", true);
      e1.attr("shape", Hal.math.createRegularon(6, 25));
      e1.attr("angle", 0);
      e1.attr("scale", 1);
      e1.attr("line_width", 4);
      e1.attr("stroke_color", "white");
      e1.attr("glow", true);
      e1.attr("glow_color", "yellow");
      e1.attr("glow_amount", 22);
      e1.tween({
        attr: "scale",
        duration: 1000,
        from: 0.5,
        to: 2.5,
        repeat: 2
      });
      e1.tween({
        attr: "angle",
        duration: 2000,
        from: e1.attr("angle"),
        to: 2 * Math.PI,
        repeat: 5
      }).tween({
        attr: "line_width",
        duration: 100,
        from: e1.attr("line_width"),
        to: 116.0,
        repeat: 150
      });
      e1.attr("draw_origin", true);
      e.addEntity(e2);
      e2.attr("shape", Hal.math.createRegularon(7, 15));
      e2.attr("scale", 1);
      e2.attr("line_width", 3);
      e2.attr("x", 0);
      e2.attr("y", 20);
      e2.attr("stroke_color", "white");
      e2.attr("glow", true);
      e2.attr("glow_color", "green");
      e2.attr("glow_amount", 12);
      return e2.tween({
        attr: "angle",
        duration: 5000,
        from: e2.attr("angle"),
        to: 2 * Math.PI,
        repeat: 5
      }).tween({
        attr: "line_width",
        duration: 2000,
        from: e1.attr("line_width"),
        to: 16.0,
        repeat: 10
      });
    });
  });

}).call(this);
