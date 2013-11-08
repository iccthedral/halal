"use strict"

define ["HalalEntity"],

(HalalEntity) ->

    class Entity extends HalalEntity
        constructor: (meta) ->
            super()
            @shape = if meta.shape then meta.shape else [0, 0, 10, 10]
            @parent = null
            @x = if meta.x then meta.x else 0
            @y = if meta.y then meta.y else 0
            @angle = 0
            @scale = 1
            @needs_updating = false
            @init()
            @local_matrix   = @localMatrix()
            @rot_matrix     = @rotationMatrix()

        mulMatrices: (a, b) ->
            out = []
            a00 = a[0]
            a01 = a[1]
            a02 = a[2]
            a10 = a[3]
            a11 = a[4]
            a12 = a[5]
            a20 = a[6]
            a21 = a[7]
            a22 = a[8]

            b00 = b[0]
            b01 = b[1]
            b02 = b[2]
            b10 = b[3]
            b11 = b[4]
            b12 = b[5]
            b20 = b[6]
            b21 = b[7]
            b22 = b[8]

            out[0] = b00 * a00 + b01 * a10 + b02 * a20
            out[1] = b00 * a01 + b01 * a11 + b02 * a21
            out[2] = b00 * a02 + b01 * a12 + b02 * a22

            out[3] = b10 * a00 + b11 * a10 + b12 * a20
            out[4] = b10 * a01 + b11 * a11 + b12 * a21
            out[5] = b10 * a02 + b11 * a12 + b12 * a22

            out[6] = b20 * a00 + b21 * a10 + b22 * a20
            out[7] = b20 * a01 + b21 * a11 + b22 * a21
            out[8] = b20 * a02 + b21 * a12 + b22 * a22
            return out

        localMatrix: () ->
            return [
                @scale, 0, @x,
                0, @scale, @y,
                0, 0, 1
            ]

        rotationMatrix: () ->
            return [
                Math.cos(@angle), -Math.sin(@angle), 0,
                Math.sin(@angle), Math.cos(@angle), 0,
                0, 0, 1
            ]

        init: () ->
            @on "CHANGE", (attr) =>
                prop = attr[0]
                if prop in ["angle", "scale", "x", "y"]
                    @needs_updating = true

        destroy: () ->
            ###
                remove all listeners
            ###

        update: (delta) ->
            if @needs_updating
                @local_matrix = @mulMatrices(@rotationMatrix(), @localMatrix())
                @needs_updating = false
                
        draw: (delta) ->
            Hal.glass.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3], 
                @local_matrix[1], 
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )
            Hal.glass.strokePolygon(@shape, @stroke_color)
            Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)

    return Entity
