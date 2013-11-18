(function() {
  "use strict";
  define([], function() {
    var Renderer;
    Renderer = (function() {
      function Renderer(bounds, canvas, z) {
        this.bounds = bounds;
        if (canvas != null) {
          this.canvas = canvas;
        } else {
          this.canvas = Hal.dom.createCanvasLayer(z);
          this.bounds[0] = 0;
          this.bounds[1] = 0;
          Hal.dom.addCanvas(this.canvas, this.bounds[0], this.bounds[1], true);
        }
        this.ctx = this.canvas.getContext("2d");
      }

      return Renderer;

    })();
    Renderer.prototype.resize = function(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.prev_bnds = this.bounds.slice();
      this.bounds[2] = w;
      return this.bounds[3] = h;
    };
    Renderer.prototype.strokePolygon = function(points, style) {
      var p, _i, _len, _ref;
      this.ctx.strokeStyle = style;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);
      _ref = points.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        this.ctx.lineTo(p[0], p[1]);
      }
      this.ctx.closePath();
      return this.ctx.stroke();
    };
    Renderer.prototype.drawLine = function(x0, y0, x1, y1, style) {
      this.ctx.strokeStyle = style;
      this.ctx.beginPath();
      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.closePath();
      return this.ctx.stroke();
    };
    Renderer.prototype.strokeRect = function(pts, style) {
      this.ctx.strokeStyle = style;
      return this.ctx.strokeRect(pts[0], pts[1], pts[2], pts[3]);
    };
    Renderer.prototype.drawSprite = function(sprite) {
      return this.ctx.drawImage(sprite.img, -sprite.w2, -sprite.h2);
    };
    return Renderer;
  });

}).call(this);
