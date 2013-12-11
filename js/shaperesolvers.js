(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["vec2", "mathutil", "geometry"], function(Vec2, MathUtil, Geometry) {
    var BBDownSampler, BBResolvers, BBSampler, BBSamplerResolver, DouglasPecker, HorizontalSampler, _ref, _ref1;
    BBResolvers = {
      AABPolygonFromSprite: function(sprite, sampler, downsampler) {
        if (sampler == null) {
          sampler = HorizontalSampler;
        }
        if (downsampler == null) {
          downsampler = DouglasPecker;
        }
        return BBSamplerResolver(sprite, sampler, downsampler);
      },
      AABBoxFromSprite: function(sprite) {
        var out;
        out = new MathUtil.ARRAY_TYPE(4);
        out[0] = -sprite.w * 0.5;
        out[1] = -sprite.h * 0.5;
        out[2] = sprite.w;
        out[3] = sprite.h;
        return out;
      },
      AABCircleFromSprite: function(sprite) {
        var rad;
        rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5;
        return rad;
      },
      AABBFromPolygon: function(polygon) {
        var maxX, maxY, minX, minY, out, pt, _i, _len;
        minX = Number.MAX_VALUE;
        minY = Number.MAX_VALUE;
        maxX = -Number.MIN_VALUE;
        maxY = -Number.MIN_VALUE;
        for (_i = 0, _len = polygon.length; _i < _len; _i++) {
          pt = polygon[_i];
          minX = Math.min(pt[0], minX);
          minY = Math.min(pt[1], minY);
          maxX = Math.max(pt[0], maxX);
          maxY = Math.max(pt[1], maxY);
        }
        out = new MathUtil.ARRAY_TYPE(4);
        out[0] = minX;
        out[1] = minY;
        out[2] = Math.abs(minX) + maxX;
        out[3] = Math.abs(minY) + maxY;
        return out;
      }
    };
    BBSamplerResolver = function(sprite, sampler, downsampler) {
      var canvas, critical, criticals, ctx, findCriticalPoint, height, pixels, points, width;
      points = [];
      width = sprite.w;
      height = sprite.h;
      canvas = Hal.dom.createCanvas(width, height);
      ctx = canvas.getContext("2d");
      criticals = [];
      ctx.drawImage(sprite.img, 0, 0);
      pixels = ctx.getImageData(0, 0, width, height);
      findCriticalPoint = function() {
        var angle_treshold, degs, degs_diff, dot, first, next, p, prev_degs, pt, q, second, third, vecA, vecB, _i, _len;
        prev_degs = 0;
        degs = 0;
        angle_treshold = 1 / 33;
        if (points.length < 2) {
          return void 0;
        }
        for (q = _i = 0, _len = points.length; _i < _len; q = ++_i) {
          p = points[q];
          next = points[q + 1];
          if (next == null) {
            break;
          }
          first = Vec2.from(p.x, p.y);
          second = Vec2.from(next.x, next.y);
          vecA = Vec2.sub([], second, first);
          if (vecA != null) {
            third = points[q + 2];
            if (third == null) {
              break;
            }
            vecB = Vec2.sub([], second, Vec2.from(third.x, third.y));
          }
          if ((vecA != null) && (vecB != null)) {
            Vec2.normalize(vecA, vecA);
            Vec2.normalize(vecB, vecB);
            dot = Vec2.dot(vecA, vecB);
            prev_degs = degs;
            degs = Vec2.dot(vecA, vecB);
            degs_diff = Math.abs(degs - prev_degs);
            if (degs_diff > angle_treshold) {
              pt = [points[q + 2].x - MathUtil.EPSILON, points[q + 2].y - MathUtil.EPSILON];
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
      Hal.log.debug("Number of critical points: " + criticals.length);
      return new downsampler(criticals);
    };
    BBSampler = (function() {
      function BBSampler(data, width, height, sample_rate) {
        this.data = data != null ? data : [];
        this.width = width;
        this.height = height;
        this.sample_rate = sample_rate != null ? sample_rate : 1;
        return this.samplingFunc();
      }

      BBSampler.prototype.samplingFunc = function() {
        return [];
      };

      BBSampler.prototype.getPixelAt = function(x, y) {
        var pos;
        pos = (x + this.width * y) * 4;
        return [this.data[pos], this.data[pos + 1], this.data[pos + 2], this.data[pos + 3]];
      };

      return BBSampler;

    })();
    /*
        @todo Vertical sampler
    */

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

    })(BBSampler);
    BBDownSampler = (function() {
      function BBDownSampler(pts) {
        return this.downsamplingFunc(pts);
      }

      BBDownSampler.prototype.downsamplingFunc = function() {
        return [];
      };

      return BBDownSampler;

    })();
    DouglasPecker = (function(_super) {
      __extends(DouglasPecker, _super);

      function DouglasPecker() {
        _ref1 = DouglasPecker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DouglasPecker.prototype.downsamplingFunc = function(pts) {
        var dist, end, epsilon, i, index, max_dist, res, res1, res2, start, _i, _ref2;
        epsilon = 3;
        start = pts[0];
        end = pts[pts.length - 1];
        max_dist = 0;
        index = 0;
        res = [];
        if (pts.length < 2) {
          return pts;
        }
        for (i = _i = 1, _ref2 = pts.length - 2; 1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
          dist = Geometry.perpDistance(pts[i], start, end);
          if (dist > max_dist) {
            index = i;
            max_dist = dist;
          }
        }
        if (max_dist > epsilon) {
          res1 = this.downsamplingFunc(pts.slice(0, +index + 1 || 9e9));
          res2 = this.downsamplingFunc(pts.slice(index, +(pts.length - 1) + 1 || 9e9));
          res1 = res1.slice(0, res1.length - 1);
          res = res1.concat(res2);
        } else {
          res.push(pts[0]);
          res.push(pts[pts.length - 1]);
        }
        return res;
      };

      return DouglasPecker;

    })(BBDownSampler);
    return BBResolvers;
  });

}).call(this);
