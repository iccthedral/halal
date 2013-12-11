"use strict"

define ["vec2", "halalentity", "renderer", "matrix3"],

(Vec2, HalalEntity, Renderer, Matrix3) ->

    class Camera extends HalalEntity
        constructor: (@ctx, cam_bounds, @scene) ->
            super()
            @x                  = cam_bounds[0]
            @y                  = cam_bounds[1]
            @w                  = @scene.bounds[2]
            @h                  = @scene.bounds[3]
            @dragging           = false
            @start_drag_point   = [0,0]
            @prev_pos           = [@x, @y]

            @zoom               = 1
            @zoom_step          = 0.1
            @camera_speed       = 1.8
            @angle              = 0
            @view_frustum       = []

            @recalcCamera()
            @setViewFrustum(cam_bounds)

            # camera_canvas = Hal.dom.createCanvasLayer(@w, @h, 50000)
            # Hal.dom.addCanvas(camera_canvas, 0, 0, true)
            # @cctx = camera_canvas.getContext("2d")
            
            @on "CHANGE", (prop) ->
                return if not prop?
                if prop[0] in ["w2", "w", "h2", "h"]
                    # @clipViewport()
            
                ###
                    @todo izmeniti da ovo radi samo pri zumu
                ###

            @scene.on ["ENTER_FULLSCREEN", "EXIT_FULLSCREEN"], (scale) =>
                @zoom = scale[0]
                @recalcCamera()
                @trigger "CHANGE"

        recalcCamera: () ->
            @w *= @zoom
            @h *= @zoom
            @w2 = @w * 0.5
            @h2 = @h * 0.5
            @cx = @w2
            @cy = @h2

        resize: (newW, newH) ->
            @w = newW / @zoom
            @h = newH / @zoom
            @recalcCamera()
            @trigger "CHANGE"

        # clipViewport: () ->
        #     @cctx.fillStyle = "rgba(0, 0, 0, 255);"
        #     @cctx.fillRect(0, 0, @w, @h)
        #     @cctx.translate(@cx, @cy)
        #     @cctx.clearRect(-@w2, -@h2, @w, @h)
        #     @cctx.translate(-@cx, -@cy)

        enableDrag: () ->
            @drag_started = 
            Hal.on "DRAG_STARTED", (pos) =>
                return if @scene.paused
                if @lerp_anim
                    Hal.remove "EXIT_FRAME", @lerp_anim
                    @lerp_anim = null
                @dragging = true
                @start_drag_point = pos.slice()
                @prev_pos = [@x * @zoom, @y * @zoom]

            @drag_ended = 
            Hal.on "DRAG_ENDED", (pos) =>
                @dragging = false

            @drag = 
            Hal.on "MOUSE_MOVE", (pos) =>
                return if @scene.paused
                if @dragging
                    @x = (@prev_pos[0] + (pos[0] - @start_drag_point[0])) / @zoom 
                    @y = (@prev_pos[1] + (pos[1] - @start_drag_point[1])) / @zoom
                    @viewport = Hal.math.transformRect([@x, @y, @w, @h], Matrix3.mul(Matrix3.scale(@zoom, @zoom), Matrix3.translate(-@x, -@y)))
                    @trigger "CHANGE", @pos

        enableZoom: () ->
            @zoom_trig = 
            Hal.on "SCROLL", (ev) =>
                return if @scene.paused
                if ev.down
                    @zoom -= @zoom_step
                else
                    @zoom += @zoom_step

                @trigger "CHANGE", @pos
                @trigger "ZOOM", @zoom
                # @recalcCamera()

        setViewFrustum: (bnds) ->
            @view_frustum[0] = bnds[0]
            @view_frustum[1] = bnds[1]
            @view_frustum[2] = bnds[2] - bnds[0]
            @view_frustum[3] = bnds[3] - bnds[1]
            llogd "Camera view frustum setted"
            llogd @view_frustum

        enableArrowKeys: () ->
            @arrkeys = 
            Hal.on "KEY_DOWN", (ev) =>
                if ev.keyCode == Hal.Keys.LEFT
                    @lerpTo([@cx - @camera_speed, @cy])
                if ev.keyCode == Hal.Keys.RIGHT
                    @lerpTo([@cx + @camera_speed, @cy])
                if ev.keyCode == Hal.Keys.UP
                    @lerpTo([@cx, @cy - @camera_speed])
                if ev.keyCode == Hal.Keys.DOWN
                    @lerpTo([@cx, @cy + @camera_speed])

        disableArrowKeys: () ->
            Hal.removeTrigger "KEY_DOWN", @arrkeys

        enableLerp: () ->
            @lerpTo = (pos) ->
                return if @scene.paused

                lx =  (@cx - pos[0]) + @x
                ly =  (@cy - pos[1]) + @y

                #lx = -Math.clamp()

                if @lerp_anim
                    Hal.remove "EXIT_FRAME", @lerp_anim
                    @lerp_anim = null

                @lerp_anim = 
                Hal.on "EXIT_FRAME", (delta) =>
                    out = Vec2.lerp([], [@x, @y], [lx, ly], delta * @camera_speed)
                    @x = out[0]
                    @y = out[1]
                    if (~~Math.abs(@x - lx) + ~~Math.abs(-@y + ly)) < 2
                        Hal.remove "EXIT_FRAME", @lerp_anim
                        @lerp_anim = null
                    @trigger "CHANGE"

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