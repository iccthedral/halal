"use strict"

define ["Vec2", "HalalEntity", "Renderer"],

(Vec2, HalalEntity, Renderer) ->

    class Camera extends HalalEntity
        constructor: (@ctx, @x, @y, @w, @h, @scene) ->
            super()
            camera_canvas = Hal.dom.createCanvasLayer(50000)
            Hal.dom.addCanvas(camera_canvas, 0, 0, true)
            @cctx = camera_canvas.getContext("2d")
            @dragging = false
            @start_drag_point = [0,0]
            @prev_pos = [@x, @y]

            @zoom = 1
            @zoom_step = 0.1
            @camera_speed = 3.8
            @angle = 0
            @bounds = [0, 0, @w, @h]
            @cx = @bounds[2] * 0.5
            @cy = @bounds[3] * 0.5
            @w2 = @w * 0.5
            @h2 = @h * 0.5
            @center_point = [@scene.bounds[2] / 2, @scene.bounds[3] / 2]

            @lerp_to = @center_point.slice()

            @view_frustum = [0, 0, @scene.bounds[2], @scene.bounds[3]]

            @on "CHANGE", (prop) ->
                return if not prop?
                if prop[0] in ["w2", "w", "h2", "h"]
                    @clipViewport()

            @scene.on "ENTER_FULLSCREEN", (scale) =>
                @zoom = scale[0]
                log.debug "zoom factor: #{@zoom}" 
                @bounds = [0, 0, @w * @zoom, @h * @zoom]
                @center_point = [@scene.bounds[2] / 2, @scene.bounds[3] / 2]
                log.info @center_point

            @scene.on "EXIT_FULLSCREEN", (scale) =>
                @zoom = scale[0]
                @bounds = [0, 0, @w * @zoom, @h * @zoom]
                @center_point = [@scene.bounds[2] / 2, @scene.bounds[3] / 2]
                @trigger "CHANGE"

        clipViewport: () ->
            @cctx.fillStyle = "rgba(0, 0, 0, 255);"
            @cctx.fillRect(0, 0, @bounds[2], @bounds[3])
            @cctx.translate(@cx, @cy)
            @cctx.clearRect(-@w2, -@h2, @w, @h)
            @cctx.translate(-@cx, -@cy)

        enableDrag: () ->
            @drag_started = 
            Hal.on "DRAG_STARTED", (pos) =>
                return if @scene.paused
                @dragging = true
                @start_drag_point = pos.slice()
                @prev_pos = [@x, @y]

            @drag_ended = 
            Hal.on "DRAG_ENDED", (pos) =>
                @dragging = false

            @drag = 
            Hal.on "MOUSE_MOVE", (pos) =>
                return if @scene.paused
                if @dragging
                    @x = (@prev_pos[0] + (pos[0] - @start_drag_point[0]))
                    @y = (@prev_pos[1] + (pos[1] - @start_drag_point[1]))
                    @trigger "CHANGE", @pos

        isVisible: (ent) ->
            return (
                Hal.m.rectIntersectsRect([ent.pos[0] * @zoom + @x, ent.pos[1] * @zoom + @y, ent.bounds[2], ent.bounds[3]], @bounds)
            )

        enableZoom: () ->
            @zoom_trig = 
            Hal.on "SCROLL", (ev) =>
                return if @scene.paused

                if @scene.paused
                    return
                if ev.down
                    @zoom -= @zoom_step
                else
                    @zoom += @zoom_step

                @trigger "CHANGE", @pos

        setViewFrustum: (bnds) ->
            @view_frustum[0] = -bnds[0]
            @view_frustum[1] = -bnds[1]
            @view_frustum[2] = -bnds[2]
            @view_frustum[3] = -bnds[3]
            log.debug "Camera view frustum setted"
            log.debug @view_frustum

        enableArrowKeys: () ->
            # @arrkeys = 
            # Hal.on "KEY_DOWN", (ev) =>
            #     if ev.keyCode == Hal.Keys.LEFT
            #         @lerpTo([@center_point[0] - @camera_speed, @center_point[1]])
            #     else if ev.keyCode == Hal.Keys.RIGHT
            #         @lerpTo([@center_point[0] + @camera_speed, @center_point[1]])
            #     else if ev.keyCode == Hal.Keys.UP
            #         @lerpTo([@center_point[0], @center_point[1] - @camera_speed])
            #     else if ev.keyCode == Hal.Keys.DOWN
            #         @lerpTo([@center_point[0], @center_point[1] + @camera_speed])

        disableArrowKeys: () ->
            Hal.removeTrigger "KEY_DOWN", @arrkeys

        enableLerp: () ->
            @lerpTo = (pos) -> return
                # return if @scene.paused
                # lx = (@center_point[0] - pos[0] + @x)
                # ly = (@center_point[1] - pos[1] + @y)
                # if lx > @view_frustum[0] * @zoom
                #     lx = @view_frustum[0] * @zoom
                # if (lx - @bounds[2]) < @view_frustum[2] * @zoom
                #     lx = @view_frustum[2] * @zoom + @bounds[2]

                # if ly > @view_frustum[1] * @zoom 
                #     ly = @view_frustum[1] * @zoom
                # if (ly - @bounds[3] < @view_frustum[3] * @zoom)
                #     ly = @view_frustum[3] * @zoom + @bounds[3] 

                # @lerp_to[0] = lx
                # @lerp_to[1] = ly

                # if not @lerp_anim
                #     @lerp_anim = Hal.on "ENTER_FRAME", (delta) =>
                #         log.debug "moving"
                #         if (~~Math.abs(@x - @lerp_to[0]) + ~~Math.abs(-@y + @lerp_to[1])) < 2
                #             Hal.remove "ENTER_FRAME", @lerp_anim
                #             @lerp_anim = null
                #         else
                #             Vec2.lerp(@pos,  [@x, @y], @lerp_to, delta)
                #             @trigger "CHANGE", @pos

        lerpTo: () -> return

        disableLerp: () ->
            @lerpTo = () -> return
            
        disableZoom: () ->
            Hal.removeTrigger "SCROLL", @zoom_trig

        disableDrag: () ->
            Hal.removeTrigger "DRAG_STARTED", @drag_started
            Hal.removeTrigger "DRAG_ENDED", @drag_ended
            Hal.removeTrigger "MOUSE_MOVE", @drag

    return Camera