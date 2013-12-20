(function() {
  "use strict";
  define([], function() {
    var Renderer;
    Renderer = (function() {
      function Renderer(bounds, canvas, top_z, transp) {
        this.bounds = bounds;
        this.top_z = top_z;
        if (transp == null) {
          transp = false;
        }
        this.canvases = {};
        this.contexts = [];
        this.canvases[this.top_z] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], this.top_z, transp);
        Hal.dom.addCanvas(this.canvases[this.top_z], this.bounds[0], this.bounds[1]);
        this.ctx = this.canvases[this.top_z].getContext("2d");
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
    Renderer.prototype.getLayerContext = function(z) {
      var layer;
      layer = this.canvases[this.top_z + z];
      if (layer != null) {
        return layer.getContext("2d");
      }
    };
    Renderer.prototype.createLayers = function(z_indices) {
      var layer, z, _i, _len;
      for (_i = 0, _len = z_indices.length; _i < _len; _i++) {
        z = z_indices[_i];
        layer = this.top_z + z;
        console.log("layer: " + layer);
        this.canvases[layer] = Hal.dom.createCanvasLayer(this.bounds[2], this.bounds[3], layer, true);
        Hal.dom.addCanvas(this.canvases[layer], this.bounds[0], this.bounds[1]);
        this.contexts.push(this.getLayerContext(layer));
      }
      console.debug(this.sortLayers());
      return this.contexts;
    };
    Renderer.prototype.sortLayers = function() {
      var sc, z, _ref, _results;
      return this.contexts = this.contexts.sort(function(a, b) {
        var diff;
        diff = (+a.canvas.style["z-index"]) - (+b.canvas.style["z-index"]);
        return console.debug("diff: " + diff);
      });
      this.destroy();
      _ref = this.contexts;
      _results = [];
      for (z in _ref) {
        sc = _ref[z];
        z = c.canvas.style["z-index"];
        this.canvases[z] = c.canvas;
        _results.push(Hal.dom.addCanvas(z));
      }
      return _results;
    };
    Renderer.prototype.removeLayer = function(z) {
      return Hal.dom.removeCanvasLayer(z);
    };
    Renderer.prototype.destroy = function() {
      var canvas, z, _ref, _results;
      llogi("Destroying all canvases under renderer at " + this.top_z + ": ");
      _ref = this.canvases;
      _results = [];
      for (z in _ref) {
        canvas = _ref[z];
        _results.push(this.removeLayer(z));
      }
      return _results;
    };
    return Renderer;
  });

}).call(this);
