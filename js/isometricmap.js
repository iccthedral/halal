(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], function(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) {
    var IsometricMap;
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        var hittest, i, j, _i, _len, _ref,
          _this = this;
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = +meta.rows;
        this.ncols = +meta.cols;
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
            if (_this.tile_under_mouse == null) {
              return;
            }
            t = _this.tm.addTileLayerToHolder(_this.tile_under_mouse, _this.selected_tile, _this.tile_under_mouse.position[0], _this.tile_under_mouse.position[1]);
          }
        };
        this.camera_moved = false;
        this.current_mode = "mode-default";
        this.current_mode_clb = this.supported_modes[this.current_mode];
        this.world_bounds = [0, 0, (this.ncols - 1) * this.tilew2, (this.nrows - 0.5) * this.tileh];
        llogd("camera bounds: " + meta.world_bounds);
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
          tile_under_mouse: "Tile position: ",
          world_pos: "Mouse world position: "
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
        IsometricMap.__super__.constructor.call(this, meta);
      }

      IsometricMap.prototype.drawStat = function() {
        IsometricMap.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          Hal.glass.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 195);
          Hal.glass.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 210);
          Hal.glass.ctx.fillText(this.info.tile_under_mouse + Vec2.str(this.tile_under_mouse.position), 0, 225);
          return Hal.glass.ctx.fillText(this.info.world_pos + Vec2.str(this.world_pos), 0, 240);
        }
      };

      IsometricMap.prototype.screenToWorld = function(point) {
        return Geometry.transformPoint(point[0], point[1], this.inverseTransform());
      };

      IsometricMap.prototype.init = function(meta) {
        var _this = this;
        IsometricMap.__super__.init.call(this, meta);
        this.last_clicked_layer = null;
        this.tile_under_mouse = null;
        this.quadtree = new QuadTree(this.world_bounds);
        this.search_range = [0, 0, this.bounds[2], this.bounds[3]];
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
          llogd(tile);
          _this.selected_tile = tile;
          _this.selected_tile_sprite = Hal.asm.getSprite(_this.selected_tile.sprite);
          _this.selected_tile_x = _this.selected_tile_sprite.w2;
          return _this.selected_tile_y = _this.selected_tile_sprite.h2;
        });
        Hal.on("MOUSE_MOVE", function(pos) {
          var t;
          if (_this.world_pos != null) {
            Vec2.release(_this.world_pos);
          }
          _this.world_pos = _this.screenToWorld(pos);
          t = _this.getTileAt(_this.world_pos);
          if (t !== _this.tile_under_mouse) {
            if (_this.tile_under_mouse) {
              _this.tile_under_mouse.drawableOffState(Hal.DrawableStates.Fill);
            }
            _this.tile_under_mouse = t;
            if (_this.tile_under_mouse != null) {
              return _this.tile_under_mouse.drawableOnState(Hal.DrawableStates.Fill);
            }
          }
        });
        return this.initMap();
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
        this.map = new Array(this.nrows * this.ncols);
        k = 0;
        t1 = performance.now();
        for (i = _i = 0, _ref = this.nrows - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          for (j = _j = 0, _ref1 = this.ncols - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
            x = (j / 2) * this.tilew;
            y = (i + ((j % 2) / 2)) * this.tileh;
            t = this.tm.newTileHolder({
              "shape": this.iso_shape,
              "x": x,
              "y": y,
              "row": i,
              "col": j
            });
            this.map[k] = this.addEntity(t);
            k++;
          }
        }
        t2 = performance.now() - t1;
        return llogd("it took: " + t1);
      };

      IsometricMap.prototype.processMouseClick = function() {
        var layer, t1, t2, transp, _i, _len, _ref;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        t1 = performance.now();
        _ref = this.quadtree.findEntitiesInRectangle(this.search_range, this.transform());
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          transp = Geometry.transformPoint(this.world_pos[0], this.world_pos[1], layer.inverseTransform());
          if (Hal.im.isTransparent(layer.sprite.img, transp[0] + layer.sprite.w2, transp[1] + layer.sprite.h2)) {
            Vec2.release(transp);
            continue;
          }
          Vec2.release(transp);
          if (this.clicked_layer == null) {
            this.clicked_layer = layer;
          } else {
            if ((layer.holder.col === this.clicked_layer.holder.col) && (layer.holder.row === this.clicked_layer.holder.row)) {
              if (layer.layer > this.clicked_layer.layer) {
                this.clicked_layer = tile;
              }
            } else if (layer.holder.row === this.clicked_layer.holder.row) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = tile;
              }
            } else if (layer.holder.col === this.clicked_layer.holder.col) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = tile;
              }
            } else if ((layer.holder.col !== this.clicked_layer.holder.col) && (layer.holder.row !== this.clicked_layer.holder.row)) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = tile;
              }
            }
          }
        }
        t2 = performance.now() - t1;
        llogd("searching took: " + (t2.toFixed(2)) + " ms");
        if (this.clicked_layer != null) {
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          this.clicked_layer.trigger("SELECTED");
          if (!this.clicked_layer.tweener.animating) {
            return this.clicked_layer.tween({
              attr: "position[1]",
              from: this.clicked_layer.position[1],
              to: this.clicked_layer.position[1] - 10,
              duration: 300
            }).done(function() {
              return this.tween({
                attr: "position[1]",
                from: this.position[1],
                to: this.position[1] + 10,
                duration: 300
              });
            });
          }
        }
      };

      IsometricMap.prototype.drawQuadTree = function(quadtree) {
        if (this.paused) {
          return;
        }
        this.g.ctx.textAlign = "center";
        this.g.ctx.fillStyle = "white";
        if (quadtree.nw != null) {
          this.drawQuadTree(quadtree.nw);
          this.g.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3]);
          this.g.ctx.fillText("" + quadtree.nw.id, quadtree.nw.bounds[0] + quadtree.nw.bounds[2] * 0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3] * 0.5);
        }
        if (quadtree.ne != null) {
          this.drawQuadTree(quadtree.ne);
          this.g.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3]);
          this.g.ctx.fillText("" + quadtree.ne.id, quadtree.ne.bounds[0] + quadtree.ne.bounds[2] * 0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3] * 0.5);
        }
        if (quadtree.sw != null) {
          this.drawQuadTree(quadtree.sw);
          this.g.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3]);
          this.g.ctx.fillText("" + quadtree.sw.id, quadtree.sw.bounds[0] + quadtree.sw.bounds[2] * 0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3] * 0.5);
        }
        if (quadtree.se != null) {
          this.drawQuadTree(quadtree.se);
          this.g.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3]);
          return this.g.ctx.fillText("" + quadtree.se.id, quadtree.se.bounds[0] + quadtree.se.bounds[2] * 0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3] * 0.5);
        }
      };

      IsometricMap.prototype.draw = function(delta) {
        IsometricMap.__super__.draw.call(this, delta);
        this.g.ctx.setTransform(this._transform[0], this._transform[3], this._transform[1], this._transform[4], this._transform[2], this._transform[5]);
        this.drawQuadTree(this.quadtree);
        if (this.current_mode === "mode-place") {
          if ((this.selected_tile == null) || (this.tile_under_mouse == null)) {
            return;
          }
          this.g.ctx.globalAlpha = 0.5;
          this.g.ctx.drawImage(this.selected_tile_sprite.img, this.tile_under_mouse.position[0] - this.selected_tile_x, this.tile_under_mouse.position[1] - this.selected_tile_y);
          return this.g.ctx.globalAlpha = 1.0;
        }
      };

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);
