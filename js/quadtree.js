(function() {
  "use strict";
  define(["vec2", "geometry", "matrix3"], function(Vec2, Geometry, Matrix3) {
    var QuadTree, capacity, total;
    capacity = 8;
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
        if (!Geometry.isPointInRectangle(ent.position, this.bounds)) {
          llogd("Entity doesnt't interrsect " + this.id);
          return false;
        }
        if (this.pts.length < capacity) {
          ent.attr("quadspace", this);
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
          lloge("Entity " + ent.id + " is not in quadspace");
          return;
        }
        this.pts.splice(ind, 1);
        return total--;
      };

      QuadTree.prototype.findById = function(id) {
        var findRec, out;
        out = null;
        findRec = function(where) {
          if (id === where.id) {
            return out = where;
          } else if (out == null) {
            if ((where.nw != null) && (out == null)) {
              findRec(where.nw);
            }
            if ((where.sw != null) && (out == null)) {
              findRec(where.sw);
            }
            if ((where.ne != null) && (out == null)) {
              findRec(where.ne);
            }
            if ((where.se != null) && (out == null)) {
              return findRec(where.se);
            }
          }
        };
        findRec(this);
        return out;
      };

      QuadTree.prototype.findUnder = function() {
        var out;
        out = this.pts.slice();
        if (this.nw != null) {
          out = out.concat(this.nw.findUnder());
        }
        if (this.sw != null) {
          out = out.concat(this.sw.findUnder());
        }
        if (this.ne != null) {
          out = out.concat(this.ne.findUnder());
        }
        if (this.se != null) {
          out = out.concat(this.se.findUnder());
        }
        return out;
      };

      QuadTree.prototype.findQuadsInRectangle = function(rect, matrix) {
        var quads, transformBnds;
        transformBnds = Geometry.transformRectangle(this.bounds, matrix);
        quads = [];
        if (!Geometry.rectangleIntersectsOrContainsRectangle(rect, transformBnds)) {
          return quads;
        }
        quads = [this];
        if (this.nw == null) {
          return quads;
        }
        quads = quads.concat(this.nw.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.ne.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.sw.findQuadsInRectangle(rect, matrix));
        quads = quads.concat(this.se.findQuadsInRectangle(rect, matrix));
        return quads;
      };

      QuadTree.prototype.findEntitiesInRectangle = function(range, matrix) {
        var entsInRange, p, ret, transformBnds, _i, _len, _ref;
        entsInRange = [];
        transformBnds = Geometry.transformRectangle(this.bounds, matrix);
        if (!Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)) {
          console.debug("not in this quadspace: " + this.id);
          return entsInRange;
        }
        _ref = this.pts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          ret = Geometry.rectangleIntersectsOrContainsRectangle(range, Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)));
          if (!ret) {
            continue;
          }
          entsInRange.push(p);
        }
        if (this.nw == null) {
          return entsInRange;
        }
        entsInRange = entsInRange.concat(this.nw.searchInRange(range, scene));
        entsInRange = entsInRange.concat(this.ne.searchInRange(range, scene));
        entsInRange = entsInRange.concat(this.sw.searchInRange(range, scene));
        entsInRange = entsInRange.concat(this.se.searchInRange(range, scene));
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
