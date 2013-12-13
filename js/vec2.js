(function() {
  "use strict";
  define(["mathutil"], function(MathUtil) {
    var FreeList, Vec2, i, v;
    Vec2 = {};
    FreeList = [];
    Vec2.free = 10000;
    Vec2.max = 10000;
    i = 0;
    while (i < Vec2.max) {
      v = new MathUtil.ARRAY_TYPE(2);
      v[0] = 0;
      v[1] = 0;
      FreeList.push(v);
      i++;
    }
    Vec2.release = function(vec) {
      if (Vec2.free > Vec2.max) {
        lloge("you released a vector which you didn't acquired");
        return;
      }
      Vec2.free++;
      Vec2.set(vec, 0, 0);
      return FreeList.push(vec);
    };
    Vec2.acquire = function() {
      if (Vec2.free <= 0) {
        lloge("no more vectors in pool");
        return;
      }
      Vec2.free--;
      return FreeList.pop();
    };
    Vec2.create = function() {
      return Vec2.acquire();
    };
    Vec2.newFrom = function(a) {
      v = Vec2.acquire();
      v[0] = a[0];
      v[1] = a[1];
      return v;
    };
    Vec2.clone = function(a) {
      v = Vec2.acquire();
      v[0] = a[0];
      v[1] = a[1];
      return v;
    };
    Vec2.copy = function(out, a) {
      out[0] = a[0];
      out[1] = a[1];
      return out;
    };
    Vec2.from = function(x, y) {
      v = Vec2.acquire();
      v[0] = x;
      v[1] = y;
      return v;
    };
    Vec2.set = function(out, x, y) {
      out[0] = x;
      out[1] = y;
      return out;
    };
    Vec2.add = function(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      return out;
    };
    Vec2.sub = function(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      return out;
    };
    Vec2.mul = function(out, a, b) {
      out[0] = a[0] * b[0];
      out[1] = a[1] * b[1];
      return out;
    };
    Vec2.divide = function(out, a, b) {
      out[0] = a[0] / b[0];
      out[1] = a[1] / b[1];
      return out;
    };
    Vec2.min = function(out, a, b) {
      out[0] = Math.min(a[0], b[0]);
      out[1] = Math.min(a[1], b[1]);
      return out;
    };
    Vec2.max = function(out, a, b) {
      out[0] = Math.max(a[0], b[0]);
      out[1] = Math.max(a[1], b[1]);
      return out;
    };
    Vec2.scale = function(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      return out;
    };
    Vec2.scaleAndAdd = function(out, a, b, scale) {
      out[0] = a[0] + (b[0] * scale);
      out[1] = a[1] + (b[1] * scale);
      return out;
    };
    Vec2.addAndScale = function(out, a, b, scale) {
      out[0] = (a[0] + b[0]) * scale;
      out[1] = (a[1] + b[1]) * scale;
      return out;
    };
    Vec2.distance = function(a, b) {
      var x, y;
      x = b[0] - a[0];
      y = b[1] - a[1];
      return Math.sqrt(x * x + y * y);
    };
    Vec2.sqDistance = function(a, b) {
      var x, y;
      x = b[0] - a[0];
      y = b[1] - a[1];
      return x * x + y * y;
    };
    Vec2.length = function(a) {
      var x, y;
      x = a[0], y = a[1];
      return Math.sqrt(x * x + y * y);
    };
    Vec2.sqLength = function(a) {
      var x, y;
      x = a[0], y = a[1];
      return x * x + y * y;
    };
    Vec2.negate = function(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      return out;
    };
    Vec2.normalize = function(out, a) {
      var len, x, y;
      x = a[0], y = a[1];
      len = x * x + y * y;
      if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
      }
      return out;
    };
    Vec2.dot = function(a, b) {
      return a[0] * b[0] + a[1] * b[1];
    };
    Vec2.lerp = function(out, a, b, t) {
      var ax, ay;
      ax = a[0], ay = a[1];
      out[0] = ax + t * (b[0] - ax);
      out[1] = ay + t * (b[1] - ay);
      return out;
    };
    Vec2.random = function(out, scale) {
      var r;
      if (scale == null) {
        scale = 1;
      }
      r = Math.random() * 2.0 * Math.PI;
      out[0] = Math.cos(r) * scale;
      out[1] = Math.sin(r) * scale;
      return out;
    };
    Vec2.transformMat3 = function(out, a, m) {
      out[0] = m[0] * a[0] + m[1] * a[1] + m[2];
      out[1] = m[3] * a[0] + m[4] * a[1] + m[5];
      return out;
    };
    Vec2.perpendicular = function(out, a) {
      out[0] = a[1];
      out[1] = -a[0];
      return out;
    };
    Vec2.str = function(a) {
      return "vec2(" + (a[0].toFixed(2)) + ", " + (a[1].toFixed(2)) + ")";
    };
    return Vec2;
  });

}).call(this);
