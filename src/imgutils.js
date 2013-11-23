(function() {
  "use strict";
  define([], function() {
    var ImageUtils;
    ImageUtils = (function() {
      function ImageUtils() {
        this.hit_ctx = this.createCanvas(1, 1).getContext("2d");
        /* 
         @todo 
            Ovo treba biti maks velicine
        */

        this.tint_ctx = this.createCanvas(800, 600).getContext("2d");
      }

      ImageUtils.prototype.createCanvas = function(w, h) {
        var canvas;
        canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        return canvas;
      };

      ImageUtils.prototype.clipImage = function(img, area) {
        var canvas, ctx;
        canvas = this.createCanvas(area.w, area.h);
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h);
        img = new Image();
        img.src = canvas.toDataURL("image/png");
        return img;
      };

      ImageUtils.prototype.isTransparent = function(img, x, y) {
        var data;
        this.hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
        data = this.hit_ctx.getImageData(0, 0, 1, 1).data;
        return data[3] === 255;
      };

      ImageUtils.prototype.getPixelAt = function(img, x, y) {
        var data, pos;
        this.hit_ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
        data = this.hit_ctx.getImageData(0, 0, 1, 1).data;
        pos = (x + y) * 4;
        return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
      };

      ImageUtils.prototype.tintImage = function(img, color, opacity) {
        var tint_buff, tint_ctx;
        tint_buff = this.createCanvas(img.width, img.height);
        tint_ctx = tint_buff.getContext("2d");
        tint_ctx.globalAlpha = 1.0;
        tint_ctx.drawImage(img, 0, 0);
        tint_ctx.globalAlpha = opacity;
        tint_ctx.globalCompositeOperation = 'source-atop';
        tint_ctx.fillStyle = color;
        tint_ctx.fillRect(0, 0, img.width, img.height);
        return tint_buff;
      };

      return ImageUtils;

    })();
    return ImageUtils;
  });

}).call(this);
