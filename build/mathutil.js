(function() {
  "use strict";
  define(["vec2"], function(Vec2) {
    var MathUtil, pointComparison;
    MathUtil = {
      MAT_ARRAY: typeof Float32Array !== 'undefined' ? Float32Array : Array,
      epsilon: 0.000001
    };
    MathUtil.createRegularon = function(numsides, sidelen) {
      var ang, ang_step, out, t, x, y, _i, _ref;
      out = [];
      ang_step = (Math.PI * 2) / numsides;
      ang = 0;
      for (t = _i = 0, _ref = numsides - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; t = 0 <= _ref ? ++_i : --_i) {
        x = sidelen * Math.cos(ang);
        y = sidelen * Math.sin(ang);
        out.push([x, y]);
        ang += ang_step;
      }
      return out;
    };
    MathUtil.clamp = function(val, from, to) {
      if (val < from) {
        val = from;
      }
      if (val > to) {
        val = to;
      }
      return val;
    };
    MathUtil.toDegrees = function(radians) {
      return radians * 180 / Math.PI;
    };
    MathUtil.isPointInRect = function(p, rect) {
      return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3]);
    };
    MathUtil.isRectInRect = function(rectA, rectB) {
      return rectA[0] >= rectB[0] && rectA[1] >= rectB[1] && (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) && (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3]);
    };
    MathUtil.rectIntersectsRect = function(rectA, rectB) {
      return rectA[0] < (rectB[0] + rectB[2]) && (rectA[0] + rectA[2]) > rectB[0] && rectA[1] < (rectB[1] + rectB[3]) && (rectA[3] + rectA[1]) > rectB[1];
    };
    MathUtil.createRectPolygon = function(x, y, w, h) {
      return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    };
    MathUtil.doLinesIntersect = function(x1, y1, x2, y2) {
      /*
          Due to numerical instability, epsilon hack is necessarry
      */

      var bott, invbott, r, rtop, s, stop;
      rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1]);
      stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1]);
      bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0]);
      if (bott === 0) {
        return false;
      }
      invbott = 1 / bott;
      r = rtop * invbott;
      s = stop * invbott;
      if ((r > 0) && (r < 1) && (s > 0) && (s < 1)) {
        return true;
      }
      return false;
    };
    MathUtil.isPointInPoly = function(p, points) {
      var e1, e2, hits, i, len, _i, _ref;
      e1 = [-10000, p[1]];
      e2 = p;
      hits = 0;
      len = points.length;
      for (i = _i = 0, _ref = len - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this.doLinesIntersect(e1, e2, points[i], points[(i + 1) % len])) {
          hits++;
        }
      }
      return (hits % 2) !== 0;
    };
    MathUtil.projectPointOnLine = function(pt, a, b) {
      var dotProd, lenAC, vecAB, vecAC, vecCProj;
      vecAB = Vec2.sub([], b, a);
      vecAC = Vec2.sub([], pt, a);
      Vec2.normalize(vecAB, vecAB);
      Vec2.normalize(vecAC, vecAC);
      dotProd = Vec2.dot(vecAC, vecAB);
      lenAC = Vec2.distance(a, pt);
      vecCProj = Vec2.scale([], vecAB, dotProd * lenAC);
      vecCProj = Vec2.fromValues(a[0] + vecCProj[0], a[1] + vecCProj[1]);
      return vecCProj;
    };
    MathUtil.rectIntersectsCircle = function(rect, circpos, radius) {
      return this.lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius);
    };
    MathUtil.rectIntersectsOrHullsCircle = function(rect, circpos, radius) {
      return this.rectIntersectsCircle(rect, circpos, radius) || this.isPointInRect(circpos, rect);
    };
    MathUtil.lineIntersectsCircle = function(line, circpos, radius) {
      var dist;
      dist = this.perpDistanceToSegment(circpos, line[0], line[1]);
      return dist < radius;
    };
    MathUtil.perpDistance = function(pt, a, b) {
      var c;
      c = this.projectPointOnLine(pt, a, b);
      return Vec2.distance(pt, c);
    };
    MathUtil.perpDistanceToSegment = function(pt, a, b) {
      var c, linelen;
      c = this.projectPointOnLine(pt, a, b);
      linelen = Vec2.distance(a, b);
      if (Vec2.distance(a, c) > linelen || Vec2.distance(b, c) > linelen) {
        return Number.NaN;
      }
      return Vec2.distance(pt, c);
    };
    MathUtil.isPointInCircle = function(pt, circpos, radius) {
      var dist, distX, distY;
      distX = pt[0] - circpos[0];
      distY = pt[1] - circpos[1];
      dist = Math.sqrt((distX * distX) + (distY * distY));
      return dist < radius;
    };
    pointComparison = function(a, b, center) {
      var d1, d2, det;
      if (a[0] >= 0 && b[0] < 0) {
        return true;
      }
      if (a[0] === 0 && b[0] === 0) {
        return a[1] > b[1];
      }
      det = (a[0] - center[0]) * (b[1] - center[1]) - (b[0] - center[0]) * (a[1] - center[1]);
      if (det < 0) {
        return true;
      }
      if (det > 0) {
        return false;
      }
      d1 = (a[0] - center[0]) * (a[0] - center[0]) + (a[1] - center[1]) * (a[1] - center[1]);
      d2 = (b[0] - center[0]) * (b[0] - center[0]) + (b[1] - center[1]) * (b[1] - center[1]);
      return d1 > d2;
    };
    return MathUtil;
  });

}).call(this);
