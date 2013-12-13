(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], function(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) {
    var IsometricMap;
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        var hittest, i, j, _i, _len, _ref;
        IsometricMap.__super__.constructor.call(this, meta);
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.mpos = Vec2.from(0, 0);
        this.world_pos = Vec2.from(0, 0);
        this.max_rows = this.nrows - 1;
        this.max_cols = this.ncols - 1;
        this.selected_tile = null;
        this.selected_tile_x = 0;
        this.selected_tile_y = this.tileh2;
        this.selected_tile_sprite = null;
        this.max_layers = 5;
        /* Isometric shape*/

        this.iso_shape = [Vec2.from(-this.tilew2, 0), Vec2.from(0, this.tileh2), Vec2.from(this.tilew2, 0), Vec2.from(0, -this.tileh2)];
        this.info = {
          row: "Row: ",
          col: "Col: ",
          tilename: "Tile: ",
          mouse_position: "Mouse position: ",
          tile_under_mouse: "Tile position: ",
          world_position: "Mouse world position: "
        };
        /* Create iso transparency mask*/

        this.mask = Hal.asm.getSprite("test/tilemask_128x64");
        hittest = Hal.dom.createCanvas(this.tilew, this.tileh).getContext("2d");
        hittest.drawImage(this.mask.img, 0, 0);
        this.mask_data = hittest.getImageData(0, 0, this.tilew, this.tileh).data;
        _ref = this.mask_data;
        for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
          i = _ref[j];
          this.mask_data[j] = i < 120;
        }
        this.mouse_over_sprites = {
          "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64"),
          "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")
        };
        this.world_bounds = [0, 0, (this.ncols - 1) * this.tilew2, (this.nrows - 0.5) * this.tileh];
      }

      IsometricMap.prototype.drawStat = function() {
        IsometricMap.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          Hal.glass.ctx.fillText(this.info.mouse_position + Vec2.str(this.mpos), 0, 130);
          Hal.glass.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 145);
          Hal.glass.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 160);
          Hal.glass.ctx.fillText(this.info.tile_under_mouse + Vec2.str(this.tile_under_mouse.position), 0, 175);
          return Hal.glass.ctx.fillText(this.info.world_position + Vec2.str(this.world_pos), 0, 190);
        }
      };

      IsometricMap.prototype.parseMeta = function(meta) {
        IsometricMap.__super__.parseMeta.call(this, meta);
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = +meta.rows;
        return this.ncols = +meta.cols;
      };

      IsometricMap.prototype.init = function() {
        var _this = this;
        IsometricMap.__super__.init.call(this);
        /* @SUPPORTED_EDITOR_MODES*/

        this.supported_modes = {};
        this.supported_modes["mode-default"] = function() {
          _this.processLeftClick();
        };
        this.supported_modes["mode-erase"] = function() {
          _this.processLeftClick();
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
        };
        this.supported_modes["mode-place"] = function() {
          var t;
          if ((_this.tile_under_mouse == null) || (_this.selected_tile == null)) {
            return;
          }
          _this.selected_tile_x = _this.selected_tile_sprite.w2;
          _this.selected_tile_y = _this.selected_tile_sprite.h - _this.tileh2;
          t = _this.tm.addTileLayerToHolder(_this.tile_under_mouse.row, _this.tile_under_mouse.col, _this.selected_tile, _this.selected_tile_x, _this.selected_tile_y);
        };
        this.current_mode = "mode-default";
        this.current_mode_clb = this.supported_modes[this.current_mode];
        /* @SUPPORTED_EDITOR_MODES*/

        this.clicked_layer = null;
        this.tile_under_mouse = null;
        this.search_range = this.bounds.slice();
        this.left_click_listener = Hal.on("LEFT_CLICK", function() {
          if (_this.paused) {
            return;
          }
          return _this.current_mode_clb.call(_this);
        });
        /*map editor stuff*/

        this.editor_mode_listener = Hal.on("EDITOR_MODE_CHANGED", function(mode) {
          if (_this.paused) {
            return;
          }
          if (_this.supported_modes[mode] != null) {
            _this.current_mode = mode;
            _this.current_mode_clb = _this.supported_modes[mode];
          } else {
            llogw("Mode " + mode + " not supported");
          }
          return llogd(_this.current_mode);
        });
        this.layer_selected_listener = Hal.on("TILE_LAYER_SELECTED", function(tile) {
          llogd("Tile layer selected from editor");
          llogd(tile);
          _this.selected_tile = tile;
          _this.selected_tile_sprite = Hal.asm.getSprite(_this.selected_tile.sprite);
          _this.selected_tile_x = _this.selected_tile_sprite.w2;
          return _this.selected_tile_y = _this.selected_tile_sprite.h - _this.tileh2;
        });
        this.mouse_moved_listener = Hal.on("MOUSE_MOVE", function(pos) {
          var t;
          Vec2.copy(_this.mpos, pos);
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

      IsometricMap.prototype.initSections = function() {
        var i, j, k, t, t1, t2, x, y, z, z_indices, _i, _j, _k, _ref, _ref1, _ref2;
        this.pause();
        this.section_center = [];
        z_indices = [];
        for (z = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; z = 0 <= _ref ? ++_i : --_i) {
          z_indices.push(z);
        }
        this.renderer.createLayers(z_indices);
        this.map = new Array(this.nrows * this.ncols);
        k = 0;
        t1 = performance.now();
        for (i = _j = 0, _ref1 = this.nrows - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          for (j = _k = 0, _ref2 = this.ncols - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; j = 0 <= _ref2 ? ++_k : --_k) {
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
        llogd("Initializing sections took: " + t2 + " ms");
        return this.resume();
      };

      IsometricMap.prototype.loadCenterSection = function() {};

      IsometricMap.prototype.initMap = function() {
        this.clicked_layer = null;
        this.on("META_LAYERS_LOADED", function() {
          return this.initSections.call(this);
        });
        return this.tm = new TileManager(this);
      };

      IsometricMap.prototype.saveBitmapMap = function() {
        var h, layer, layer_ind, map_c, map_r, meta, meta_id, out, t, t1, t2, t_col, t_row, tiles, _i, _j, _len, _ref;
        this.pause();
        t1 = performance.now();
        out = [];
        tiles = this.map.slice();
        map_r = this.nrows << 32;
        map_c = this.ncols << 16;
        out.push(map_r | map_c);
        for (_i = 0, _len = tiles.length; _i < _len; _i++) {
          t = tiles[_i];
          t_row = t.row << 32;
          t_col = t.col << 16;
          out.push(t_row | t_col);
          for (layer_ind = _j = 0, _ref = this.max_layers; 0 <= _ref ? _j < _ref : _j > _ref; layer_ind = 0 <= _ref ? ++_j : --_j) {
            layer = t.layers[layer_ind];
            if (layer == null) {
              out.push(-1);
              continue;
            }
            meta = this.tm.findByName(layer.name);
            meta_id = meta.id << 32;
            h = layer.h << 16;
            out.push(h | meta_id);
          }
        }
        t2 = performance.now() - t1;
        this.resume();
        console.info("Saving took: " + t2 + " ms");
        this.trigger("SECTION_SAVED", out);
        return out;
      };

      IsometricMap.prototype.loadBitmapMap = function(bitmap) {
        var layer, layer_height, layer_id, layer_qword, map_cols, map_rows, mask, qword, t1, t2, tile, tile_col, tile_qword, tile_row, total, _i, _ref;
        bitmap = bitmap.slice();
        t1 = performance.now();
        this.pause();
        mask = 0xFFFF;
        qword = bitmap.shift();
        map_rows = (qword >> 32) & mask;
        map_cols = (qword >> 16) & mask;
        total = map_rows * map_cols;
        if (total > this.nrows * this.ncols) {
          console.error("Can't load this bitmap, it's too big");
          this.resume();
          return;
        }
        this.nrows = map_rows;
        this.ncols = map_cols;
        while ((tile_qword = bitmap.shift()) != null) {
          tile_row = (tile_qword >> 32) & mask;
          tile_col = (tile_qword >> 16) & mask;
          tile = this.getTile(tile_row, tile_col);
          if (tile == null) {
            console.warn("Oh snap, something's wrong");
            console.warn("Trying to recover");
            continue;
          }
          for (layer = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; layer = 0 <= _ref ? ++_i : --_i) {
            layer_qword = bitmap.shift();
            if (layer_qword === -1) {
              continue;
            }
            layer_id = (layer_qword >> 32) & mask;
            layer_height = (layer_qword >> 16) & mask;
            this.tm.addTileLayerToHolderByLayerId(tile_row, tile_col, layer_id, 0, layer_height);
          }
        }
        t2 = performance.now() - t1;
        this.resume();
        console.info("loading took: " + t2 + " ms");
        this.trigger("SECTION_LOADED");
      };

      IsometricMap.prototype.processLeftClick = function() {
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
                this.clicked_layer = layer;
              }
            } else if (layer.holder.row === this.clicked_layer.holder.row) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if (layer.holder.col === this.clicked_layer.holder.col) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if ((layer.holder.col !== this.clicked_layer.holder.col) && (layer.holder.row !== this.clicked_layer.holder.row)) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
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

      IsometricMap.prototype.draw = function(delta) {
        IsometricMap.__super__.draw.call(this, delta);
        this.ctx.setTransform(this._transform[0], this._transform[3], this._transform[1], this._transform[4], this._transform[2], this._transform[5]);
        this.drawQuadTree(this.quadtree);
        if (this.current_mode === "mode-place") {
          if ((this.selected_tile == null) || (this.tile_under_mouse == null)) {
            return;
          }
          this.ctx.globalAlpha = 0.5;
          this.ctx.drawImage(this.selected_tile_sprite.img, this.tile_under_mouse.position[0] - this.selected_tile_x, this.tile_under_mouse.position[1] - this.selected_tile_y);
          return this.ctx.globalAlpha = 1.0;
        }
      };

      IsometricMap.prototype.destroy = function() {
        /* @todo @tm.destroy()*/

        Vec2.release(this.mpos);
        Vec2.release(this.world_pos);
        Hal.removeTrigger("EDITOR_MODE_CHANGED", this.editor_mode_listener);
        Hal.removeTrigger("TILE_LAYER_SELECTED", this.layer_selected_listener);
        Hal.removeTrigger("MOUSE_MOVE", this.mouse_moved_listener);
        Hal.removeTrigger("LEFT_CLICK", this.left_click_listener);
        return IsometricMap.__super__.destroy.call(this);
      };

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);
