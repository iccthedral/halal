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
      var Bla, bla, ent, _ref;
      log.debug("wtf");
      ent = new Entity({
        shape: Hal.math.createRegularon(12, 30)
      });
      ent.attr("stroke_color", "blue");
      ent.attr("fill_color", "green");
      Bla = (function(_super) {
        __extends(Bla, _super);

        function Bla() {
          _ref = Bla.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        Bla.prototype.draw = function(delta) {
          var p, _i, _len, _ref1, _results;
          Hal.glass.ctx.fillStyle = this.bg_color;
          Hal.glass.ctx.fillRect(this.bounds[0], this.bounds[1], this.bounds[2], this.bounds[3]);
          Hal.glass.ctx.fill();
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
      bla.addEntity(ent);
      Hal.addScene(bla);
      return Hal.start();
    });
  });

}).call(this);
