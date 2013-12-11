"use strict"

###
 Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
###
define ["vec2", "geometry", "bbresolvers"],

(Vec2, Geometry, BBResolvers) ->

    class Collidable
        constructor: () ->
            @in_collision = false
            @_bbox = new Array()

            @on "SHAPE_CHANGED", () ->
                @_bbox = BBResolvers.AABBFromPolygon(@_mesh)

            @on "COLLISION_STARTED", (en) ->
                @stroke_color = "yellow"
                @in_collision = true

            @on "COLLISION_ENDED", (en) ->
                @stroke_color = "white"
                @in_collision = false

        intersectsWithBBox: (other) ->
            return Geometry.rectangleIntersectsRectangle(
                Geometry.transformRectangle(other._bbox, @transform()),
                Geometry.transformRectangle(@_bbox, other.transform()))

    return Collidable