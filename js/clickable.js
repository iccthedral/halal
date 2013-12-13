(function() {
  "use strict";
  define([], function() {
    var Clickable;
    Clickable = (function() {
      function Clickable() {
        var _this = this;
        this.clickable_modes = {
          "clickable_mode_left_click": this.findInQuadSpace,
          "clickable_mode_right_click": this.findInQuadSpace,
          "clickable_mode_left_dbl_click": this.findInQuadSpace
        };
        Hal.on("LEFT_CLICK", this.clickable_mode_left_listener = function(pos) {
          return _this.clickable_modes["mode_left_click"].call(_this);
        });
        Hal.on("RIGHT_CLICK", this.clickable_mode_right_listener = function(pos) {
          return _this.clickable_modes["mode_right_click"].call(_this);
        });
        Hal.on("LEFT_DBL_CLICK", this.clickable_mode_leftdbl_listener = function(pos) {
          return _this.clickable_modes["mode_left_dbl_click"].call(_this);
        });
        this.clicked_ent = null;
      }

      Clickable.prototype.addMode = function(mode, clb) {
        var mode_clb;
        mode_clb = this.clickable_modes[mode];
        if (mode_clb != null) {
          llogw("You're overriding clickable mode: " + mode);
        }
        return this.clickable_modes[mode] = clb;
      };

      Clickable.prototype.switchMode = function(mode, clb) {};

      Clickable.prototype.findInQuadSpace = function() {
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

      return Clickable;

    })();
    return Clickable.Modes = {
      LEFT_CLICK: 0,
      LEFT_DBL_CLICK: 1,
      RIGHT_CLICK: 2
    };
  });

}).call(this);
