(function() {
  "use strict";
  define(["tile", "tilelayer"], function(Tile, TileLayer) {
    var TileManager;
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
        return this.map.trigger("TILE_MANAGER_LOADED");
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

      TileManager.prototype.newTile = function(meta) {
        var p, tile, _i, _ref;
        tile = new Tile(meta);
        for (p = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; p = 0 <= _ref ? ++_i : --_i) {
          tile.layers.push(null);
        }
        return tile;
      };

      TileManager.prototype.addTileLayerMetaByLayerId = function(row, col, layer_id, offset_x, offset_y) {
        var meta;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        meta = this.findById(layer_id);
        return this.addTileLayerMeta(row, col, meta, offset_x, offset_y);
      };

      TileManager.prototype.addTileLayerInstance = function(row, col, tilelayerobj, override) {
        var ctx, layermeta, off_x, off_y, tile, x, y;
        tile = this.map.getTile(row, col);
        if (tile == null) {
          lloge("No tile at " + row + ":" + col + "!!!");
          return;
        }
        layermeta = tilelayerobj.meta;
        if (layermeta == null) {
          lloge("No layermeta!!!");
          return;
        }
        if (tile.containsLayer(layermeta) && !override) {
          llogw("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if (layermeta.layer > this.max_layers) {
          lloge("You can't have more than " + this.max_layers + " layers");
          return;
        }
        x = (tile.col / 2) * this.map.tilew;
        y = (tile.row + ((tile.col % 2) / 2)) * this.map.tileh;
        tile.addTileLayer(tilelayerobj);
        off_x = tile.sprite.w * 0.5 - this.map.tilew2;
        off_y = tile.sprite.h * 0.5 - this.map.tileh2;
        tilelayerobj.attr("h", off_y);
        tilelayerobj.setPosition(x, y - off_y);
        ctx = this.map.renderer.getLayerContext(tilelayerobj.layer);
        this.map.addEntityToQuadSpace(tilelayerobj, ctx);
        tilelayerobj.trigger("ON_MAP");
        return tile;
      };

      TileManager.prototype.addTileLayerMeta = function(row, col, layermeta, offset_x, offset_y) {
        var ctx, layerobj, off_x, off_y, tile, x, y;
        if (offset_x == null) {
          offset_x = 0;
        }
        if (offset_y == null) {
          offset_y = 0;
        }
        tile = this.map.getTile(row, col);
        if (tile == null) {
          lloge("No holder!!!");
          return;
        }
        if (layermeta == null) {
          lloge("No layermeta!!!");
          return;
        }
        if (tile.containsLayer(layermeta)) {
          llogw("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        if (layermeta.layer > this.max_layers) {
          lloge("You can't have more than " + this.max_layers + " layers");
          return;
        }
        x = (tile.col / 2) * this.map.tilew;
        y = (tile.row + ((tile.col % 2) / 2)) * this.map.tileh;
        layerobj = this.newTileLayer(layermeta);
        tile.addTileLayer(layerobj);
        off_x = layerobj.sprite.w * 0.5 - this.map.tilew2;
        off_y = layerobj.sprite.h * 0.5 - this.map.tileh2;
        layerobj.attr("h", off_y);
        layerobj.setPosition(x, y - off_y);
        ctx = this.map.renderer.getLayerContext(layerobj.layer);
        this.map.addEntityToQuadSpace(layerobj, ctx);
        layerobj.trigger("ON_MAP");
        return layerobj;
      };

      TileManager.prototype.loadTileLayerById = function(tile, id) {
        return this.addTileLayerMetaByLayerId(tile.row, tile.col, id);
      };

      return TileManager;

    })();
    return TileManager;
  });

}).call(this);
