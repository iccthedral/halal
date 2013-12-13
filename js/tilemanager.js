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
        layerobj.attr("holder", this);
        this.sortLayers();
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
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.setSprite(Hal.asm.getSprite(meta.sprite));
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
        this.h = 0;
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

      TileLayer.prototype.destroy = function() {
        TileLayer.__super__.destroy.call(this);
        if (this.holder != null) {
          this.holder.removeLayer(this.layer);
        }
        return delete this.holder;
      };

      TileLayer.prototype.toString = function() {
        return "" + this.holder.row + ", " + this.holder.col;
      };

      return TileLayer;

    })(Shape);
    TileManager = (function() {
      function TileManager(map, tileList) {
        var _this = this;
        this.map = map;
        if (tileList == null) {
          tileList = "";
        }
        this.tile_layer_map = {};
        this.tile_name_map = {};
        this.tile_id_map = {};
        this._id = 0;
        this.max_layers = this.map.max_layers;
        Hal.on("TILE_MNGR_NEW_TILE", function(tile) {
          return _this.add(tile);
        });
        Hal.on("TILE_MNGR_LOAD_TILES", function(tiles) {
          return _this.load(tiles);
        });
      }

      TileManager.prototype.loadFromList = function(list) {
        var tiles,
          _this = this;
        if (list == null) {
          list = "assets/TilesList.list";
        }
        Ajax.get("assets/amjad/TilesList.json", function(tiles) {});
        llogd("TileManager loaded tiles.");
        tiles = JSON.parse(tiles);
        return this.load(tiles);
      };

      TileManager.prototype.load = function(tiles) {
        var i, t;
        llogd("Loading tiles...");
        for (i in tiles) {
          t = tiles[i];
          this.add(t);
        }
        return this.map.trigger("META_LAYERS_LOADED");
      };

      TileManager.prototype.add = function(tile) {
        this.tile_name_map[tile.name] = tile;
        this.tile_id_map[tile.id] = tile;
        if (this.tile_layer_map[tile.layer] == null) {
          this.tile_layer_map[tile.layer] = {};
        }
        return this.tile_layer_map[tile.layer][tile.name] = tile;
      };

      TileManager.prototype.getAllByLayer = function(layer) {
        return this.tile_layer_map[layer];
      };

      TileManager.prototype.findByName = function(name) {
        var t;
        t = this.tile_name_map[name];
        if (t == null) {
          llogw("No tile with name: " + name);
        }
        return t;
      };

      TileManager.prototype.findById = function(id) {
        var t;
        t = this.tile_id_map[id];
        if (t == null) {
          llogw("No tile with id: " + id);
        }
        return t;
      };

      TileManager.prototype.removeByName = function(name) {
        var t;
        t = this.tile_name_map[name];
        delete this.tile_layer_map[t.layer][t.name];
        delete this.tile_name_map[t.name];
        delete this.tile_id_map[t.id];
        return t = null;
      };

      TileManager.prototype.removeById = function(id) {
        var t;
        t = this.tile_id_map[id];
        delete this.tile_layer_map[t.layer][t.name];
        delete this.tile_id_map[t.id];
        delete this.tile_name_map[t.name];
        return t = null;
      };

      TileManager.prototype.newTileLayer = function(meta) {
        return new TileLayer(meta);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        var p, tile_holder, _i, _ref;
        tile_holder = new Tile(meta);
        for (p = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; p = 0 <= _ref ? ++_i : --_i) {
          tile_holder.layers.push(null);
        }
        return tile_holder;
      };

      TileManager.prototype.addTileLayerToHolderByLayerId = function(row, col, layer_id, offset_x, offset_y) {
        var meta;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        meta = this.findById(layer_id);
        return this.addTileLayerToHolder(row, col, meta, offset_x, offset_y);
      };

      TileManager.prototype.addTileLayerToHolder = function(row, col, layermeta, offset_x, offset_y) {
        var ctx, holder, off_x, off_y, tile, x, y;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        holder = this.map.getTile(row, col);
        if (holder == null) {
          lloge("No holder!!!");
          return;
        }
        if (layermeta == null) {
          lloge("No layermeta!!!");
          return;
        }
        if (holder.containsLayer(layermeta)) {
          llogw("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if (layermeta.layer > this.max_layers) {
          lloge("You can't have more than " + this.max_layers + " layers");
          return;
        }
        x = (holder.col / 2) * this.map.tilew;
        y = (holder.row + ((holder.col % 2) / 2)) * this.map.tileh;
        tile = this.newTileLayer(layermeta);
        if (tile.attr("group") === "default") {
          tile.attr("group", "layer_" + tile.layer);
        }
        tile = holder.addTileLayer(tile);
        off_x = tile.sprite.w * 0.5 - this.map.tilew2;
        off_y = tile.sprite.h * 0.5 - this.map.tileh2;
        tile.attr("h", off_y);
        tile.setPosition(x, y - off_y);
        ctx = this.map.renderer.getLayerContext(tile.layer);
        this.map.addEntityToQuadSpace(tile, ctx);
        return tile;
      };

      return TileManager;

    })();
    return TileManager;
  });

}).call(this);
