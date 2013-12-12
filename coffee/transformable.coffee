"use strict"

define ["vec2", "matrix3"], (Vec2, Matrix3) ->

    class Transformable
        constructor: () ->
            @origin              = Vec2.from(0, 0)
            @scale               = Vec2.from(1, 1)
            @position            = Vec2.from(0, 0)
            @angle               = 0.0
            @_transform          = Matrix3.create()
            @_inverse            = Matrix3.create()
            @_update_transform   = true
            @_update_inverse     = true

    Transformable::setOrigin = (x, y, move = true) ->
        if move
            @move(x - @origin[0], y - @origin[1])
        Vec2.set(@origin, x, y)
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::setPosition = (x, y) ->
        Vec2.set(@position, x, y)
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::setScale = (scx, scy) ->
        Vec2.set(@scale, scx, scy)
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::setRotation = (angle) ->
        @angle = angle
        if @angle < 0.0
            @angle += Math.PI*2
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::rotate = (angle) ->
        @angle += angle
        if @angle < 0
            @angle += Math.PI*2
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::move = (x, y) ->
        Vec2.set(@position, @position[0] + x, @position[1] + y)
        @_update_transform = true
        @_update_inverse = true
        return @

    Transformable::transform = () ->
        if @_update_transform
            @_transform[3] = -Math.sin(-@angle) * @scale[0]
            @_transform[0] = Math.cos(-@angle) * @scale[0]
            @_transform[1] = Math.sin(-@angle) * @scale[1]
            @_transform[4] = Math.cos(-@angle) * @scale[1]
            @_transform[2] = -@origin[0] * @_transform[0] - @origin[1] * @_transform[1] + @position[0]
            @_transform[5] = -@origin[0] * @_transform[3] - @origin[1] * @_transform[4] + @position[1]
            @_update_transform = false
        return @_transform
    
    Transformable::calcTransform = () ->
        if @_update_transform
            @_transform[3] = -Math.sin(-@angle) * @scale[0]
            @_transform[0] = Math.cos(-@angle) * @scale[0]
            @_transform[1] = Math.sin(-@angle) * @scale[1]
            @_transform[4] = Math.cos(-@angle) * @scale[1]
            @_transform[2] = -@origin[0] * @_transform[0] - @origin[1] * @_transform[1] + @position[0]
            @_transform[5] = @origin[0] * @_transform[3] - @origin[1] * @_transform[4] + @position[1]
            @_update_transform = false
        return @_transform

    Transformable::combineTransform = (matrix) ->
        return @transform() if not @_update_transform
        @transform()
        @_transform = Matrix3.mul([], @_transform, matrix)
        @_update_transform = false
        return @_transform

    Transformable::inverseTransform = () ->
        if @_update_inverse
            Matrix3.inverse(@_inverse, @_transform)
            @_update_inverse = false
        return @_inverse

    # |a c e| |x|   |x*a + y*c + e*1|
    # |b d f| |y| = |x*c + y*d + f*1|
    # |0 0 1| |1|   |x*0 + y*0 + 1*1|

    # |1 0 0| |x|   |x|
    # |0 1 0| |y| = |y|
    # |0 0 1| |1|   |1|

    # |1 0 0| |x|   |x*sc|
    # |0 1 0| |y| = |y|
    # |0 0 1| |1|   |1|

    # |a11 a12 a13| |b11 b12 b13|   |a11 a12 a13| 
    # |a21 a22 a23| |b21 b22 b23| = |a11 a12 a13|
    # |a31 a32 a33| |b31 b32 b33|   |a11 a12 a13| 

    # Vec2.transformMat3 = (out, a, m) ->
    #     out[0] = m[0] * a[0] + m[1] * a[1] + m[2]
    #     out[1] = m[3] * a[0] + m[4] * a[1] + m[5]
    
    return Transformable
