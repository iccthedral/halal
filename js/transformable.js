(function() {
  "use strict";
  define(["vec2", "matrix3"], function(Vec2, Matrix3) {
    var Transformable;
    Transformable = (function() {
      function Transformable() {
        this.origin = Vec2.from(0, 0);
        this.scale = Vec2.from(1, 1);
        this.position = Vec2.from(0, 0);
        this.angle = 0.0;
        this._transform = Matrix3.create();
        this._inverse = Matrix3.create();
        this._update_transform = true;
        this._update_inverse = true;
      }

      return Transformable;

    })();
    Transformable.prototype.setOrigin = function(x, y, move) {
      if (move == null) {
        move = true;
      }
      if (move) {
        this.move(x - this.origin[0], y - this.origin[1]);
      }
      Vec2.set(this.origin, x, y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setPosition = function(x, y) {
      Vec2.set(this.position, x, y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setScale = function(scx, scy) {
      Vec2.set(this.scale, scx, scy);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.setRotation = function(angle) {
      this.angle = angle;
      if (this.angle < 0.0) {
        this.angle += Math.PI * 2;
      }
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.rotate = function(angle) {
      this.angle += angle;
      if (this.angle < 0) {
        this.angle += Math.PI * 2;
      }
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.move = function(x, y) {
      Vec2.set(this.position, this.position[0] + x, this.position[1] + y);
      this._update_transform = true;
      this._update_inverse = true;
      return this;
    };
    Transformable.prototype.transform = function() {
      if (this._update_transform) {
        this._transform[3] = -Math.sin(-this.angle) * this.scale[0];
        this._transform[0] = Math.cos(-this.angle) * this.scale[0];
        this._transform[1] = Math.sin(-this.angle) * this.scale[1];
        this._transform[4] = Math.cos(-this.angle) * this.scale[1];
        this._transform[2] = -this.origin[0] * this._transform[0] - this.origin[1] * this._transform[1] + this.position[0];
        this._transform[5] = -this.origin[0] * this._transform[3] - this.origin[1] * this._transform[4] + this.position[1];
        this._update_transform = false;
      }
      return this._transform;
    };
    Transformable.prototype.calcTransform = function() {
      if (this._update_transform) {
        this._transform[3] = -Math.sin(-this.angle) * this.scale[0];
        this._transform[0] = Math.cos(-this.angle) * this.scale[0];
        this._transform[1] = Math.sin(-this.angle) * this.scale[1];
        this._transform[4] = Math.cos(-this.angle) * this.scale[1];
        this._transform[2] = -this.origin[0] * this._transform[0] - this.origin[1] * this._transform[1] + this.position[0];
        this._transform[5] = this.origin[0] * this._transform[3] - this.origin[1] * this._transform[4] + this.position[1];
        this._update_transform = false;
      }
      return this._transform;
    };
    Transformable.prototype.combineTransform = function(matrix) {
      if (!this._update_transform) {
        return this.transform();
      }
      this.transform();
      this._transform = Matrix3.mul([], this._transform, matrix);
      this._update_transform = false;
      return this._transform;
    };
    Transformable.prototype.inverseTransform = function() {
      if (this._update_inverse) {
        Matrix3.inverse(this._inverse, this._transform);
        this._update_inverse = false;
      }
      return this._inverse;
    };
    return Transformable;
  });

}).call(this);
