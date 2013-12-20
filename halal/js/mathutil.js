(function() {
  "use strict";
  define(function() {
    var MathUtil;
    MathUtil = {
      ARRAY_TYPE: typeof Float32Array !== 'undefined' ? Float32Array : Array,
      TAU: Math.PI * 2,
      EPSILON: 0.000001,
      DEGREE: Math.PI / 180,
      RADIAN: 180 / Math.PI
    };
    MathUtil.clamp = function(val, min, max) {
      if (val < min) {
        val = min;
      } else if (val > max) {
        val = max;
      }
      return val;
    };
    return MathUtil;
  });

}).call(this);
