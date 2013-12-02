(function() {
  "use strict";
  define([], function() {
    var Matrix3;
    Matrix3 = {};
    Matrix3.create = function() {
      var out;
      out = [];
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 1;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.invert = function(out, a) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b01, b11, b21, det;
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a10 = a[3];
      a11 = a[4];
      a12 = a[5];
      a20 = a[6];
      a21 = a[7];
      a22 = a[8];
      b01 = a22 * a11 - a12 * a21;
      b11 = -a22 * a10 + a12 * a20;
      b21 = a21 * a10 - a11 * a20;
      det = a00 * b01 + a01 * b11 + a02 * b21;
      if (det === 0) {
        Hal.log.debug("oh god no");
        return null;
      }
      det = 1.0 / det;
      out[0] = b01 * det;
      out[1] = (-a22 * a01 + a02 * a21) * det;
      out[2] = (a12 * a01 - a02 * a11) * det;
      out[3] = b11 * det;
      out[4] = (a22 * a00 - a02 * a20) * det;
      out[5] = (-a12 * a00 + a02 * a10) * det;
      out[6] = b21 * det;
      out[7] = (-a21 * a00 + a01 * a20) * det;
      out[8] = (a11 * a00 - a01 * a10) * det;
      return out;
    };
    Matrix3.translate = function(x, y) {
      var out;
      out = [];
      out[0] = 1;
      out[1] = 0;
      out[2] = x;
      out[3] = 0;
      out[4] = 1;
      out[5] = y;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.scale = function(scaleX, scaleY) {
      var out;
      if (scaleX == null) {
        scaleX = 1;
      }
      if (scaleY == null) {
        scaleY = 1;
      }
      out = [];
      out[0] = scaleX;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = scaleY;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.rotate = function(angle, orx, ory) {
      var out;
      if (orx == null) {
        orx = 0;
      }
      if (ory == null) {
        ory = 0;
      }
      out = [];
      out[0] = Math.cos(angle);
      out[1] = -Math.sin(angle);
      out[2] = orx;
      out[3] = Math.sin(angle);
      out[4] = Math.cos(angle);
      out[5] = ory;
      out[6] = 0;
      out[7] = 0;
      out[8] = 1;
      return out;
    };
    Matrix3.transpose = function(out, a) {
      var a01, a02, a12;
      if (out === a) {
        a01 = a[1];
        a02 = a[2];
        a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
      } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
      }
      return out;
    };
    Matrix3.mul = function(a, b) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b00, b01, b02, b10, b11, b12, b20, b21, b22, out;
      out = [];
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a10 = a[3];
      a11 = a[4];
      a12 = a[5];
      a20 = a[6];
      a21 = a[7];
      a22 = a[8];
      b00 = b[0];
      b01 = b[1];
      b02 = b[2];
      b10 = b[3];
      b11 = b[4];
      b12 = b[5];
      b20 = b[6];
      b21 = b[7];
      b22 = b[8];
      out[0] = b00 * a00 + b01 * a10 + b02 * a20;
      out[1] = b00 * a01 + b01 * a11 + b02 * a21;
      out[2] = b00 * a02 + b01 * a12 + b02 * a22;
      out[3] = b10 * a00 + b11 * a10 + b12 * a20;
      out[4] = b10 * a01 + b11 * a11 + b12 * a21;
      out[5] = b10 * a02 + b11 * a12 + b12 * a22;
      out[6] = b20 * a00 + b21 * a10 + b22 * a20;
      out[7] = b20 * a01 + b21 * a11 + b22 * a21;
      out[8] = b20 * a02 + b21 * a12 + b22 * a22;
      return out;
    };
    window.Matrix3 = Matrix3;
    return Matrix3;
  });

}).call(this);
