(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["Scene", "SpriteEntity", "Entity"], function(Scene, SpriteEntity, Entity) {
    var IsometricMap, Tile;
    Tile = (function(_super) {
      __extends(Tile, _super);

      function Tile(meta) {
        Tile.__super__.constructor.call(this, meta);
        this.row = meta.row;
        this.col = meta.col;
        this.name = meta.name != null ? meta.name : "" + this.id;
      }

      return Tile;

    })(SpriteEntity);
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        var hittest, i, j, _i, _len, _ref;
        this.tilew = meta.tilew;
        this.tileh = meta.tileh;
        this.nrows = meta.rows;
        this.ncols = meta.cols;
        this.tilew2prop = 2 / this.tilew;
        this.tileh2prop = 2 / this.tileh;
        this.tilew2 = this.tilew / 2;
        this.tileh2 = this.tileh / 2;
        this.map = [];
        this.total_rendered = 0;
        meta.cam_bounds = [this.tilew2, this.tileh2, this.ncols * this.tilew2, (this.nrows - 0.5) * this.tileh];
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
          start_col: "staring col: ",
          end_row: "end row: ",
          end_col: "end_col: ",
          tile_x: "tile_x: ",
          tile_y: "tile_y: ",
          num_rendering: "no. rendereded entities: ",
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
        this.search_range = 50;
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
        shape = [t_left.x - (t_right.x - t_left.x), t_left.y - (b_right.y - t_left.y), (t_right.x - t_left.x) * 2, (b_right.y - t_left.y) * 2];
        return this.g.strokeRect(shape, "cyan");
      };

      IsometricMap.prototype.drawStat = function() {
        IsometricMap.__super__.drawStat.call(this);
        if (this.tile_under_mouse != null) {
          this.g.ctx.fillText(this.info.row + this.tile_under_mouse.row, 0, 195);
          this.g.ctx.fillText(this.info.col + this.tile_under_mouse.col, 0, 210);
          this.g.ctx.fillText(this.info.tile_x + this.tile_under_mouse.x, 0, 225);
          this.g.ctx.fillText(this.info.tile_y + this.tile_under_mouse.y, 0, 240);
        }
        this.g.ctx.fillText(this.info.start_row + this.display.startr, 0, 115);
        this.g.ctx.fillText(this.info.start_col + this.display.startc, 0, 130);
        this.g.ctx.fillText(this.info.end_row + this.display.endr, 0, 145);
        this.g.ctx.fillText(this.info.end_col + this.display.endc, 0, 160);
        this.g.ctx.fillText(this.info.num_rendering + this.total_rendered, 0, 175);
        return this.g.ctx.fillText(this.info.cam_mouse + ("" + (-this.camera.x + this.mpos[0]) + ", " + (-this.camera.y + this.mpos[1])), 0, 255);
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
        Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          return _this.camera.lerpTo(_this.localToWorld(_this.world_pos));
        });
        this.on("ENTITY_DESTROYED", function(ent) {
          var ind;
          ind = _this.map.indexOf(ent);
          if (ind === -1) {
            log.debug("oh shit, no such entity " + ent.id);
            return;
          }
          return _this.map[ind] = null;
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

      IsometricMap.prototype.draw = function(delta) {
        var i, j, tile, _i, _j, _ref, _ref1, _ref2, _ref3;
        if (this.paused) {
          return;
        }
        IsometricMap.__super__.draw.call(this);
        this.total_rendered = 0;
        for (i = _i = _ref = this.display.startr, _ref1 = this.display.startr + this.display.endr; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          for (j = _j = _ref2 = this.display.startc, _ref3 = this.display.endc + this.display.startc; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; j = _ref2 <= _ref3 ? ++_j : --_j) {
            tile = this.map[j + i * this.ncols];
            if (tile == null) {
              continue;
            }
            tile.update(delta);
            tile.draw(delta);
            this.total_rendered++;
          }
        }
        this.g.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        this.showRegion(this.mpos, 3, 3);
        if (this.draw_quadspace) {
          this.drawQuadSpace(this.quadspace);
          return this.g.strokeRect(this.camera.view_frustum, "green");
        }
      };

      IsometricMap.prototype.calcDrawingArea = function() {
        var sc, sr, top_left;
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
          endr: Math.min(this.nrows - 1, Math.round((this.bounds[3] / (this.tileh * this.camera.zoom)) + 4)),
          startr: sr,
          endc: Math.min(this.ncols - 1, Math.round((this.bounds[2] / (this.tilew2 * this.camera.zoom)) + 4))
        };
      };

      IsometricMap.prototype.toOrtho = function(pos) {
        var coldiv, off_x, off_y, rowdiv, transp;
        coldiv = (pos[0] + this.camera.view_frustum[0]) * this.tilew2prop;
        rowdiv = (pos[1] + this.camera.view_frustum[1]) * this.tileh2prop;
        off_x = ~~((pos[0] + this.camera.view_frustum[0]) - ~~(coldiv * 0.5) * this.tilew);
        off_y = ~~((pos[1] + this.camera.view_frustum[1]) - ~~(rowdiv * 0.5) * this.tileh);
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
        var i, j, t, x, y, _i, _j, _ref, _ref1;
        this.clicked_layer = null;
        for (i = _i = 0, _ref = this.nrows - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          for (j = _j = 0, _ref1 = this.ncols - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
            x = (j / 2) * this.tilew;
            y = (i + ((j % 2) / 2)) * this.tileh;
            t = new Tile({
              "shape": this.iso_shape,
              "draw_shape": false,
              "x": x,
              "y": y,
              "row": i,
              "col": j,
              "visible_sprite": true,
              "sprite": "test/grid_unit_128x64"
            });
            this.map.push(this.addEntity(t));
          }
        }
        this.calcDrawingArea();
        return this.camera.trigger("CHANGE");
      };

      return IsometricMap;

    })(Scene);
    return IsometricMap;
  });

}).call(this);
