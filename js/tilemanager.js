(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["shape"], function(Shape) {
    var Tile, TileLayer, TileManager;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.layers = [null, null, null, null, null];
        return this;
      }

      Tile.prototype.containsLayer = function(layermeta, layer) {
        var layer_present;
        layer = layer || layermeta.layer;
        layer_present = this.layers[layer] != null;
        if (layer_present && this.layers[layer].name === layermeta.name) {
          return true;
        }
        return false;
      };

      Tile.prototype.addTileLayer = function(layerobj, layer) {
        if (this.layers[layer] != null) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = layerobj;
        layerobj.attr("holder", this);
        return layerobj;
      };

      Tile.prototype.init = function(meta) {
        Tile.__super__.init.call(this, meta);
        this.on("LAYER_DESTROYED", function(layer) {
          llogd("layer destroyed " + layer);
          return this.layers[layer] = null;
        });
        return this;
      };

      Tile.prototype.destroy = function() {
        Tile.__super__.destroy.call(this);
        return this.destroyMesh();
      };

      Tile.prototype.destroyMesh = function() {
        this._mesh = [];
        this._numvertices = 0;
      };

      return Tile;

    })(Shape);
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.setSprite(Hal.asm.getSprite(meta.sprite));
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
      }

      TileLayer.prototype.init = function(meta) {
        TileLayer.__super__.init.call(this, meta);
        this.on("SELECTED", function() {
          return console.log("I'm selected: " + (this.toString()));
        });
        return this.on("DESELECTED", function() {
          return console.log("I'm deselected: " + (this.toString()));
        });
      };

      TileLayer.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = true;
        }
        console.log("Destroying myself " + (this.toString()));
        if (this.holder != null) {
          this.holder.trigger("LAYER_DESTROYED", this.layer);
        }
        return TileLayer.__super__.destroy.call(this);
      };

      TileLayer.prototype.toString = function() {
        return "" + this.holder.row + ", " + this.holder.col;
      };

      return TileLayer;

    })(Shape);
    return TileManager = (function() {
      function TileManager(map, tileList) {
        var _this = this;
        this.map = map;
        if (tileList == null) {
          tileList = "";
        }
        this.tile_layer_map = {};
        this.tile_name_map = {};
        this._id = 0;
        Hal.on("TILE_MNGR_NEW_TILE", function(tile) {
          return _this.add(tile);
        });
        Hal.on("TILE_MNGR_LOAD_TILES", function(tiles) {
          return _this.load(tiles);
        });
      }

      TileManager.prototype.loadFromList = function(list) {
        var k, t, tiles, _results,
          _this = this;
        if (list == null) {
          list = "assets/TilesList.list";
        }
        Ajax.get("assets/amjad/TilesList.json", function(tiles) {});
        llogd("TileManager loaded tiles.");
        tiles = JSON.parse(tiles);
        _results = [];
        for (k in tiles) {
          t = tiles[k];
          _results.push(this.add(t));
        }
        return _results;
      };

      TileManager.prototype.load = function(tiles) {
        var i, t, _results;
        llogd("Loading tiles...");
        llogd(tiles);
        _results = [];
        for (i in tiles) {
          t = tiles[i];
          _results.push(this.add(t));
        }
        return _results;
      };

      TileManager.prototype.add = function(tile) {
        tile.id = ++this._id;
        this.tile_name_map[tile.name] = tile;
        if (this.tile_layer_map[tile.layer] == null) {
          this.tile_layer_map[tile.layer] = {};
        }
        return this.tile_layer_map[tile.layer][tile.name] = tile;
      };

      TileManager.prototype.removeByName = function(name) {
        var t;
        t = this.tile_name_map[name];
        delete this.tile_layer_map[t.layer][t.name];
        delete this.tile_name_map[t.name];
        return t = null;
      };

      TileManager.prototype.newTileLayer = function(meta, layer) {
        return new TileLayer(meta, layer);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        return new Tile(meta);
      };

      TileManager.prototype.addTileLayerToHolder = function(holder, layermeta, x, y, layer) {
        var tile;
        if (layer == null) {
          layer = layermeta.layer;
        }
        if (holder.containsLayer(layermeta, layer)) {
          console.warn("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if ((holder == null) || (layermeta == null)) {
          console.error("Holder or layermeta is null");
          return;
        }
        tile = this.newTileLayer(layermeta, layer);
        if (tile.attr("group") === "default") {
          tile.attr("group", "layer_" + layer);
        }
        tile = holder.addTileLayer(tile, layer);
        tile.setPosition(x, y);
        tile.attr("scene", this.map);
        this.map.quadtree.insert(tile);
        this.map.addEntity(tile);
        return tile;
      };

      return TileManager;

    })();
  });

}).call(this);
