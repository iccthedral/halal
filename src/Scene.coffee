"use strict"

define ["HalalEntity", "Renderer", "Camera", "Matrix3"],

(HalalEntity, Renderer, Camera, Matrix3) ->

    class Scene extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @name   = if meta.name then meta.name else Hal.ID()
            @bounds = if meta.bounds then  meta.bounds else Hal.viewportBounds()
            @center = [@bounds[2] * 0.5, @bounds[3] * 0.5]
            @paused = true
            @bg_color = if meta.bg_color then meta.bg_color else "white"
            @entities = []
            @draw_camera_center = true
            @identity_matrix = Matrix3.create()
            @update_clip = false

        addCamera: () ->
            @camera = new Camera(Hal.glass.ctx, 0, 0, @bounds[2], @bounds[3], @)
            @camera.enableDrag()
            @camera.enableLerp()
            @camera.enableZoom()

        addEntity: (ent) ->
            @entities.push(ent)
            ent.attr("parent", @)
            ent.attr("needs_update", true)
            ent.init()

        rotationMatrix: () ->
            return [
                Math.cos(@camera.angle), -Math.sin(@camera.angle), @camera.cx,
                Math.sin(@camera.angle), Math.cos(@camera.angle), @camera.cy,
                0, 0, 1
            ]

        localMatrix: () ->
            @local_matrix = [
                @camera.zoom, 0, @camera.x,
                0, @camera.zoom, @camera.y,
                0, 0, 1
            ]
            return @local_matrix

        destroy: () ->
            Hal.remove "ENTER_FRAME", @draw_loop

        update: () -> return
        draw: () -> return
        init: () ->
            @paused = false
            @addCamera()
            @local_matrix = Matrix3.mul(@localMatrix(), @rotationMatrix())

            @camera.on "CHANGE", () =>
                @local_matrix = Matrix3.mul(@localMatrix(), @rotationMatrix())
                @update_clip = true

            @draw_loop = 
                Hal.on "ENTER_FRAME", (delta) =>
                    Hal.glass.ctx.fillStyle = @bg_color
                    Hal.glass.ctx.fillRect(0, 0, @bounds[2], @bounds[3])
                    @update(delta)
                    @draw(delta)
                    if @draw_camera_center
                        Hal.glass.ctx.translate(@camera.cx, @camera.cy)
                        Hal.glass.strokeRect([-3, -3, 6, 6], "white")
                        Hal.glass.strokeRect([-@camera.w2, -@camera.h2, @camera.w, @camera.h], "yellow")
            return

    return Scene