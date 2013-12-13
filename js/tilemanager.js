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

      Tile.prototype.getLayers = function() {
        var l, out, _i, _len, _ref;
        out = [];
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          l = _ref[_i];
          if (l != null) {
            out.push(l);
          }
        }
        return out;
      };

      Tile.prototype.init = function(meta) {
        Tile.__super__.init.call(this, meta);
        this.on("LAYER_DESTROYED", function(layer) {
          llogd("layer destroyed " + layer);
          return this.layers[layer] = null;
        });
        return this;
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
        console.log("tile layer konstruktor");
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
        this.tile_id_map = {};
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
        var i, t;
        llogd("Loading tiles...");
        llogd(tiles);
        for (i in tiles) {
          t = tiles[i];
          console.log(t.name);
          console.log(t.id);
          this.add(t);
        }
        return this.map.renderer.createLayers([-1, -2, -3, -4, -5]);
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

      TileManager.prototype.newTileLayer = function(meta, layer) {
        return new TileLayer(meta, layer);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        return new Tile(meta);
      };

      TileManager.prototype.addTileLayerToHolder = function(row, col, layermeta, offset_x, offset_y, layer) {
        var ctx, holder, off_x, off_y, tile, x, y;
        if (layer == null) {
          layer = layermeta.layer;
        }
        holder = this.map.getTile(row, col);
        if (holder == null) {
          lloge("No holder!!!");
          return;
        }
        if (layermeta == null) {
          console.error("No layermeta!!!");
          return;
        }
        if (holder.containsLayer(layermeta, layer)) {
          console.warn("You can't add same layer " + layermeta.name + " twice");
          return;
        }
        x = (holder.col / 2) * this.map.tilew;
        y = (holder.row + ((holder.col % 2) / 2)) * this.map.tileh;
        tile = this.newTileLayer(layermeta, layer);
        if (tile.attr("group") === "default") {
          tile.attr("group", "layer_" + layer);
        }
        console.log(offset_y);
        console.log(offset_x);
        tile = holder.addTileLayer(tile, -(layer + 1));
        off_x = tile.sprite.w * 0.5 - this.map.tilew2;
        off_y = tile.sprite.h * 0.5 - this.map.tileh2;
        tile.attr("h", off_y);
        tile.setPosition(x, y - off_y);
        llogd("Adding to layer: " + layer);
        ctx = this.map.renderer.getLayerContext(layer);
        this.map.addEntityToQuadSpace(tile, ctx);
        return tile;
      };

      TileManager.prototype.saveMap = function() {
        var h, layer, map_c, map_r, meta, meta_id, out, t, t_col, t_row, tiles, _i, _j, _len, _len1, _ref;
        out = [];
        tiles = this.map.map.slice();
        map_r = this.map.nrows << 32;
        map_c = this.map.ncols << 16;
        out.push(map_r | map_c);
        for (_i = 0, _len = tiles.length; _i < _len; _i++) {
          t = tiles[_i];
          t_row = t.row << 32;
          t_col = t.col << 16;
          out.push(t_row | t_col);
          _ref = t.getLayers();
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            layer = _ref[_j];
            meta = this.findByName(layer.name);
            meta_id = meta.id << 32;
            h = layer.h << 16;
            out.push(h | meta_id);
          }
        }
        return out;
      };

      TileManager.prototype.loadMap = function(bitarray) {
        var map_c, map_r, mask, qword;
        mask = 0xFFFF;
        qword = bitarray.shift();
        map_r = (qword >> 32) & mask;
        return map_c = (qword >> 16) & mask;
      };

      return TileManager;

    })();
  });

}).call(this);
