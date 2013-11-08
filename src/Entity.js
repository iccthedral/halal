(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["HalalEntity"], function(HalalEntity) {
    var Entity;
    Entity = (function(_super) {
      __extends(Entity, _super);

      function Entity(meta) {
        Entity.__super__.constructor.call(this);
        this.shape = meta.shape ? meta.shape : [0, 0, 10, 10];
        this.parent = null;
        this.x = meta.x ? meta.x : 0;
        this.y = meta.y ? meta.y : 0;
        this.angle = 0;
        this.scale = 1;
        this.needs_updating = false;
        this.init();
        this.local_matrix = this.localMatrix();
        this.rot_matrix = this.rotationMatrix();
      }

      Entity.prototype.mulMatrices = function(a, b) {
        var a00, a01, a02, a10, a11, a12, a20, a21, a22, b00, b01, b02, b10, b11, b12, b20, b21, b22, out;
        out = [];
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a10 = a[3];
        a11 = a[4];
        a12 = a[5];
        a20 = a[6];
        a21 = a[7];
        a22 = a[8];
        b00 = b[0];
        b01 = b[1];
        b02 = b[2];
        b10 = b[3];
        b11 = b[4];
        b12 = b[5];
        b20 = b[6];
        b21 = b[7];
        b22 = b[8];
        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22;
        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b10 * a02 + b11 * a12 + b12 * a22;
        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return out;
      };

      Entity.prototype.localMatrix = function() {
        return [this.scale, 0, this.x, 0, this.scale, this.y, 0, 0, 1];
      };

      Entity.prototype.rotationMatrix = function() {
        return [Math.cos(this.angle), -Math.sin(this.angle), 0, Math.sin(this.angle), Math.cos(this.angle), 0, 0, 0, 1];
      };

      Entity.prototype.init = function() {
        var _this = this;
        return this.on("CHANGE", function(attr) {
          var prop;
          prop = attr[0];
          if (prop === "angle" || prop === "scale" || prop === "x" || prop === "y") {
            return _this.needs_updating = true;
          }
        });
      };

      Entity.prototype.destroy = function() {
        /*
            remove all listeners
        */

      };

      Entity.prototype.update = function(delta) {
        if (this.needs_updating) {
          this.local_matrix = this.mulMatrices(this.rotationMatrix(), this.localMatrix());
          return this.needs_updating = false;
        }
      };

      Entity.prototype.draw = function(delta) {
        Hal.glass.ctx.setTransform(this.local_matrix[0], this.local_matrix[3], this.local_matrix[1], this.local_matrix[4], this.local_matrix[2], this.local_matrix[5]);
        Hal.glass.strokePolygon(this.shape, this.stroke_color);
        return Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
      };

      return Entity;

    })(HalalEntity);
    return Entity;
  });

}).call(this);
