(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["spriteentity"], function(SpriteEntity) {
    var Tile, TileLayer, TileManager;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.layers = [null, null, null, null, null];
      }

      Tile.prototype.addTileLayer = function(tile, layer) {
        var ent, layer_present;
        layer = layer || tile.layer;
        layer_present = this.layers[layer] != null;
        if (layer_present && this.layers[layer].name === tile.name) {
          Hal.log.debug("You're trying to add the same layer");
          return;
        }
        if (layer_present) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = tile;
        ent = this.addEntityToQuadspace(tile);
        ent.attr("shape", this.shape);
        ent.attr("draw_shape", false);
        return ent;
      };

      Tile.prototype.init = function() {
        Tile.__super__.init.call(this);
        return this.on("LAYER_DESTROYED", function(layer) {
          Hal.log.debug("layer destroyed " + layer);
          return this.layers[layer] = null;
        });
      };

      Tile.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = false;
        }
        this.parent.trigger("ENTITY_DESTROYED", this);
        return Tile.__super__.destroy.call(this, destroy_children);
      };

      return Tile;

    })(SpriteEntity);
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
        this.on("SELECTED", function() {
          this.attr("glow", true);
          this.attr("glow_color", "blue");
          this.attr("draw_shape", true);
          this.attr("stroke_color", "white");
          return Hal.tween(this, "line_width", 200, 1, 14.5, 5);
        });
        this.on("DESELECTED", function() {
          this.attr("line_width", 1);
          this.attr("glow", false);
          return this.attr("draw_shape", false);
        });
      }

      TileLayer.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = true;
        }
        Hal.log.debug("destroying myself");
        Hal.log.debug(this);
        if (this.parent != null) {
          this.parent.trigger("LAYER_DESTROYED", this.layer);
        }
        return TileLayer.__super__.destroy.call(this, destroy_children);
      };

      return TileLayer;

    })(SpriteEntity);
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
        Hal.log.debug("TileManager loaded tiles.");
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
        Hal.log.debug("Loading tiles...");
        Hal.log.debug(tiles);
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

      TileManager.prototype.newTileLayer = function(meta) {
        return new TileLayer(meta);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        meta.parent = this.map;
        return new Tile(meta);
      };

      TileManager.prototype.addTileLayerToHolder = function(holder, tile, layer, x_offset, y_offset) {
        if (layer == null) {
          layer = tile.layer;
        }
        if (x_offset == null) {
          x_offset = 0;
        }
        if (y_offset == null) {
          y_offset = 0;
        }
        if ((holder == null) || (tile == null)) {
          Hal.log.debug("holder or tile is null");
          return;
        }
        if (tile.attr("group") === "default") {
          tile.attr("group", "layer_" + layer);
        }
        Hal.log.debug("x_offset: " + x_offset);
        Hal.log.debug("y_offset: " + y_offset);
        tile = holder.addTileLayer(tile, layer);
        if (tile == null) {
          return;
        }
        Hal.log.debug(x_offset);
        Hal.log.debug(y_offset);
        tile.attr("w", x_offset);
        tile.attr("h", y_offset);
        return tile;
      };

      return TileManager;

    })();
  });

}).call(this);
