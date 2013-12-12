(function() {
  "use strict";
  define([], function() {
    var Renderer;
    Renderer = (function() {
      function Renderer(bounds, canvas, z) {
        this.bounds = bounds;
        this.z = z;
        this.canvases = {};
        if (canvas != null) {
          this.canvases[z] = canvas;
        } else {
          this.canvases[this.z] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], z);
          Hal.dom.addCanvas(this.canvases[this.z], this.bounds[0], this.bounds[1], true);
        }
        this.ctx = this.canvases[this.z].getContext("2d");
      }

      return Renderer;

    })();
    Renderer.prototype.resize = function(w, h) {
      var canvas, k, _ref, _results;
      _ref = this.canvases;
      _results = [];
      for (k in _ref) {
        canvas = _ref[k];
        canvas.width = w;
        canvas.height = h;
        this.prev_bnds = this.bounds.slice();
        this.bounds[2] = w;
        _results.push(this.bounds[3] = h);
      }
      return _results;
    };
    ({
      createLayers: function(z_indices) {
        var layer, z, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = z_indices.length; _i < _len; _i++) {
          z = z_indices[_i];
          layer = this.z + z;
          this.canvases[layer] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], layer);
          _results.push(Hal.dom.addCanvas(this.canvases[layer], this.bounds[0], this.bounds[1], true));
        }
        return _results;
      }
    });
    return Renderer;
  });

}).call(this);
