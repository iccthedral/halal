(function() {
  "use strict";
  define([], function() {
    var TileManager;
    return TileManager = (function() {
      function TileManager(tileList) {
        var _this = this;
        if (tileList == null) {
          tileList = "";
        }
        this.Tiles = [];
        this.TilesByName = {};
        Hal.on("TILE_ADDED", function(tile) {
          return _this.add(tile);
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

      TileManager.prototype.add = function(tile) {
        this.TilesByName[tile.name] = tile;
        return this.Tiles[tile.id] = tile;
      };

      return TileManager;

    })();
  });

}).call(this);
