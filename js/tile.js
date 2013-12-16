(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["shape"], function(Shape) {
    var Tile;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.layers = new Array();
        return this;
      }

      Tile.prototype.containsLayer = function(layermeta) {
        var layer;
        layer = layermeta["layer"];
        if ((this.layers[layer] != null) && (this.layers[layer].name === layermeta.name)) {
          return true;
        }
        return false;
      };

      Tile.prototype.addTileLayer = function(layerobj) {
        var layer;
        layer = layerobj.layer;
        console.debug("Adding layer to " + layer + " at " + this.row + ", " + this.col);
        if (this.layers[layer] != null) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = layerobj;
        this.sortLayers();
        layerobj.attachToTile(this);
        return layerobj;
      };

      Tile.prototype.getLayers = function() {
        return this.layers.slice();
      };

      Tile.prototype.removeLayer = function(layer) {
        if (this.layers[layer] != null) {
          this.layers.splice(layer, 1);
          return this.sortLayers();
        }
      };

      Tile.prototype.init = function(meta) {
        Tile.__super__.init.call(this, meta);
        return this;
      };

      Tile.prototype.sortLayers = function() {
        return this.layers.sort(function(a, b) {
          if ((a == null) || (b == null)) {
            return 0;
          }
          return a.layer - b.layer;
        });
      };

      Tile.prototype.destroyMesh = function() {
        this._mesh = null;
        Tile.__super__.destroyMesh.call(this);
      };

      return Tile;

    })(Shape);
    return Tile;
  });

}).call(this);
