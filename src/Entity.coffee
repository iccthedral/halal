"use strict"

define ["HalalEntity", "Scene", "Matrix3", "BBoxAlgos"],

(HalalEntity, Scene, Matrix3, BBoxAlgos) ->

    class Entity extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @shape          = if meta.shape then meta.shape else [0, 0, 10, 10]
            @x              = if meta.x then meta.x else 0
            @y              = if meta.y then meta.y else 0
            @angle          = if meta.angle then meta.angle else 0
            @scale          = if meta.scale then meta.scale else 1
            @stroke_color   = if meta.stroke_color then meta.stroke_color else "black"
            @glow           = if meta.glow then meta.glow else false
            @glow_color     = if meta.glow_color then meta.glow_color else "blue"
            @glow_amount    = if meta.glow_amount then meta.glow_amount else 16
            @line_width     = if meta.line_width then meta.line_width else 1.0
            @parent         = null
            @needs_updating = true
            @draw_origin    = false
            @local_matrix   = @localMatrix()
            @children       = []
            @bbox           = BBoxAlgos.rectFromPolyShape(@shape)

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
            if @parent instanceof Scene
                @parent.camera.on "CHANGE", () => 
                    @needs_updating = true

            @on "CHANGE", (attr) =>
                prop = attr[0]
                if prop in ["angle", "scale", "x", "y", "glow", "parent", "line_width"]
                    @needs_updating = true
                if prop is "shape"
                    @bbox = BBoxAlgos.rectFromPolyShape(@shape)

        addEntity: (ent) ->
            @children.push(ent)
            ent.attr("parent", @)
            @trigger "CHILD_ENTITY_ADDED", ent

        drawOrigin: () -> return

        destroy: () ->
            #remove entity from parent
            @parent.removeEntity(@)
            @parent = null

            #remove all listeners
            @removeAll()

        update: (delta) ->
            if @needs_updating
                @local_matrix = Matrix3.mul(@rotationMatrix(), @localMatrix())
                @local_matrix = Matrix3.mul(@local_matrix, @parent.local_matrix)
                @needs_updating = false
                if not @glow
                    Hal.glass.ctx.shadowBlur = 0

        draw: (delta) ->
            Hal.glass.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3],
                @local_matrix[1],
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )

            Hal.glass.ctx.lineWidth = @line_width if @line_width > 1.0
            if @glow
                Hal.glass.ctx.shadowBlur = @glow_amount 
                Hal.glass.ctx.shadowColor = @glow_color
                
            Hal.glass.strokePolygon(@shape, @stroke_color)

            if @glow
                Hal.glass.ctx.shadowBlur = 0
            Hal.glass.ctx.lineWidth = 1.0 if @line_width isnt 1.0

            if @draw_origin
                Hal.glass.drawLine(0, 0, 0, -100, "green")
                Hal.glass.drawLine(-50, 0, 50, 0, "green")

            if @draw_bbox
                Hal.glass.strokeRect(@bbox, "cyan")
                
            Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
    return Entity
