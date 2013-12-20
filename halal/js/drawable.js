(function() {
  "use strict";
  /*
   Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
  */

  define(["vec2", "geometry", "sprite"], function(Vec2, Geometry, Sprite) {
    var Drawable;
    Drawable = (function() {
      Drawable.prototype.drawableToggleState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return this._drawableState ^= state;
      };

      Drawable.prototype.drawableOnState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return this._drawableState |= state;
      };

      Drawable.prototype.drawableOffState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        this.drawableOnState(state);
        return this.drawableToggleState(state);
      };

      Drawable.prototype.drawableIsState = function(state) {
        if (state == null) {
          state = 0x00;
        }
        return (this._drawableState & state) === state;
      };

      Drawable.prototype.destructor = function() {};

      function Drawable() {
        this._drawableState = 0xF00;
        this.stroke_color = "white";
        this.fill_color = "orange";
        this.sprite = null;
        this.glow_amount = 1;
        this.glow_color = "blue";
        this.stroke_width = 1;
        this.opacity = 1;
        this.on("CHANGE", function(key, val) {
          if (key === "sprite") {
            if ((this.sprite == null) || !this.sprite instanceof Sprite) {
              return;
            }
            this.trigger("SPRITE_ADDED", this.sprite);
            this.drawableOnState(Drawable.DrawableStates.Sprite);
            this.drawableOffState(Drawable.DrawableStates.Fill);
            return this.drawableOffState(Drawable.DrawableStates.Stroke);
          } else if (key === "glow" && val === true) {
            this.drawableOnState(Drawable.DrawableStates.Stroke);
            return this.drawableOnState(Drawable.DrawableStates.Glow);
          } else if (key === "glow" && val === false) {
            return this.drawableOffState(Drawable.DrawableStates.Glow);
          }
        });
        this.on("POST_FRAME", function(delta) {
          /* @FILL*/

          var i, mid, p, p1, p2;
          if (this.drawableIsState(Drawable.DrawableStates.Fill)) {
            this.ctx.fillStyle = this.fill_color;
            this.ctx.beginPath();
            this.ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              this.ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            this.ctx.closePath();
            this.ctx.fill();
          }
          /* @DRAW @SPRITE*/

          if (this.drawableIsState(Drawable.DrawableStates.Sprite) && (this.sprite != null)) {
            this.ctx.drawImage(this.sprite.img, -this.sprite.w2, -this.sprite.h2);
          }
          /* @GLOW*/

          if (this.drawableIsState(Drawable.DrawableStates.Glow)) {
            this.ctx.shadowColor = this.glow_color;
            this.ctx.shadowBlur = this.glow_amount;
          }
          /* @STROKE*/

          if (this.drawableIsState(Drawable.DrawableStates.Stroke)) {
            this.ctx.lineWidth = this.stroke_width;
            this.ctx.strokeStyle = this.stroke_color;
            this.ctx.beginPath();
            this.ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              this.ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.lineWidth = 1;
          }
          if (this.drawableIsState(Drawable.DrawableStates.Glow)) {
            this.ctx.shadowBlur = 0;
          }
          /* @DRAW @NORMALS*/

          if (this.drawableIsState(Drawable.DrawableStates.DrawNormals)) {
            i = 0;
            p1 = Vec2.acquire();
            p2 = Vec2.acquire();
            mid = Vec2.acquire();
            p = Vec2.acquire();
            while (i < this._numvertices) {
              Vec2.copy(p1, this._mesh[i]);
              Vec2.copy(p2, this._mesh[(i + 1) % this._numvertices]);
              Vec2.addAndScale(mid, p1, p2, 0.5);
              Vec2.sub(p, p2, p1);
              Vec2.perpendicular(p1, p);
              Vec2.normalize(p2, p1);
              Vec2.scale(p1, p2, 50);
              Vec2.add(p, p1, mid);
              this.ctx.strokeStyle = "yellow";
              this.ctx.beginPath();
              this.ctx.moveTo(mid[0], mid[1]);
              this.ctx.lineTo(p[0], p[1]);
              this.ctx.closePath();
              this.ctx.stroke();
              ++i;
            }
            Vec2.release(p1);
            Vec2.release(p2);
            Vec2.release(mid);
            Vec2.release(p);
          }
          if (this.drawableIsState(Drawable.DrawableStates.DrawCenter)) {
            this.ctx.strokeRect(0, 0, 1, 1);
          }
          if (this.drawableIsState(Drawable.DrawableStates.DrawBBox)) {
            return this.ctx.strokeRect(this._bbox[0], this._bbox[1], this._bbox[2], this._bbox[3]);
          }
        });
      }

      return Drawable;

    })();
    Drawable.DrawableStates = {
      DrawCenter: 0x01,
      DrawOriginNormals: 0x02,
      Glow: 0x04,
      DrawNormals: 0x08,
      Fill: 0x10,
      Sprite: 0x20,
      DrawBBox: 0x40,
      Stroke: 0x80
    };
    return Drawable;
  });

}).call(this);
