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
          state = DrawableStates.stroke;
        }
        return this._drawableState ^= state;
      };

      Drawable.prototype.drawableOnState = function(state) {
        return this._drawableState |= state;
      };

      Drawable.prototype.drawableOffState = function(state) {
        this.drawableOnState(state);
        return this.drawableToggleState(state);
      };

      Drawable.prototype.drawableIsState = function(state) {
        return (this._drawableState & state) === state;
      };

      function Drawable() {
        llogd(this);
        this._drawableState = 0x00;
        this.stroke_color = "white";
        this.fill_color = "orange";
        this.sprite = null;
        this.glow_amount = 1;
        this.glow_color = "blue";
        this.stroke_width = 1;
        this.on("CHANGE", function(key, val) {
          var shape;
          if (key === "sprite") {
            if ((this.sprite == null) || !this.sprite instanceof Sprite) {
              return;
            }
            shape = Geometry.createPolygonFromRectangle(this.sprite.w2, this.sprite.h2);
            lloge(shape);
            debugger;
            this.setShape(shape);
            this.drawableOnState(this.DrawableStates.Sprite);
            this.drawableOffState(this.DrawableStates.Fill);
            return this.drawableOffState(this.DrawableStates.Stroke);
          } else if (key === "glow" && val === true) {
            this.drawableOnState(this.DrawableStates.Stroke);
            return this.drawableOnState(this.DrawableStates.Glow);
          } else if (key === "glow" && val === false) {
            return this.drawableOffState(this.DrawableStates.Glow);
          }
        });
        this.on("POST_FRAME", function(ctx, delta) {
          /* @FILL*/

          var i, mid, p, p1, p2;
          if (this.drawableIsState(this.DrawableStates.Fill)) {
            ctx.fillStyle = this.fill_color;
            ctx.beginPath();
            ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            ctx.closePath();
            ctx.fill();
          }
          /* @DRAW @SPRITE*/

          if (this.drawableIsState(this.DrawableStates.Sprite) && (this.sprite != null)) {
            ctx.drawImage(this.sprite.img, -this.sprite.w2, -this.sprite.h2);
          }
          /* @GLOW*/

          if (this.drawableIsState(this.DrawableStates.Glow)) {
            ctx.shadowColor = this.glow_color;
            ctx.shadowBlur = this.glow_amount;
          }
          /* @STROKE*/

          if (this.drawableIsState(this.DrawableStates.Stroke)) {
            ctx.lineWidth = this.stroke_width;
            ctx.strokeStyle = this.stroke_color;
            ctx.beginPath();
            ctx.moveTo(this._mesh[0][0], this._mesh[0][1]);
            i = 1;
            while (i < this._numvertices) {
              ctx.lineTo(this._mesh[i][0], this._mesh[i][1]);
              ++i;
            }
            ctx.closePath();
            ctx.stroke();
            ctx.lineWidth = 1;
          }
          if (this.drawableIsState(this.DrawableStates.Glow)) {
            ctx.shadowBlur = 0;
          }
          /* @DRAW @NORMALS*/

          if (this.drawableIsState(this.DrawableStates.DrawNormals)) {
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
              ctx.strokeStyle = "yellow";
              ctx.beginPath();
              ctx.moveTo(mid[0], mid[1]);
              ctx.lineTo(p[0], p[1]);
              ctx.closePath();
              ctx.stroke();
              ++i;
            }
            Vec2.release(p1);
            Vec2.release(p2);
            Vec2.release(mid);
            Vec2.release(p);
          }
          if (this.drawableIsState(this.DrawableStates.DrawCenter)) {
            ctx.strokeRect(0, 0, 1, 1);
          }
          if (this.drawableIsState(this.DrawableStates.DrawBBox)) {
            return ctx.strokeRect(this._bbox[0], this._bbox[1], this._bbox[2], this._bbox[3]);
          }
        });
      }

      return Drawable;

    })();
    Drawable.prototype.DrawableStates = {
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
