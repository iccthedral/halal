(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["Halal", "Vec2"], function(Halal, Vec2) {
    var BBoxAlgos, BBoxDownSampler, BBoxResolver, BBoxSampler, DouglasPecker, HorizontalSampler, _ref, _ref1;
    BBoxAlgos = {
      polyBBoxFromSprite: function(sprite, sampler, downsampler) {
        if (sampler == null) {
          sampler = HorizontalSampler;
        }
        if (downsampler == null) {
          downsampler = BBoxDownsamplers.DouglasPecker;
        }
        return BBoxResolver(sprite, sampler, downsampler);
      },
      rectBBoxFromSprite: function(sprite) {
        return [0, 0, sprite.w, sprite.h];
      },
      rectFromPolyShape: function(shape) {
        var maxX, maxY, minX, minY, pt, _i, _len;
        minX = Number.MAX_VALUE;
        minY = Number.MAX_VALUE;
        maxX = -Number.MIN_VALUE;
        maxY = -Number.MIN_VALUE;
        for (_i = 0, _len = shape.length; _i < _len; _i++) {
          pt = shape[_i];
          minX = Math.min(pt[0], minX);
          minY = Math.min(pt[1], minY);
          maxX = Math.max(pt[0], maxX);
          maxY = Math.max(pt[1], maxY);
        }
        return [minX, minY, Math.abs(minX) + maxX, Math.abs(minY) + maxY];
      },
      circularBBoxFromSprite: function(sprite) {
        var rad;
        rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5;
        return [rad];
      },
      rectIntersectsRect: function(rect) {
        return Hal.m.rectIntersectsRect(rect, [this.pos[0], this.pos[1], this.bounds[2], this.bounds[3]]);
      },
      rectIntersectsCircle: function(rect) {
        return Hal.m.rectIntersectsAndHullsCircle(rect, this.pos, this.bounds[0]);
      },
      rectBoundCheck: function(pos) {
        return Hal.m.isPointInRect(pos, [this.pos[0], this.pos[1], this.bounds[2], this.bounds[3]]);
      },
      circularBoundCheck: function(pos) {
        return Hal.m.isPointInCircle(pos, this.pos, this.bounds[0]);
      }
    };
    BBoxResolver = function(sprite, sampler, downsampler) {
      var canvas, critical, criticals, ctx, findCriticalPoint, height, pixels, points, width;
      points = [];
      width = sprite.w;
      height = sprite.h;
      canvas = Halal.dom.createCanvas(width, height);
      ctx = canvas.getContext("2d");
      criticals = [];
      ctx.drawImage(sprite.img, 0, 0);
      pixels = ctx.getImageData(0, 0, width, height);
      findCriticalPoint = function() {
        var angle_treshold, degs, degs_diff, dot, first, next, p, prev_degs, pt, q, second, third, vecA, vecB, _i, _len;
        prev_degs = 0;
        degs = 0;
        angle_treshold = 1 / 3;
        if (points.length < 2) {
          return void 0;
        }
        for (q = _i = 0, _len = points.length; _i < _len; q = ++_i) {
          p = points[q];
          next = points[q + 1];
          if (next == null) {
            break;
          }
          first = Vec2.fromValues(p.x, p.y);
          second = Vec2.fromValues(next.x, next.y);
          vecA = Vec2.sub([], second, first);
          if (vecA != null) {
            third = points[q + 2];
            if (third == null) {
              break;
            }
            vecB = Vec2.sub([], second, Vec2.fromValues(third.x, third.y));
          }
          if ((vecA != null) && (vecB != null)) {
            Vec2.normalize(vecA, vecA);
            Vec2.normalize(vecB, vecB);
            dot = Vec2.dot(vecA, vecB);
            prev_degs = degs;
            degs = Vec2.dot(vecA, vecB);
            degs_diff = Math.abs(degs - prev_degs);
            if (degs_diff > angle_treshold) {
              pt = Hal.m.point(points[q + 2].x - Hal.m.epsilon, points[q + 2].y - Hal.m.epsilon);
              points.splice(0, q + 2);
              return pt;
            }
          }
        }
      };
      points = new sampler(pixels.data, width, height);
      while ((critical = findCriticalPoint())) {
        criticals.push(critical);
      }
      return new downsampler(criticals);
    };
    BBoxSampler = (function() {
      function BBoxSampler(data, width, height, sample_rate) {
        this.data = data != null ? data : [];
        this.width = width;
        this.height = height;
        this.sample_rate = sample_rate != null ? sample_rate : 1;
        return this.samplingFunc();
      }

      BBoxSampler.prototype.samplingFunc = function() {
        return [];
      };

      BBoxSampler.prototype.getPixelAt = function(x, y) {
        var pos;
        pos = (x + this.width * y) * 4;
        return [this.data[pos], this.data[pos + 1], this.data[pos + 2], this.data[pos + 3]];
      };

      return BBoxSampler;

    })();
    HorizontalSampler = (function(_super) {
      __extends(HorizontalSampler, _super);

      function HorizontalSampler() {
        _ref = HorizontalSampler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HorizontalSampler.prototype.samplingFunc = function() {
        var alpha_treshold, i, j, pix, points, _i, _j, _k, _l, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
        alpha_treshold = 130;
        points = [];
        for (i = _i = 0, _ref1 = this.width - 1, _ref2 = this.sample_rate; _ref2 > 0 ? _i <= _ref1 : _i >= _ref1; i = _i += _ref2) {
          for (j = _j = 0, _ref3 = this.height; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; j = 0 <= _ref3 ? ++_j : --_j) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.push({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        for (i = _k = 0, _ref4 = this.width - 1, _ref5 = this.sample_rate; _ref5 > 0 ? _k <= _ref4 : _k >= _ref4; i = _k += _ref5) {
          for (j = _l = _ref6 = this.height; _l >= 0; j = _l += -1) {
            pix = this.getPixelAt(i, j);
            if (pix[3] > alpha_treshold) {
              points.unshift({
                x: i,
                y: j
              });
              break;
            }
          }
        }
        return points;
      };

      return HorizontalSampler;

    })(BBoxSampler);
    BBoxDownSampler = (function() {
      function BBoxDownSampler(pts) {
        this.pts = pts;
        return this.downsamplingFunc();
      }

      BBoxDownSampler.prototype.downsamplingFunc = function() {
        return [];
      };

      return BBoxDownSampler;

    })();
    DouglasPecker = (function(_super) {
      __extends(DouglasPecker, _super);

      function DouglasPecker() {
        _ref1 = DouglasPecker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DouglasPecker.prototype.downsamplingFunc = function() {
        var dist, end, epsilon, i, index, max_dist, res, res1, res2, start, _i, _ref2;
        epsilon = 7;
        start = this.pts[0];
        end = this.pts[this.pts.length - 1];
        max_dist = 0;
        index = 0;
        res = [];
        if (this.pts.length < 2) {
          return this.pts;
        }
        for (i = _i = 1, _ref2 = this.pts.length - 2; 1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
          dist = Hal.m.perpDistance(this.pts[i], start, end);
          if (dist > max_dist) {
            index = i;
            max_dist = dist;
          }
        }
        if (max_dist > epsilon) {
          res1 = this.downsamplingFunc(this.pts.slice(0, +index + 1 || 9e9), epsilon);
          res2 = this.downsamplingFunc(this.pts.slice(index, +(this.pts.length - 1) + 1 || 9e9), epsilon);
          res1 = res1.slice(0, res1.length - 1);
          res = res1.concat(res2);
        } else {
          res.push(this.pts[0]);
          res.push(this.pts[this.pts.length - 1]);
        }
        return res;
      };

      return DouglasPecker;

    })(BBoxDownSampler);
    return BBoxAlgos;
  });

}).call(this);
