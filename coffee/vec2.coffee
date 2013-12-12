"use strict"

define ["mathutil"], 

(MathUtil) ->

    Vec2 = {}
    FreeList = []
    Vec2.free = 10000
    Vec2.max = 10000
    i = 0
    while i < Vec2.max
        v = new MathUtil.ARRAY_TYPE(2)
        v[0] = 0
        v[1] = 0
        FreeList.push(v)
        i++

    Vec2.release = (vec) ->
        if Vec2.free > Vec2.max
            lloge "you released a vector which you didn't acquired"
            return
        Vec2.free++
        Vec2.set(vec, 0, 0)
        return FreeList.push(vec) #[Vec2.free] = vec
        # Vec2.free++

    Vec2.acquire = () ->
        if Vec2.free <= 0
            lloge "no more vectors in pool"
            return
        Vec2.free--
        return FreeList.pop() #[Vec2.free]

    Vec2.create = () ->
        return Vec2.acquire()

    Vec2.newFrom = (a) ->
        v = Vec2.acquire()
        v[0] = a[0]
        v[1] = a[1]
        return v

    Vec2.clone = (a) ->
        v = Vec2.acquire()
        v[0] = a[0]
        v[1] = a[1]
        return v

    Vec2.copy = (out, a) ->
        out[0] = a[0]
        out[1] = a[1]
        return out

    Vec2.from = (x, y) ->
        v = Vec2.acquire()
        v[0] = x
        v[1] = y
        return v

    Vec2.set = (out, x, y) ->
        out[0] = x
        out[1] = y
        return out

    Vec2.add = (out, a, b) ->
        out[0] = a[0] + b[0]
        out[1] = a[1] + b[1]
        return out

    Vec2.sub = (out, a, b) ->
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        return out

    Vec2.mul = (out, a, b) ->
        out[0] = a[0] * b[0]
        out[1] = a[1] * b[1]
        return out

    Vec2.divide = (out, a, b) ->
        out[0] = a[0] / b[0]
        out[1] = a[1] / b[1]
        return out

    Vec2.min = (out, a, b) ->
        out[0] = Math.min(a[0], b[0])
        out[1] = Math.min(a[1], b[1])
        return out

    Vec2.max = (out, a, b) ->
        out[0] = Math.max(a[0], b[0])
        out[1] = Math.max(a[1], b[1])
        return out

    Vec2.scale = (out, a, b) ->
        out[0] = a[0] * b
        out[1] = a[1] * b
        return out

    Vec2.scaleAndAdd = (out, a, b, scale) ->
        out[0] = a[0] + (b[0] * scale)
        out[1] = a[1] + (b[1] * scale)
        return out

    Vec2.addAndScale = (out, a, b, scale) ->
        out[0] = (a[0] + b[0]) * scale
        out[1] = (a[1] + b[1]) * scale
        return out

    Vec2.distance = (a, b) ->
        x = b[0] - a[0]
        y = b[1] - a[1]
        return Math.sqrt(x*x + y*y)

    Vec2.sqDistance = (a, b) ->
        x = b[0] - a[0]
        y = b[1] - a[1]
        return (x*x + y*y)

    Vec2.length = (a) ->
        [x, y] = a
        return Math.sqrt(x*x + y*y)

    Vec2.sqLength = (a) ->
        [x, y] = a
        return (x*x + y*y)

    Vec2.negate = (out, a) ->
        out[0] = -a[0]
        out[1] = -a[1]
        return out

    Vec2.normalize = (out, a) ->
        [x, y] = a
        len = x*x + y*y
        if len > 0
            len = 1/Math.sqrt(len)
            out[0] = a[0] * len
            out[1] = a[1] * len
        return out

    Vec2.dot = (a, b) ->
        return a[0] * b[0] + a[1] * b[1]

    Vec2.lerp = (out, a, b, t) ->
        [ax, ay] = a
        out[0] = ax + t * (b[0] - ax)
        out[1] = ay + t * (b[1] - ay)
        return out

    Vec2.random = (out, scale) ->
        scale ?= 1
        r = Math.random() * 2.0 * Math.PI
        out[0] = Math.cos(r) * scale
        out[1] = Math.sin(r) * scale
        return out

    # Vec2.transformMat3 = (out, a, m) ->
    #     [x, y] = a
    #     out[0] = m[0] * x + m[3] * y + m[6]
    #     out[1] = m[1] * x + m[4] * y + m[7]
    #     return out
        
    Vec2.transformMat3 = (out, a, m) ->
        out[0] = m[0] * a[0] + m[1] * a[1] + m[2]
        out[1] = m[3] * a[0] + m[4] * a[1] + m[5]
        return out

    # Vec2.transformMat2d = (out, a, m) ->
    #     [x, y] = a
    #     out[0] = m[0] * x + m[2] * y + m[4]
    #     out[1] = m[1] * x + m[3] * y + m[5]
    #     return out

    Vec2.perpendicular = (out, a) ->
        out[0] = a[1]
        out[1] = -a[0]
        return out
        
    # Vec2.transformMat2 = (out, a, m) ->
    #     [x, y] = a
    #     out[0] = m[0] * x + m[2] * y
    #     out[1] = m[1] * x + m[3] * y
    #     return out
         
    Vec2.str = (a) ->
        return "vec2(#{a[0]}, #{a[1]})"

    return Vec2

