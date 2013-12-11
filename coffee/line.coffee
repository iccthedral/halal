"use strict"

define ["vec2", "matrix3", "shape", "geometry", "mathutil"], 

(Vec2, Matrix3, Shape, Geometry, MathUtil) ->

    class Line extends Shape
        constructor: (x1, y1) ->
            super()           
            @setShape([
                Vec2.from(0, 0),
                Vec2.from(x1, y1)
            ])
            return @

    Line::setShape = (points) ->
        if points.length > 2
            lloge "This is a line, not a polygon"
            @destroyShape()
            return
        super(points)
        @setOrigin(Number.MIN_VALUE, Number.MIN_VALUE)
        return @

    Line::angleBetween = (l1) ->
        p = Vec2.transformMat3(null, l1._mesh[1], @_transform)
        return Geometry.angleBetweenLines(p, @_mesh[1])
        
    return Line