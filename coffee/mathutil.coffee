"use strict"

define () ->

    MathUtil = {
        ARRAY_TYPE: if (typeof Float32Array isnt 'undefined') then Float32Array else Array;
        TAU: (Math.PI * 2)
        EPSILON: 0.000001
        DEGREE: Math.PI / 180
        RADIAN: 180 / Math.PI
    }

    MathUtil.clamp = (val, min, max) ->
        if val < min
            val = min
        else if val > max
            val = max
        return val

    return MathUtil