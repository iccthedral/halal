(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["scene", "spriteentity", "entity", "tilemanager"], function(Scene, SpriteEntity, Entity, TileManager) {
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
        meta.cam_bounds = [this.tilew2, this.tileh2, this.ncols * this.tilew2, (this.nrows - 0.5) * this.tileh];
        Hal.log.debug("camera bounds: " + meta.cam_bounds);
        IsometricMap.__super__.constructor.call(this, meta);
        this.iso_shape = [[-this.tilew2, 0], [0, this.tileh2], [this.tilew2, 0], [0, -this.tileh2]];
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

      IsometricMap.prototype.showRegion = function(pos, range_row, range_col) {
        var b_left, b_right, c, c_col, c_row, shape, t_left, t_right;
        c = this.getTileAt(this.worldToLocal(pos));
        if (c == null) {
          return;
        }
        c_row = c.row;
        c_col = c.col;
        if (c_col % 2 === 0) {
          range_row -= 1;
        }
        t_left = this.getTile(Hal.math.clamp(c_row - range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col - range_col, c_col, this.ncols - 1));
        b_right = this.getTile(Hal.math.clamp(c_row + range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col + range_col, c_col, this.ncols - 1));
        t_right = this.getTile(Hal.math.clamp(c_row - range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col + range_col, c_col, this.ncols - 1));
        b_left = this.getTile(Hal.math.clamp(c_row + range_row, c_row, this.nrows - 1), Hal.math.clamp(c_col - range_col, c_col, this.ncols - 1));
        if (!((t_left != null) && (t_right != null) && (b_left != null) && (b_right != null))) {
          return;
        }
        shape = [t_left.x - (t_right.x - t_left.x), t_left.y - (b_right.y - t_left.y), (t_right.x - t_left.x) * 2, (b_right.y - t_left.y) * 2];
        return this.g.strokeRect(shape, "cyan");
      };

      IsometricMap.prototype.drawStat = function() {
        IsometricMap.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          Hal.glass.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 195);
          Hal.glass.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 210);
          Hal.glass.ctx.fillText(this.info.tile_x + this.tile_under_mouse.x, 0, 225);
          Hal.glass.ctx.fillText(this.info.tile_y + this.tile_under_mouse.y, 0, 240);
        }
        Hal.glass.ctx.fillText(this.info.start_row + this.display.startr, 0, 115);
        Hal.glass.ctx.fillText(this.info.start_col + this.display.startc, 0, 130);
        Hal.glass.ctx.fillText(this.info.end_row + this.display.endr, 0, 145);
        Hal.glass.ctx.fillText(this.info.end_col + this.display.endc, 0, 160);
        return Hal.glass.ctx.fillText(this.info.cam_mouse + ("" + ((-this.camera.x + this.mpos[0]).toFixed(2)) + ", " + ((-this.camera.y + this.mpos[1]).toFixed(2))), 0, 255);
      };

      IsometricMap.prototype.init = function() {
        var _this = this;
        IsometricMap.__super__.init.call(this);
        /*
            @todo: Ovo posle treba ukloniti!
        */

        this.camera.on("CHANGE", function() {
          return _this.calcDrawingArea();
        });
        Hal.on("LEFT_CLICK", function() {
          return _this.current_mode_clb();
        });
        /*map editor stuff*/

        Hal.on("EDITOR_MODE_CHANGED", function(current_mode) {
          _this.current_mode = current_mode;
          if (_this.supported_modes[_this.current_mode]) {
            _this.current_mode_clb = _this.supported_modes[_this.current_mode];
          } else {
            Hal.log.warn("Mode " + mode + " not supported");
          }
          return Hal.log.debug(_this.current_mode);
        });
        Hal.on("TILE_LAYER_SELECTED", function(tile) {
          Hal.log.debug("Tile layer selected from editor");
          Hal.log.debug(tile);
          _this.selected_tile = tile;
          _this.selected_tile_sprite = Hal.asm.getSprite(_this.selected_tile.sprite);
          _this.selected_tile_x = _this.selected_tile_sprite.w2 - _this.tilew2;
          return _this.selected_tile_y = _this.selected_tile_sprite.h2 - _this.tileh2;
        });
        Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          return _this.camera.lerpTo(_this.localToWorld(_this.world_pos));
        });
        Hal.on("MOUSE_MOVE", function(pos) {
          var t;
          t = _this.getTileAt(_this.worldToLocal(pos));
          if (t !== _this.tile_under_mouse) {
            if (_this.tile_under_mouse) {
              _this.tile_under_mouse.attr("line_width", 1);
              _this.tile_under_mouse.attr("glow", false);
              _this.tile_under_mouse.attr("draw_shape", false);
            }
            _this.tile_under_mouse = t;
            if (t != null) {
              t.attr("glow", true);
              t.attr("draw_shape", true);
              t.attr("stroke_color", "white");
              return Hal.tween(t, "line_width", 400, 1, 3.5, 1);
            }
          }
        });
        return this.initMap();
      };

      IsometricMap.prototype.calcDrawingArea = function() {
        /* mozda da pomerim granicu, jel da?*/

        var sc, sr, top_left;
        this.old_camx = this.camera.x;
        if ((this.camera.x % this.tilew2) === 0) {
          Hal.log.debug("oh jea");
          this.camera_moved = true;
        }
        top_left = this.getTileAt(this.worldToLocal([0, 0]));
        if (top_left == null) {
          sc = 0;
          sr = 0;
        } else {
          sc = top_left.col;
          sr = top_left.row;
        }
        return this.display = {
          startc: sc,
          endr: this.maxRows(),
          startr: sr,
          endc: this.maxCols()
        };
      };

      IsometricMap.prototype.maxRows = function() {
        return Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.camera.zoom)) + 4));
      };

      IsometricMap.prototype.maxCols = function() {
        return Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.camera.zoom)) + 4));
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
        Hal.log.debug("max rows: " + (this.maxRows()));
        Hal.log.debug("max cols: " + (this.maxCols()));
        Hal.log.debug("total at this resolution: " + (this.maxRows() * this.maxCols()));
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
              "sprite": "test/grid_unit_128x64"
            });
            this.map[k] = this.addEntityToQuadspace(t);
            k++;
          }
        }
        t2 = performance.now() - t1;
        Hal.log.debug("it took: " + t1);
        this.calcDrawingArea();
        return this.camera.trigger("CHANGE");
      };

      IsometricMap.prototype.processMouseClick = function() {
        var tile, _i, _len, _ref;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        _ref = this.quadspace.searchInRange(this.world_pos, this.search_range, this);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tile = _ref[_i];
          if (!tile.inShapeBounds(this.world_pos)) {
            continue;
          }
          Hal.log.debug(tile);
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
          Hal.log.debug("clicked layer");
          Hal.log.debug(this.clicked_layer);
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          return this.clicked_layer.trigger("LEFT_CLICK");
        }
      };

      IsometricMap.prototype.splitMap = function() {
        var map;
        return map = {
          nw: null,
          ns: null,
          s: null,
          w: null,
          e: null,
          n: null,
          sw: null,
          se: null,
          c: null
        };
      };

      IsometricMap.prototype.loadRandomMap = function(i, data) {
        var j, k, t, _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = this.ncols - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push((function() {
            var _j, _ref1, _results1;
            _results1 = [];
            for (j = _j = 0, _ref1 = this.nrows - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
              t = this.getTile(i, j);
              k = 5;
              _results1.push((function() {
                var _results2;
                _results2 = [];
                while (k > 0 && !t.isFull()) {
                  this.addRandomLayer(t);
                  _results2.push(--k);
                }
                return _results2;
              }).call(this));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      IsometricMap.prototype.addRandomLayer = function(t) {
        var index, randt, randts, tileLayer, tiles, tkeys, tskeys;
        tskeys = Object.keys(this.tmngr.Tiles);
        randts = ~~(Math.random() * tskeys.length);
        index = tskeys[randts];
        tiles = amj.tmngr.Tiles[index];
        tkeys = Object.keys(tiles);
        randt = ~~(Math.random() * tkeys.length);
        index = tkeys[randt];
        return tileLayer = tiles[index];
      };

      IsometricMap.prototype.genRandomMap = function() {};

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);
