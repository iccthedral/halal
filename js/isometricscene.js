(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], function(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) {
    var IsometricScene;
    IsometricScene = (function(_super) {
      __extends(IsometricScene, _super);

      function IsometricScene(meta) {
        var hittest, i, j, _i, _len, _ref;
        IsometricScene.__super__.constructor.call(this, meta);
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.mpos = Vec2.from(0, 0);
        this.world_pos = Vec2.from(0, 0);
        this.max_rows = this.nrows - 1;
        this.max_cols = this.ncols - 1;
        this.selected_tile_x = 0;
        this.selected_tile_y = this.tileh2;
        this.selected_tile = null;
        this.selected_tile_sprite = null;
        this.tiles_found = [];
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

        hittest = Hal.dom.createCanvas(this.tilew, this.tileh).getContext("2d");
        hittest.drawImage(this.mask.img, 0, 0);
        this.mask_data = hittest.getImageData(0, 0, this.tilew, this.tileh).data;
        _ref = this.mask_data;
        for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
          i = _ref[j];
          this.mask_data[j] = i < 120;
        }
        this.world_bounds = [0, 0, (this.ncols - 1) * this.tilew2, (this.nrows - 0.5) * this.tileh];
        this.world_center = [];
        this.world_center[0] = (this.world_bounds[2] - this.world_bounds[0]) * 0.5;
        this.world_center[1] = (this.world_bounds[3] - this.world_bounds[1]) * 0.5;
        this.section_dim = [Math.round(this.world_bounds[2] / 3), Math.round((this.nrows * this.tileh) / 3)];
        this.cap = Math.round(this.section_dim[0] / this.tilew2) * Math.round(this.section_dim[1] / this.tileh);
        this.startTile = this.endTile = null;
        this.sections = {
          "center": new QuadTree([this.section_dim[0], this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "ne": new QuadTree([0, 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "n": new QuadTree([this.section_dim[0], 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "nw": new QuadTree([2 * this.section_dim[0], 0, this.section_dim[0], this.section_dim[1]], this.cap, false),
          "e": new QuadTree([0, this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "w": new QuadTree([2 * this.section_dim[0], this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "se": new QuadTree([0, 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "s": new QuadTree([this.section_dim[0], 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false),
          "sw": new QuadTree([2 * this.section_dim[0], 2 * this.section_dim[1], this.section_dim[0], this.section_dim[1]], this.cap, false)
        };
        this.sections["center"].divide();
        this.sections["ne"].divide();
        this.sections["n"].divide();
        this.sections["nw"].divide();
        this.sections["e"].divide();
        this.sections["w"].divide();
        this.sections["se"].divide();
        this.sections["s"].divide();
        this.sections["sw"].divide();
        this.screen_end = [];
      }

      IsometricScene.prototype.drawStat = function() {
        IsometricScene.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          Hal.glass.ctx.fillText(this.info.mouse_position + Vec2.str(this.mpos), 0, 130);
          Hal.glass.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 145);
          Hal.glass.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 160);
          Hal.glass.ctx.fillText(this.info.tile_under_mouse + Vec2.str(this.tile_under_mouse.position), 0, 175);
          return Hal.glass.ctx.fillText(this.info.world_position + Vec2.str(this.world_pos), 0, 190);
        }
      };

      IsometricScene.prototype.drawQuadTree = function(quadtree) {
        this.drawQuadSections(this.sections["center"], "red");
        this.drawQuadSections(this.sections["ne"], "gold");
        this.drawQuadSections(this.sections["n"], "green");
        this.drawQuadSections(this.sections["nw"], "blue");
        this.drawQuadSections(this.sections["e"], "cyan");
        this.drawQuadSections(this.sections["w"], "orange");
        this.drawQuadSections(this.sections["se"], "yellow");
        this.drawQuadSections(this.sections["s"], "violet");
        return this.drawQuadSections(this.sections["sw"], "brown");
      };

      IsometricScene.prototype.drawQuadSections = function(quadtree, color) {
        if (this.paused) {
          return;
        }
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = color;
        if (quadtree.nw != null) {
          this.drawQuadSections(quadtree.nw);
          this.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3]);
          this.ctx.fillText("" + quadtree.nw.id, quadtree.nw.bounds[0] + quadtree.nw.bounds[2] * 0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3] * 0.5);
        }
        if (quadtree.ne != null) {
          this.drawQuadSections(quadtree.ne);
          this.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3]);
          this.ctx.fillText("" + quadtree.ne.id, quadtree.ne.bounds[0] + quadtree.ne.bounds[2] * 0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3] * 0.5);
        }
        if (quadtree.sw != null) {
          this.drawQuadSections(quadtree.sw);
          this.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3]);
          this.ctx.fillText("" + quadtree.sw.id, quadtree.sw.bounds[0] + quadtree.sw.bounds[2] * 0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3] * 0.5);
        }
        if (quadtree.se != null) {
          this.drawQuadSections(quadtree.se);
          this.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3]);
          return this.ctx.fillText("" + quadtree.se.id, quadtree.se.bounds[0] + quadtree.se.bounds[2] * 0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3] * 0.5);
        }
      };

      IsometricScene.prototype.parseMeta = function(meta) {
        IsometricScene.__super__.parseMeta.call(this, meta);
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = +meta.rows;
        this.ncols = +meta.cols;
        this.max_layers = meta.max_layers || 5;
        return this.mask = meta.mask;
      };

      IsometricScene.prototype.init = function() {
        IsometricScene.__super__.init.call(this);
        this.clicked_layer = null;
        this.tile_under_mouse = null;
        this.screen_end = [this.bounds[2] + 2 * this.tilew, this.bounds[3] + 2 * this.tileh];
        return this.initMap();
      };

      IsometricScene.prototype.maxRows = function() {
        return Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.scale[0])) + 4));
      };

      IsometricScene.prototype.maxCols = function() {
        return Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.scale[1])) + 4));
      };

      IsometricScene.prototype.toOrtho = function(pos) {
        var coldiv, off_x, off_y, rowdiv, transp;
        coldiv = (pos[0] + this.tilew2) * this.tilew2prop;
        rowdiv = (pos[1] + this.tileh2) * this.tileh2prop;
        off_x = ~~((pos[0] + this.tilew2) - ~~(coldiv * 0.5) * this.tilew);
        off_y = ~~((pos[1] + this.tileh2) - ~~(rowdiv * 0.5) * this.tileh);
        transp = this.mask_data[(off_x + this.tilew * off_y) * 4 + 3];
        return [coldiv - (transp ^ !(coldiv & 1)), (rowdiv - (transp ^ !(rowdiv & 1))) / 2];
      };

      IsometricScene.prototype.getNeighbours = function(tile) {
        var dir, n, out, _i, _len, _ref;
        out = [];
        if (tile == null) {
          return out;
        }
        _ref = Object.keys(tile.direction);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          dir = _ref[_i];
          n = this.getTile(tile.row, tile.col, tile.direction[dir]);
          if (n != null) {
            out.push(n);
          }
        }
        return out;
      };

      IsometricScene.prototype.findInDirectionOf = function(tile, dirstr, len) {
        var dir, fromc, fromr, out, t;
        if (tile == null) {
          return [];
        }
        out = [];
        out.push(tile);
        fromr = tile.row;
        fromc = tile.col;
        dir = tile.direction[dirstr];
        while (len > 0) {
          t = this.getTile(fromr, fromc, dir);
          if (t != null) {
            out.push(t);
            fromr = t.row;
            fromc = t.col;
            dir = t.direction[dirstr];
          } else {
            break;
          }
          len--;
        }
        return out;
      };

      IsometricScene.prototype.isAdjacentTo = function(cellA, cellB) {
        var in_neighs, neighs;
        if (cellB == null) {
          return false;
        }
        neighs = this.getNeighbours(cellB);
        in_neighs = neighs.some(function(el) {
          return el.row === cellA.row && el.col === cellA.col;
        });
        return in_neighs;
      };

      IsometricScene.prototype.getTile = function(row, col, dir) {
        if (dir == null) {
          dir = [0, 0];
        }
        return this.map[(col + dir[1]) + (row + dir[0]) * this.ncols];
      };

      IsometricScene.prototype.getTileAt = function(pos) {
        var coord;
        coord = this.toOrtho(pos);
        if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= this.nrows || coord[0] >= this.ncols) {
          return null;
        }
        return this.map[Math.floor(coord[0]) + Math.floor(coord[1]) * this.ncols];
      };

      IsometricScene.prototype.initMapTiles = function() {
        var i, j, k, t, t1, t2, x, y, z, z_indices, _i, _j, _k, _ref, _ref1, _ref2;
        this.pause();
        this.section_center = [];
        z_indices = [];
        for (z = _i = 1, _ref = this.max_layers; 1 <= _ref ? _i <= _ref : _i >= _ref; z = 1 <= _ref ? ++_i : --_i) {
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
            t = this.tm.newTile({
              "shape": this.iso_shape,
              "x": x,
              "y": y,
              "row": i,
              "col": j
            });
            this.map[k] = this.addEntity(t);
            this.sections["center"].insert(this.map[k]);
            this.sections["ne"].insert(this.map[k]);
            this.sections["n"].insert(this.map[k]);
            this.sections["nw"].insert(this.map[k]);
            this.sections["e"].insert(this.map[k]);
            this.sections["w"].insert(this.map[k]);
            this.sections["se"].insert(this.map[k]);
            this.sections["s"].insert(this.map[k]);
            this.sections["sw"].insert(this.map[k]);
            k++;
          }
        }
        t2 = performance.now() - t1;
        llogd("Initializing sections took: " + t2 + " ms");
        this.startTile = this.getTileAt([0, 0]);
        this.endTile = this.getTileAt([this.bounds[2], this.bounds[3]]);
        console.debug(this.startTile);
        console.debug(this.endTile);
        this.trigger("MAP_TILES_INITIALIZED");
        return this.resume();
      };

      IsometricScene.prototype.initMap = function() {
        this.clicked_layer = null;
        this.on("TILE_MANAGER_LOADED", function() {
          return this.loadMap();
        });
        return this.tm = new TileManager(this);
      };

      IsometricScene.prototype.worldCenter = function() {
        this.world_center[0] = (this.world_bounds[2] - this.world_bounds[0]) * 0.5;
        this.world_center[1] = (this.world_bounds[3] - this.world_bounds[1]) * 0.5;
        return this.world_center;
      };

      IsometricScene.prototype.worldCenterTile = function() {
        return this.getTileAt(this.world_center);
      };

      IsometricScene.prototype.saveBitmapMap = function() {
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
        return out.reverse();
      };

      IsometricScene.prototype.loadBitmapMap = function(bitmap) {
        var layer, layer_height, layer_id, layer_qword, map_cols, map_rows, mask, qword, t1, t2, tile, tile_col, tile_qword, tile_row, total, _i, _ref;
        bitmap = bitmap.slice();
        t1 = performance.now();
        this.pause();
        mask = 0xFFFF;
        qword = bitmap.pop();
        map_rows = (qword >> 32) & mask;
        map_cols = (qword >> 16) & mask;
        total = map_rows * map_cols;
        if (total > this.nrows * this.ncols || total === 0) {
          console.error("Can't load this bitmap, it's too big");
          this.resume();
          return false;
        }
        this.nrows = map_rows;
        this.ncols = map_cols;
        while ((tile_qword = bitmap.pop()) != null) {
          tile_row = (tile_qword >> 32) & mask;
          tile_col = (tile_qword >> 16) & mask;
          tile = this.getTile(tile_row, tile_col);
          if (tile == null) {
            console.warn("Oh snap, something's wrong, will try to recover");
            continue;
          }
          for (layer = _i = 0, _ref = this.max_layers; 0 <= _ref ? _i < _ref : _i > _ref; layer = 0 <= _ref ? ++_i : --_i) {
            layer_qword = bitmap.pop();
            if (layer_qword === -1) {
              continue;
            }
            layer_id = (layer_qword >> 32) & mask;
            layer_height = (layer_qword >> 16) & mask;
            this.tm.addTileLayerMetaByLayerId(tile_row, tile_col, layer_id, 0, layer_height);
          }
        }
        t2 = performance.now() - t1;
        this.resume();
        console.info("Loading took: " + t2 + " ms");
        this.trigger("MAP_LOADED");
        return true;
      };

      IsometricScene.prototype.loadMap = function() {
        this.setWorldBounds(this.world_bounds);
        this.world_center[0] = (this.world_bounds[2] - this.world_bounds[0]) * 0.5;
        this.world_center[1] = (this.world_bounds[3] - this.world_bounds[1]) * 0.5;
        return this.initMapTiles();
      };

      IsometricScene.prototype.processLeftClick = function() {
        var layer, t1, t2, transp, _i, _len, _ref;
        if (this.clicked_layer != null) {
          this.clicked_layer.trigger("DESELECTED");
          this.clicked_layer = null;
        }
        t1 = performance.now();
        this.tiles_found = [];
        this.quadtree.findEntitiesInRectangle(this.search_range, this._transform, this.tiles_found);
        _ref = this.tiles_found;
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
            if ((layer.tile.col === this.clicked_layer.tile.col) && (layer.tile.row === this.clicked_layer.tile.row)) {
              if (layer.layer > this.clicked_layer.layer) {
                this.clicked_layer = layer;
              }
            } else if (layer.tile.row === this.clicked_layer.tile.row) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if (layer.tile.col === this.clicked_layer.tile.col) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            } else if ((layer.tile.col !== this.clicked_layer.tile.col) && (layer.tile.row !== this.clicked_layer.tile.row)) {
              if (layer.h + layer.position[1] > this.clicked_layer.h + this.clicked_layer.position[1]) {
                this.clicked_layer = layer;
              }
            }
          }
        }
        t2 = performance.now() - t1;
        llogd("Searching took: " + (t2.toFixed(2)) + " ms");
        llogd("Tiles found: " + this.tiles_found.length);
        if (this.clicked_layer != null) {
          this.trigger("LAYER_SELECTED", this.clicked_layer);
          return this.clicked_layer.trigger("SELECTED");
        }
      };

      IsometricScene.prototype.draw = function(delta) {
        var i, j, tile, world_end, _i, _j, _ref, _ref1, _ref2, _ref3;
        this.drawStat();
        this.clearRenderers();
        if (this.update_ents) {
          this.startTile = this.getTileAt([0, 0]);
          world_end = this.screenToWorld(this.screen_end);
          this.endTile = this.getTileAt(world_end);
          Vec2.release(world_end);
        }
        for (i = _i = _ref = this.startTile.row, _ref1 = this.endTile.row; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          for (j = _j = _ref2 = this.startTile.col, _ref3 = this.endTile.col; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; j = _ref2 <= _ref3 ? ++_j : --_j) {
            tile = this.map[j + i * this.ncols];
            if (tile != null) {
              tile.update(delta);
            }
            if (tile != null) {
              tile.draw(delta);
            }
          }
        }
        return this.update_ents = false;
      };

      IsometricScene.prototype.destroy = function() {
        /* @todo @tm.destroy()*/

        Vec2.release(this.mpos);
        Vec2.release(this.world_pos);
        Hal.removeTrigger("MOUSE_MOVE", this.mouse_moved_listener);
        Hal.removeTrigger("LEFT_CLICK", this.left_click_listener);
        return IsometricScene.__super__.destroy.call(this);
      };

      IsometricScene.prototype.initListeners = function() {
        var _this = this;
        IsometricScene.__super__.initListeners.call(this);
        this.change_end_start_coords = Hal.on("RESIZE", function(pos) {
          return _this.screen_end = [_this.bounds[2] + 2 * _this.tilew, _this.bounds[3] + 2 * _this.tileh];
        });
        this.mouse_moved_listener = Hal.on("MOUSE_MOVE", function(pos) {
          Vec2.copy(_this.mpos, pos);
          if (_this.world_pos != null) {
            Vec2.release(_this.world_pos);
          }
          _this.world_pos = _this.screenToWorld(pos);
          return _this.tile_under_mouse = _this.getTileAt(_this.world_pos);
        });
        Hal.on("SAVE_MAP", function() {
          return _this.saveBitmapMap();
        });
      };

      IsometricScene.prototype.saveMap = function() {};

      return IsometricScene;

    })(Scene);
    return IsometricScene;
  });

}).call(this);
