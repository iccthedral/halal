(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity", "Renderer"], function(HalalEntity, Renderer) {
    var Scene;
    Scene = (function(_super) {
      __extends(Scene, _super);

      function Scene(meta) {
        var _this = this;
        if (meta == null) {
          meta = {};
        }
        Scene.__super__.constructor.call(this);
        this.name = meta.name ? meta.name : Hal.ID();
        this.bounds = meta.bounds ? meta.bounds : Hal.viewportBounds();
        this.draw_loop = Hal.on("ENTER_FRAME", function(delta) {
          Hal.glass.ctx.clearRect(0, 0, _this.bounds[2], _this.bounds[3]);
          _this.update(delta);
          return _this.draw(delta);
        });
        this.bg_color = meta.bg_color ? meta.bg_color : "white";
        this.entities = [];
        this.camera = null;
      }

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        return ent.attr("parent", this);
      };

      Scene.prototype.destroy = function() {
        return Hal.remove("ENTER_FRAME", this.draw_loop);
      };

      Scene.prototype.update = function() {};

      Scene.prototype.draw = function() {};

      Scene.prototype.init = function() {};

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
