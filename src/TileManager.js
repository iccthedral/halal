(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["SpriteEntity"], function(SpriteEntity) {
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
          log.debug("You're trying to add the same layer");
          return;
        }
        if (layer_present) {
          this.layers[layer].destroy();
        }
        this.layers[layer] = tile;
        ent = this.addEntityToQuadspace(tile);
        ent.attr("shape", this.shape);
        return ent.attr("draw_shape", false);
      };

      Tile.prototype.update = function(delta) {
        var layer, _i, _len, _ref, _results;
        Tile.__super__.update.call(this, delta);
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          if (layer != null) {
            _results.push(layer.update(delta));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Tile.prototype.draw = function(delta) {
        var layer, _i, _len, _ref, _results;
        Tile.__super__.draw.call(this, delta);
        _ref = this.layers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          if (layer != null) {
            _results.push(layer.draw(delta));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return Tile;

    })(SpriteEntity);
    TileLayer = (function(_super) {
      __extends(TileLayer, _super);

      function TileLayer(meta) {
        TileLayer.__super__.constructor.call(this, meta);
        this.name = meta.name != null ? meta.name : "" + this.id;
        this.layer = meta.layer != null ? meta.layer : 0;
      }

      TileLayer.prototype.destroy = function(destroy_children) {
        if (destroy_children == null) {
          destroy_children = true;
        }
        log.debug("destroying myself");
        log.debug(this);
        this.parent.layers[this.layer] = null;
        return TileLayer.__super__.destroy.call(this, destroy_children);
      };

      return TileLayer;

    })(SpriteEntity);
    return TileManager = (function() {
      function TileManager(tileList) {
        var _this = this;
        if (tileList == null) {
          tileList = "";
        }
        this.TilesByID = {};
        this.TilesByName = {};
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
        log.debug("TileManager loaded tiles.");
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
        log.debug("Loading tiles...");
        log.debug(tiles);
        _results = [];
        for (i in tiles) {
          t = tiles[i];
          _results.push(this.add(t));
        }
        return _results;
      };

      TileManager.prototype.add = function(tile) {
        tile.id = ++this._id;
        this.TilesByName[tile.name] = tile;
        return this.TilesByID[tile.id] = tile;
      };

      TileManager.prototype.removeByName = function(name) {
        var t;
        t = this.TilesByName[name];
        delete this.TilesByID[t.id];
        delete this.TilesByName[t.name];
        return t = null;
      };

      TileManager.prototype.newTileLayer = function(meta) {
        return new TileLayer(meta);
      };

      TileManager.prototype.newTileHolder = function(meta) {
        return new Tile(meta);
      };

      TileManager.prototype.addTileLayerToHolder = function(holder, tile, layer) {
        tile.attr("draw_bbox", true);
        if ((holder == null) || (tile == null)) {
          log.debug("holder or tile is null");
          return;
        }
        return holder.addTileLayer(tile, layer);
      };

      return TileManager;

    })();
  });

}).call(this);
