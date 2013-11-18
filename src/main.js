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
    return require(["Halal", "Scene", "Entity", "SpriteEntity"], function(Halal, Scene, Entity, SpriteEntity) {
      var Bla, addRandom, bla, e, e1, e2;
      Hal.asm.loadSpritesFromFileList("assets/sprites/sprites.list");
      e = new Entity({
        shape: Hal.math.createRegularon(3, 45)
      });
      e1 = new SpriteEntity({
        sprite: "test/warhorse"
      });
      e2 = new Entity();
      e.attr("stroke_color", "green");
      e1.attr("stroke_color", "blue");
      e1.attr("fill_color", "green");
      e1.attr("draw_shape", false);
      Bla = (function(_super) {
        __extends(Bla, _super);

        function Bla() {
          Bla.__super__.constructor.call(this);
          this.search_range = 50;
        }

        Bla.prototype.draw = function(delta) {
          var p, _i, _len, _ref;
          Bla.__super__.draw.call(this);
          _ref = this.entities;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            p.update(delta);
            p.draw(delta);
          }
          Hal.glass.ctx.setTransform(1, 0, 0, 1, -this.search_range * this.camera.zoom, -this.search_range * this.camera.zoom);
          return Hal.glass.strokeRect([this.mpos[0], this.mpos[1], 2 * this.search_range * this.camera.zoom, 2 * this.search_range * this.camera.zoom], "red");
        };

        return Bla;

      })(Scene);
      bla = new Bla();
      bla.attr("name", "Bla Scena");
      bla.attr("bg_color", "gray");
      Hal.addScene(bla);
      (addRandom = function() {
        var angle, ent, i, reg, scale, size, x, y, _results;
        i = 30;
        _results = [];
        while (i > 0) {
          x = bla.bounds[2] * Math.random();
          y = bla.bounds[3] * Math.random();
          scale = Math.random() * 2.5;
          angle = Math.random() * Math.PI * 2;
          size = Math.round(Math.random() * 50);
          reg = Math.round(3 + Math.random() * 17);
          ent = new Entity({
            x: x,
            y: y,
            scale: scale,
            angle: angle,
            shape: Hal.math.createRegularon(reg, size)
          });
          bla.addEntity(ent);
          log.debug(i);
          _results.push(i--);
        }
        return _results;
      })();
      e.attr("shape", Hal.math.createRegularon(3, 45));
      e.attr("scale", 1);
      e.attr("x", 100);
      e.attr("y", 50);
      e.attr("stroke_color", "white");
      e.attr("glow", true);
      e.attr("glow_color", "blue");
      e.attr("glow_amount", 32);
      e.attr("draw_origin", true);
      e1.attr("angle", 0);
      e1.attr("scale", 1);
      e1.attr("x", 150);
      e1.attr("y", 150);
      e1.attr("draw_origin", true);
      e2.attr("shape", Hal.math.createRegularon(4, 15));
      e2.attr("scale", 1);
      e2.attr("line_width", 3);
      e2.attr("x", 0);
      e2.attr("y", 0);
      e2.attr("stroke_color", "white");
      e2.attr("glow", true);
      e2.attr("glow_color", "green");
      e2.attr("glow_amount", 12);
      e.attr("draw_bbox", true);
      e1.attr("draw_bbox", true);
      e2.attr("draw_bbox", true);
      bla.addEntity(e);
      bla.addEntity(e1);
      e.addEntity(e2);
      log.debug([e.id, e1.id, e2.id]);
      return Hal.asm.on("SPRITES_LOADED", function() {
        Hal.start();
        Hal.fadeInViewport(1000);
        return Hal.debug(true);
      });
    });
  });

}).call(this);
