(function() {
  "use strict";
  define(["vec2"], function(Vec2) {
    var QuadTree, capacity, total;
    capacity = 1;
    total = 0;
    QuadTree = (function() {
      function QuadTree(bounds) {
        this.bounds = bounds;
        this.pts = [];
        this.nw = null;
        this.sw = null;
        this.ne = null;
        this.se = null;
        this.id = Hal.ID();
      }

      QuadTree.prototype.total = function() {
        return total;
      };

      QuadTree.prototype.insert = function(ent) {
        if (!Hal.math.isPointInRect(ent.worldPos(), this.bounds)) {
          return false;
        }
        if (this.pts.length < capacity) {
          ent.quadspace = this;
          this.pts.push(ent);
          total++;
          return true;
        }
        if (this.nw == null) {
          this.divide();
        }
        if (this.nw.insert(ent)) {
          return true;
        }
        if (this.ne.insert(ent)) {
          return true;
        }
        if (this.sw.insert(ent)) {
          return true;
        }
        if (this.se.insert(ent)) {
          return true;
        }
        return false;
      };

      QuadTree.prototype.remove = function(ent) {
        var ind;
        ind = this.pts.indexOf(ent);
        if (ind === -1) {
          return;
        }
        this.pts.splice(ind, 1);
        return total--;
      };

      QuadTree.prototype.searchInRange = function(pos, range, scene) {
        var cp, entsInRange, lab, p, _i, _len, _ref;
        entsInRange = [];
        lab = [pos[0] - range, pos[1] - range, 2 * range, 2 * range];
        if (!Hal.math.rectIntersectsRect(lab, this.bounds)) {
          return entsInRange;
        }
        _ref = this.pts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          cp = p.worldToLocal(scene.localToWorld(pos));
          if (Hal.math.rectIntersectsRect(p.bbox, [cp[0] - range * 0.5, cp[1] - range * 0.5, range, range])) {
            entsInRange.push(p);
          }
        }
        if (this.nw == null) {
          return entsInRange;
        }
        entsInRange = entsInRange.concat(this.nw.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.ne.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.sw.searchInRange(pos, range, scene));
        entsInRange = entsInRange.concat(this.se.searchInRange(pos, range, scene));
        return entsInRange;
      };

      QuadTree.prototype.divide = function() {
        var h, w;
        w = this.bounds[2] * 0.5;
        h = this.bounds[3] * 0.5;
        this.nw = new QuadTree([this.bounds[0], this.bounds[1], w, h]);
        this.ne = new QuadTree([this.bounds[0] + w, this.bounds[1], w, h]);
        this.sw = new QuadTree([this.bounds[0], this.bounds[1] + h, w, h]);
        return this.se = new QuadTree([this.bounds[0] + w, this.bounds[1] + h, w, h]);
      };

      return QuadTree;

    })();
    return QuadTree;
  });

}).call(this);
