(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["shape"], function(Shape) {
    var TileLayer;
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.setSprite(Hal.asm.getSprite(meta.sprite));
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
        this.h = 0;
        if (meta.group != null) {
          this.attr("group", meta.group);
        }
        this.attr("group", meta.layer);
      }

      TileLayer.prototype.attachToTile = function(tile) {
        this.tile = tile;
        return this.trigger("PLACED_ON_TILE");
      };

      TileLayer.prototype.init = function(meta) {
        return TileLayer.__super__.init.call(this, meta);
      };

      TileLayer.prototype.initListeners = function() {
        TileLayer.__super__.initListeners.call(this);
        this.on("SELECTED", function() {
          return console.log("I'm selected: " + (this.toString()));
        });
        return this.on("DESELECTED", function() {
          return console.log("I'm deselected: " + (this.toString()));
        });
      };

      TileLayer.prototype.destroy = function() {
        TileLayer.__super__.destroy.call(this);
        if (this.tile != null) {
          this.tile.removeLayer(this.layer);
        }
        return delete this.tile;
      };

      TileLayer.prototype.toString = function() {
        var _ref;
        return (_ref = this.tile) != null ? _ref.toString() : void 0;
      };

      return TileLayer;

    })(Shape);
    return TileLayer;
  });

}).call(this);
