(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["scene", "shape", "tilemanager"], function(Scene, Entity, TileManager) {
    var IsometricMap;
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        var hittest, i, j, _i, _len, _ref,
          _this = this;
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = meta.rows;
        this.ncols = meta.cols;
        this.tm = new TileManager(this);
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.translate_x = 0;
        this.max_rows = this.nrows - 1;
        this.max_cols = this.ncols - 1;
        this.selected_tile = null;
        this.selected_tile_x = 0;
        this.selected_tile_y = 0;
        this.selected_tile_sprite = null;
        this.old_camx = 0;
        this.on_exit_frame = null;
        this.supported_modes = {
          "mode-default": function() {
            _this.processMouseClick();
          },
          "mode-erase": function() {
            _this.processMouseClick();
            if ((_this.clicked_layer == null) || _this.clicked_layer.animating) {
              return;
            }
            _this.clicked_layer.tween({
              attr: "h",
              from: 0,
              to: 100,
              duration: 500
            }).tween({
              attr: "opacity",
              from: 1,
              to: 0,
              duration: 700
            }).done(function() {
              return this.destroy();
            });
            return _this.clicked_layer = null;
          },
          "mode-place": function() {
            var t;
            t = _this.tm.addTileLayerToHolder(_this.tile_under_mouse, _this.tm.newTileLayer(_this.selected_tile), _this.selected_tile.layer, _this.selected_tile_x, _this.selected_tile_y);
          }
        };
        this.camera_moved = false;
        this.current_mode = "mode-default";
        this.current_mode_clb = this.supported_modes[this.current_mode];
        meta.world_bounds = [this.tilew2, this.tileh2, this.ncols * this.tilew2, (this.nrows - 0.5) * this.tileh];
        llogd("camera bounds: " + meta.world_bounds);
        IsometricMap.__super__.constructor.call(this, meta);
        this.iso_shape = [Hal.Vec2.from(-this.tilew2, 0), Hal.Vec2.from(0, this.tileh2), Hal.Vec2.from(this.tilew2, 0), Hal.Vec2.from(0, -this.tileh2)];
        this.display = {
          startr: 0,
          endr: 0,
          startc: 0,
          endc: 0
        };
        this.info = {
          row: "row: ",
          col: "col: ",
          tilename: "tile: ",
          start_row: "starting row: ",
          start_col: "starting col: ",
          end_row: "end row: ",
          end_col: "end_col: ",
          tile_x: "tile_x: ",
          tile_y: "tile_y: ",
          cam_mouse: "camera_mouse: "
        };
        this.mask = Hal.asm.getSprite("test/tilemask_128x64");
        hittest = Hal.dom.createCanvas(this.tilew, this.tileh).getContext("2d");
        hittest.drawImage(this.mask.img, 0, 0);
        this.mask_data = hittest.getImageData(0, 0, this.tilew, this.tileh).data;
        _ref = this.mask_data;
        for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
          i = _ref[j];
          this.mask_data[j] = i < 120;
        }
        this.over = {
          "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64"),
          "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")
        };
        this.last_clicked_layer = null;
        this.tile_under_mouse = null;
      }

      IsometricMap.prototype.showRegion = function(pos, range_row, range_col) {};

      IsometricMap.prototype.drawStat = function() {
        return IsometricMap.__super__.drawStat.call(this);
      };

      IsometricMap.prototype.init = function() {
        var _this = this;
        IsometricMap.__super__.init.call(this);
        /*
            @todo: Ovo posle treba ukloniti!
        */

        Hal.on("LEFT_CLICK", function() {
          return _this.current_mode_clb();
        });
        /*map editor stuff*/

        Hal.on("EDITOR_MODE_CHANGED", function(current_mode) {
          _this.current_mode = current_mode;
          if (_this.supported_modes[_this.current_mode]) {
            _this.current_mode_clb = _this.supported_modes[_this.current_mode];
          } else {
            llogw("Mode " + mode + " not supported");
          }
          return llogd(_this.current_mode);
        });
        Hal.on("TILE_LAYER_SELECTED", function(tile) {
          llogd("Tile layer selected from editor");
          return llogd(tile);
        });
        Hal.on("MOUSE_MOVE", function(pos) {});
        return this.initMap();
      };

      IsometricMap.prototype.calcDrawingArea = function() {
        /* mozda da pomerim granicu, jel da?*/

      };

      IsometricMap.prototype.maxRows = function() {
        return Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.scale[0])) + 4));
      };

      IsometricMap.prototype.maxCols = function() {
        return Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.scale[1])) + 4));
      };

      IsometricMap.prototype.toOrtho = function(pos) {
        var coldiv, off_x, off_y, rowdiv, transp;
        coldiv = (pos[0] + this.tilew2) * this.tilew2prop;
        rowdiv = (pos[1] + this.tileh2) * this.tileh2prop;
        off_x = ~~((pos[0] + this.tilew2) - ~~(coldiv * 0.5) * this.tilew);
        off_y = ~~((pos[1] + this.tileh2) - ~~(rowdiv * 0.5) * this.tileh);
        transp = this.mask_data[(off_x + this.tilew * off_y) * 4 + 3];
        return [coldiv - (transp ^ !(coldiv & 1)), (rowdiv - (transp ^ !(rowdiv & 1))) / 2];
      };

      IsometricMap.prototype.getTile = function(row, col, dir) {
        if (dir == null) {
          dir = [0, 0];
        }
        return this.map[(col + dir[1]) + (row + dir[0]) * this.ncols];
      };

      IsometricMap.prototype.getTileAt = function(pos) {
        var coord;
        coord = this.toOrtho(pos);
        if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= this.nrows || coord[0] >= this.ncols) {
          return null;
        }
        return this.map[Math.floor(coord[0]) + Math.floor(coord[1]) * this.ncols];
      };

      IsometricMap.prototype.initMap = function() {
        var i, j, k, t, t1, t2, x, y, _i, _j, _ref, _ref1;
        this.clicked_layer = null;
        llogd("max rows: " + (this.maxRows()));
        llogd("max cols: " + (this.maxCols()));
        llogd("total at this resolution: " + (this.maxRows() * this.maxCols()));
        this.max_rows = this.maxRows();
        this.max_cols = this.maxCols();
        this.map = new Array(this.nrows * this.ncols);
        k = 0;
        t1 = performance.now();
        for (i = _i = 0, _ref = this.nrows - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          for (j = _j = 0, _ref1 = this.ncols - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
            x = (j / 2) * this.tilew;
            y = (i + ((j % 2) / 2)) * this.tileh;
            t = this.tm.newTileHolder({
              "shape": this.iso_shape,
              "draw_shape": false,
              "x": x,
              "y": y,
              "row": i,
              "col": j,
              "visible_sprite": true,
              "sprite": Hal.asm.getSprite("test/grid_unit_128x64")
            });
            this.map[k] = this.addEntity(t);
            k++;
          }
        }
        t2 = performance.now() - t1;
        return llogd("it took: " + t1);
      };

      IsometricMap.prototype.processMouseClick = function() {
        var tile, _i, _len, _ref;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        return;
        _ref = this.quadspace.searchInRange(this.world_pos, this.search_range, this);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tile = _ref[_i];
          if (!tile.inShapeBounds(this.world_pos)) {
            continue;
          }
          llogd(tile);
          if (this.clicked_layer == null) {
            this.clicked_layer = tile;
          } else {
            if ((tile.parent.col === this.clicked_layer.parent.col) && (tile.parent.row === this.clicked_layer.parent.row)) {
              if (tile.layer > this.clicked_layer.layer) {
                this.clicked_layer = tile;
              }
            } else if (tile.parent.row === this.clicked_layer.parent.row) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            } else if (tile.parent.col === this.clicked_layer.parent.col) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            } else if ((tile.parent.col !== this.clicked_layer.parent.col) && (tile.parent.row !== this.clicked_layer.parent.row)) {
              if (tile.h + tile.y > this.clicked_layer.h + this.clicked_layer.y) {
                this.clicked_layer = tile;
              }
            }
          }
        }
        if (this.clicked_layer != null) {
          llogd("clicked layer");
          llogd(this.clicked_layer);
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          return this.clicked_layer.trigger("LEFT_CLICK");
        }
      };

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);
