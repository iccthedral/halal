(function() {
  "use strict";
  define(["vec2", "matrix3", "mathutil"], function(Vec2, Matrix3, MathUtil) {
    var Geometry;
    Geometry = new Object();
    Geometry.toDegrees = function(radians) {
      return radians * MathUtil.RADIAN;
    };
    Geometry.toRadians = function(degrees) {
      return degrees * MathUtil.DEGREE;
    };
    /*
        Returns angle of point with respect to the origin (x-axis half-plane)
    */

    Geometry.angleOfPoint = function(p) {
      var atan;
      atan = Math.atan2(-p[1], p[0]);
      if (atan < 0) {
        atan += Math.PI * 2;
      }
      return atan;
    };
    /*
        Returns angle between two lines in radians (x-axis half-plane)
    */

    Geometry.angleOfLines = function(a, b) {
      var a1, b1;
      a1 = Vec2.acquire();
      b1 = Vec2.acquire();
      Vec2.normalize(a1, a);
      Vec2.normalize(b1, b);
      return Math.acos(Vec2.dot(a1, b1));
    };
    /*
        Returns a set of points of a regular AA polygon, with the origin at [0, 0]
        numsides: Number of sides
        sidelen: Length of each side
    */

    Geometry.createRegularPolygon = function(numedges, edgelen) {
      var ang, ang_step, out, t, x, y, _i;
      out = [];
      ang_step = MathUtil.TAU / numedges;
      ang = 0;
      for (t = _i = 0; 0 <= numedges ? _i < numedges : _i > numedges; t = 0 <= numedges ? ++_i : --_i) {
        x = edgelen * Math.cos(ang);
        y = edgelen * Math.sin(ang);
        out.push(Vec2.from(x, y));
        ang += ang_step;
      }
      return out;
    };
    Geometry.createStarPolygon = function(base_radius, num_krakova, kraklen) {
      var base, i, len, mid, p, p1, p2;
      base = this.createRegularPolygon(num_krakova, base_radius);
      len = base.length;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      mid = Vec2.acquire();
      i = 0;
      while (i < len) {
        Vec2.copy(p1, base[i]);
        Vec2.copy(p2, base[(i + 1) % len]);
        Vec2.addAndScale(mid, p1, p2, 0.5);
        p = Vec2.acquire();
        Vec2.sub(p, p2, p1);
        Vec2.perpendicular(p1, p);
        Vec2.normalize(p2, p1);
        Vec2.scale(p, p2, kraklen);
        p[0] += mid[0];
        p[1] += mid[1];
        base.push(p);
        ++i;
      }
      Vec2.release(p1);
      Vec2.release(p2);
      Vec2.release(mid);
      return this.polygonSortVertices(base);
    };
    /*
        Returns a set of 4 points, representing AA polygon with respect to the origin
    */

    Geometry.createPolygonFromRectangle = function(w2, h2) {
      return [Vec2.from(-w2, h2), Vec2.from(w2, -h2), Vec2.from(-w2, -h2), Vec2.from(w2, h2)];
    };
    Geometry.isPointInRectangle = function(p, rect) {
      return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3]);
    };
    /*
        Returns true if point pt is in the circle
    */

    Geometry.isPointInCircle = function(pt, circpos, radius) {
      var dist, distX, distY;
      distX = pt[0] - circpos[0] || 0;
      distY = pt[1] - circpos[1] || 0;
      dist = Math.sqrt((distX * distX) + (distY * distY));
      return dist < radius;
    };
    /*
        This one has some strage corner cases, don't use it.
        @deprecated
    */

    Geometry.isPointInPolygonDeprecated = function(p, poly) {
      var e1, e2, hits, i, len, _i;
      e1 = Vec2.acquire();
      Vec2.set(e1, -10000000, p[1] - MathUtil.EPSILON);
      e2 = p;
      hits = 0;
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        if (this.lineIntersectsLine(e1, e2, poly[i], poly[(i + 1) % len])) {
          hits++;
        }
      }
      Vec2.release(e1);
      return (hits % 2) !== 0;
    };
    /*
        Returns true if polygon contains point, otherwise false
        How it works:
            For every polygon edge [v1,v2], check if the point is always on the same half-plane,
            as it winds around.
    */

    Geometry.isPointInPolygon = function(p, poly) {
      var left, len, lr, right, v1, v2, _i;
      v1 = v2 = lr = 0;
      left = right = false;
      len = poly.length;
      v1 = len - 1;
      for (v2 = _i = 0; 0 <= len ? _i < len : _i > len; v2 = 0 <= len ? ++_i : --_i) {
        lr = this.isPointLeftOrRightOfLine(p, poly[v1], poly[v2]);
        if (lr > 0) {
          right = true;
        }
        if (lr < 0) {
          left = true;
        }
        v1 = v2;
      }
      return !(left && right);
    };
    /*
        Returns true if polygon is convex, otherwise false
        Same idea as above
    */

    Geometry.isPolygonConvex = function(poly) {
      var left, len, lr, right, v0, v1, v2, _i;
      v0 = v1 = lr;
      left = right = false;
      len = poly.length;
      if (len <= 3) {
        return true;
      }
      v0 = len - 2;
      v1 = len - 1;
      for (v2 = _i = 0; 0 <= len ? _i < len : _i > len; v2 = 0 <= len ? ++_i : --_i) {
        lr = this.isPointLeftOrRightOfLine(poly[v2], poly[v0], poly[v1]);
        if (lr > 0) {
          right = true;
        }
        if (lr < 0) {
          left = true;
        }
        v0 = v1;
        v1 = v2;
      }
      return !(left && right);
    };
    /* 
        When delta is 0, point p is collinear to [a, b] segment
        When delta is less than 0, it's on the left (assuming ccw ordering)
        Otherwise, it's on the right (assuming ccw ordering)
    */

    Geometry.isPointLeftOrRightOfLine = function(p, a, b) {
      var delta;
      delta = (b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + a[1] * b[0] - a[0] * b[1];
      return delta;
    };
    /*
        @todo Need to revise these rect in rect, etc.
    */

    Geometry.rectangleContainsRectangle = function(rectA, rectB) {
      return rectA[0] >= rectB[0] && rectA[1] >= rectB[1] && (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) && (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3]);
    };
    Geometry.rectangleContainsCircle = function(circpos, radius, rect) {
      return false;
    };
    Geometry.rectangleIntersectsRectangle = function(rectA, rectB) {
      return rectA[0] <= (rectB[0] + rectB[2]) && (rectA[0] + rectA[2]) >= rectB[0] && rectA[1] <= (rectB[1] + rectB[3]) && (rectA[3] + rectA[1]) >= rectB[1];
    };
    Geometry.rectangeIntersectsOrContainsRectangle = function(rectA, rectB) {
      return this.rectangleIntersectsRectangle(rectA, rectB) || this.rectangleContainsRectangle(rectA, rectB);
    };
    Geometry.rectangleIntersectsOrContainsCircle = function(rect, circpos, radius) {
      return this.rectangleIntersectsCircle(rect, circpos, radius) || this.isPointInRectangle(circpos, rect);
    };
    Geometry.rectangleIntersectsCircle = function(rect, circpos, radius) {
      return this.lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) || this.lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius);
    };
    Geometry.lineIntersectsLine = function(x1, y1, x2, y2) {
      /*
          Due to numerical instability, epsilon hack is necessarry
      */

      var bott, invbott, r, rtop, s, stop;
      rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1]);
      stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1]);
      bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0]);
      if (bott === 0.0) {
        return false;
      }
      invbott = 1.0 / bott;
      r = rtop * invbott;
      s = stop * invbott;
      return (r > 0.0) && (r < 1.0) && (s > 0.0) && (s < 1.0);
    };
    Geometry.lineIntersectsPolygon = function(a, b, poly) {
      var i, len, _i;
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        if (this.lineIntersectsLine(a, b, poly[i], poly[(i + 1) % len])) {
          return true;
        }
      }
      return false;
    };
    Geometry.lineIntersectsCircle = function(line, circpos, radius) {
      var dist;
      dist = this.perpendicularDistanceToLine(circpos, line[0], line[1]);
      return dist < radius;
    };
    Geometry.polygonPointInHull = function(poly) {
      var len, pmax, point, _i;
      pmax = poly[0];
      len = poly.length;
      for (point = _i = 1; 1 <= len ? _i < len : _i > len; point = 1 <= len ? ++_i : --_i) {
        if (point[0] > pmax[0] || (point[0] === pmax[0] && point[1] > pmax[1])) {
          pmax[0] = point[0];
          pmax[1] = point[1];
        }
      }
      return pmax;
    };
    Geometry.polygonSortVertices = function(poly) {
      var a, i, ind, indices, len, mark, t, val, _i, _j, _k, _len;
      a = new Array();
      t = this.polygonMeanPoint(poly);
      len = poly.length;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        a[i] = this.angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]]);
      }
      indices = new Array();
      for (i = _j = 0; 0 <= len ? _j < len : _j > len; i = 0 <= len ? ++_j : --_j) {
        val = a[i];
        mark = i;
        while (mark > 0 && val > a[mark - 1]) {
          a[mark] = a[mark - 1];
          indices[mark] = indices[mark - 1];
          mark--;
        }
        a[mark] = val;
        indices[mark] = i;
      }
      for (i = _k = 0, _len = indices.length; _k < _len; i = ++_k) {
        ind = indices[i];
        Vec2.copy(a[i], poly[ind]);
      }
      Vec2.release(t);
      return a.reverse();
    };
    /*
        Returns convex hull of a concave degenerate polygon
    */

    Geometry.polygonConvexHull = function(poly) {
      var a, convex, done, first, i, j, k, last, len, m, next, pmax, point, prev, t, _i, _j, _k, _l;
      len = poly.length;
      if (len <= 3) {
        return poly;
      }
      t = this.polygonMeanPoint(poly);
      a = new Array();
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        a[i] = this.angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]]);
      }
      k = 0;
      pmax = poly[0];
      for (i = _j = 1; 1 <= len ? _j < len : _j > len; i = 1 <= len ? ++_j : --_j) {
        point = poly[i];
        if (point[0] > pmax[0] || point[0] === pmax[0] && point[1] > pmax[1]) {
          pmax = point;
          k = i;
        }
      }
      prev = new Array();
      next = new Array();
      first = last = j = 0;
      for (i = _k = 1; 1 <= len ? _k < len : _k > len; i = 1 <= len ? ++_k : --_k) {
        if (a[i] <= a[first]) {
          next[i] = first;
          prev[first] = i;
          first = i;
        } else if (a[i] >= a[last]) {
          prev[i] = last;
          next[last] = i;
          last = i;
        } else {
          j = first;
          while (a[j] < a[i]) {
            j = next[j];
          }
          next[i] = j;
          prev[i] = prev[j];
          next[prev[j]] = i;
          prev[j] = i;
        }
      }
      prev[first] = last;
      next[last] = first;
      m = len;
      done = false;
      i = k;
      while (true) {
        if (this.isPointLeftOrRightOfLine(poly[next[next[i]]], poly[i], poly[next[i]]) >= 0) {
          m--;
          j = next[next[i]];
          next[i] = j;
          prev[j] = i;
          i = prev[i];
        } else {
          i = next[i];
        }
        if (next[next[i]] === k) {
          done = true;
        }
        if (!(!done || (next[i] !== k))) {
          break;
        }
      }
      convex = [];
      for (i = _l = 0; 0 <= m ? _l < m : _l > m; i = 0 <= m ? ++_l : --_l) {
        convex[i] = poly[k];
        k = next[k];
      }
      Vec2.release(t);
      return convex;
    };
    Geometry.polygonMeanPoint = function(poly) {
      var len, mxy, point, _i, _len;
      mxy = Vec2.from(0.0, 0.0);
      len = poly.length;
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        mxy[0] += point[0];
        mxy[1] += point[1];
      }
      mxy[0] /= len;
      mxy[1] /= len;
      return mxy;
    };
    Geometry.polygonArea = function(poly) {
      /*
          This will come in handy as it signifies the ordering
          of vertices
      */

      var area, i, len, p1, p2, _i;
      len = poly.length;
      area = 0.0;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        p1 = poly[i];
        p2 = poly[(i + 1) % len];
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return area * 0.5;
    };
    /* @THIS_TRANSFORMATION_HAS_SIDE_EFFECTS because it is so fucking expensive*/

    Geometry.transformPolygon = function(poly, matrix) {
      var i, len;
      len = poly.length;
      i = 0;
      while (i < len) {
        Vec2.release(poly[i]);
        poly[i] = this.transformPoint(poly[i][0], poly[i][1], matrix);
        ++i;
      }
      return poly;
    };
    Geometry.transformPoint = function(x, y, matrix) {
      var p1, p2;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      Vec2.set(p1, x, y);
      Vec2.transformMat3(p2, p1, matrix);
      Vec2.release(p1);
      return p2;
    };
    Geometry.transformRectangle = function(rect, matrix) {
      var bottom, i, left, pts, right, top;
      pts = [this.transformPoint(rect[0], rect[1], matrix), this.transformPoint(rect[0], rect[1] + rect[3], matrix), this.transformPoint(rect[0] + rect[2], rect[1], matrix), this.transformPoint(rect[0] + rect[2], rect[1] + rect[3], matrix)];
      left = pts[0][0];
      right = pts[0][0];
      top = pts[0][1];
      bottom = pts[0][1];
      i = 1;
      while (i < 4) {
        if (pts[i][0] < left) {
          left = pts[i][0];
        } else if (pts[i][0] > right) {
          right = pts[i][0];
        }
        if (pts[i][1] < top) {
          top = pts[i][1];
        } else if (pts[i][1] > bottom) {
          bottom = pts[i][1];
        }
        ++i;
      }
      Vec2.release(pts[0]);
      Vec2.release(pts[1]);
      Vec2.release(pts[2]);
      Vec2.release(pts[3]);
      pts[0] = left;
      pts[1] = top;
      pts[2] = right - left;
      pts[3] = bottom - top;
      return pts;
    };
    Geometry.polygonCentroidPoint = function(poly) {
      var area, cxy, fact, i, len, p1, p2, _i;
      cxy = Vec2.from(0, 0);
      len = poly.length;
      area = this.polygonArea(poly) * 6;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        p1 = poly[i];
        p2 = poly[(i + 1) % len];
        fact = p1[0] * p2[1] - p2[0] * p1[1];
        cxy[0] += (p1[0] + p2[0]) * fact;
        cxy[1] += (p1[1] + p2[1]) * fact;
      }
      cxy[0] = cxy[0] / area;
      cxy[1] = cxy[1] / area;
      return cxy;
    };
    Geometry.polygonIntersectsOrContainsPolygon = function(polyA, polyB, inverseB, transformA) {
      var p1, p2, ret;
      p1 = Vec2.acquire();
      p2 = Vec2.acquire();
      p1[0] = 0;
      p1[1] = 0;
      ret = false;
      Vec2.transformMat3(p2, p1, transformA);
      Vec2.transformMat3(p1, p2, inverseB);
      ret = this.isPointInPolygonDeprecated(p1, polyA);
      Vec2.release(p1);
      Vec2.release(p2);
      return ret || this.polygonIntersectsPolygon(polyA, polyB, inverseB, transformA);
    };
    /*
        Note however, that this doesn't tell you if one polygon contains other
    */

    Geometry.polygonIntersectsPolygon = function(polyA, polyB, inverseB, transformA) {
      var bott, i, invbott, lenA, lenB, p, p1, pA1, pA2, pB1, pB2, r, ret, rtop, s, stop, _i, _j;
      lenA = polyA.length;
      lenB = polyB.length;
      pA1 = Vec2.acquire();
      pA2 = Vec2.acquire();
      pB1 = Vec2.acquire();
      pB2 = Vec2.acquire();
      ret = false;
      for (i = _i = 0; 0 <= lenA ? _i < lenA : _i > lenA; i = 0 <= lenA ? ++_i : --_i) {
        if (ret) {
          break;
        }
        Vec2.transformMat3(pA1, polyA[i], transformA);
        Vec2.transformMat3(pA2, pA1, inverseB);
        Vec2.transformMat3(pB1, polyA[(i + 1) % lenA], transformA);
        Vec2.transformMat3(pB2, pB1, inverseB);
        for (i = _j = 0; 0 <= lenB ? _j < lenB : _j > lenB; i = 0 <= lenB ? ++_j : --_j) {
          p1 = polyB[(i + 1) % lenB];
          p = polyB[i];
          rtop = (pA2[1] - p[1]) * (p1[0] - p[0]) - (pA2[0] - p[0]) * (p1[1] - p[1]);
          stop = (pA2[1] - p[1]) * (pB2[0] - pA2[0]) - (pA2[0] - p[0]) * (pB2[1] - pA2[1]);
          bott = (pB2[0] - pA2[0]) * (p1[1] - p[1]) - (pB2[1] - pA2[1]) * (p1[0] - p[0]);
          if (bott === 0.0) {
            continue;
          }
          invbott = 1.0 / bott;
          r = rtop * invbott;
          s = stop * invbott;
          if ((ret = (r >= 0.0) && (r <= 1.0) && (s >= 0.0) && (s <= 1.0))) {
            break;
          }
        }
      }
      Vec2.release(pA1);
      Vec2.release(pA2);
      Vec2.release(pB1);
      Vec2.release(pB2);
      return ret;
    };
    Geometry.polygonMinkowskiSum = function(arrA, arrB, sign) {
      var a, b, out, _i, _j, _len, _len1;
      if (sign == null) {
        sign = 1;
      }
      out = [];
      for (_i = 0, _len = arrA.length; _i < _len; _i++) {
        a = arrA[_i];
        for (_j = 0, _len1 = arrB.length; _j < _len1; _j++) {
          b = arrB[_j];
          out.push(Vec2.from(a[0] + sign * b[0], a[1] + sign * b[1]));
        }
      }
      return out;
    };
    Geometry.polygonBottomMostPoint = function(poly) {
      var point, xymax, _i, _len;
      xymax = Vec2.from(Number.MAX_VALUE, Number.MAX_VALUE);
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        if (point[0] < xymax[0]) {
          xymax[0] = point[0];
        }
        if (point[1] < xymax[1]) {
          xymax[1] = point[1];
        }
      }
      return xymax;
    };
    Geometry.polygonTopMostPoint = function(poly) {
      var point, xymax, _i, _len;
      xymax = Vec2.from(Number.MIN_VALUE, Number.MIN_VALUE);
      for (_i = 0, _len = poly.length; _i < _len; _i++) {
        point = poly[_i];
        if (point[0] > xymax[0]) {
          xymax[0] = point[0];
        }
        if (point[1] > xymax[1]) {
          xymax[1] = point[1];
        }
      }
      return xymax;
    };
    Geometry.projectPointOnLine = function(pt, a, b) {
      var dotProd, lenAC, vecAB, vecAC, vecCProj;
      vecAB = Vec2.sub([], b, a);
      vecAC = Vec2.sub([], pt, a);
      Vec2.normalize(vecAB, vecAB);
      Vec2.normalize(vecAC, vecAC);
      dotProd = Vec2.dot(vecAC, vecAB);
      lenAC = Vec2.distance(a, pt);
      vecCProj = Vec2.scale([], vecAB, dotProd * lenAC);
      vecCProj = Vec2.from(a[0] + vecCProj[0], a[1] + vecCProj[1]);
      return vecCProj;
    };
    Geometry.perpendicularDistanceToLine = function(pt, a, b) {
      var c, dist;
      c = this.projectPointOnLine(pt, a, b);
      dist = Vec2.distance(pt, c);
      Vec2.release(c);
      return dist;
    };
    Geometry.perpendicularDistanceToLineSegment = function(pt, a, b) {
      var c, dist, linelen;
      c = this.projectPointOnLine(pt, a, b);
      linelen = Vec2.distance(a, b);
      if (Vec2.distance(a, c) > linelen || Vec2.distance(b, c) > linelen) {
        return Number.NaN;
      }
      dist = Vec2.distance(pt, c);
      Vec2.release(c);
      return dist;
    };
    Geometry.pointComparison = function(a, b, center) {
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
    return Geometry;
  });

}).call(this);
