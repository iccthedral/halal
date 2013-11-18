"use strict"

define ["HalalEntity", "Renderer", "Camera", "Matrix3", "QuadTree", "Vec2"],

(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2) ->

    class Scene extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @name               = if meta.name then meta.name else Hal.ID()
            @bounds             = if meta.bounds then meta.bounds else Hal.viewportBounds()
            @ox                 = @bounds[2] * 0.5
            @oy                 = @bounds[3] * 0.5
            @paused             = true
            @bg_color           = if meta.bg_color then meta.bg_color else "white"
            @entities           = []
            @identity_matrix    = Matrix3.create()
            @update_clip        = false
            @mpos               = [0, 0]
            @viewport_pos       = [0, 0]
            @world_pos          = [0, 0]
            @quadspace          = null
            @ent_cache          = {}
            @draw_camera_center = true
            @draw_stat          = true
            @draw_quadspace     = true
            @local_matrix       = Matrix3.create()
        
            @resetQuadSpace(@bounds)
            
        resetQuadSpace: (dim) ->
            @quadspace = null
            @quadspace = new QuadTree(dim)
            @quadspace.divide()

        addCamera: () ->
            @camera = new Camera(Hal.glass.ctx, 0, 0, @bounds[2], @bounds[3], @)
            @camera.enableDrag()
            @camera.enableLerp()
            @camera.enableZoom()

        addEntity: (ent) ->
            @entities.push(ent)
            @ent_cache[ent.id] = ent
            @quadspace.insert(ent)

            ent.attr("parent", @)
            ent.attr("needs_updating", true)
            ent.trigger "ENTITY_ADDED"

        rotationMatrix: () ->
            return [
                Math.cos(@camera.angle), -Math.sin(@camera.angle), 0,
                Math.sin(@camera.angle), Math.cos(@camera.angle), 0,
                0, 0, 1
            ]

        localMatrix: () ->
            return [
                @camera.zoom, 0, @camera.x,
                0, @camera.zoom, @camera.y,
                0, 0, 1
            ]

        worldToLocal: (pos) ->
            return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], @local_matrix)))

        localToWorld: (pos) ->
            inv = Matrix3.transpose(Matrix3.create(), @local_matrix)
            return Vec2.transformMat3([], pos, inv)

        destroy: () -> return
            #Hal.remove "ENTER_FRAME", @draw_loop

        drawStat: () ->
            Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
            Hal.glass.ctx.font = "10pt monospace"
            Hal.glass.ctx.fillStyle = "black"

            Hal.glass.ctx.fillText("Num of entities: #{@entities.length}", 0, 25)
            Hal.glass.ctx.fillText("Zoom: #{@camera.zoom}", 0, 40)
            Hal.glass.ctx.fillText("Mouse: #{@mpos[0]}, #{@mpos[1]}", 0, 55)
            Hal.glass.ctx.fillText("Camera pos: #{@camera.x}, #{@camera.y}", 0, 70)
            Hal.glass.ctx.fillText("World pos: #{@world_pos[0]}, #{@world_pos[1]}", 0, 85)
            Hal.glass.ctx.fillText("Center relative pos: #{@mpos[0] - @ox}, #{@mpos[1] - @oy}", 0, 100)

        removeEntity: (ent) ->
            if not @ent_cache[ent.id]
                log.error "no such entity #{ent.id}"
                return
            ind = @entities.indexOf(ent)
            if ind is -1
                log.error "no such entity #{ent.id}"
                return
            @entities.splice(ind, 1)

        removeEntityByID: (entid) -> return

        update: () -> return

        draw: () ->
            Hal.glass.ctx.fillStyle = @bg_color
            Hal.glass.ctx.fillRect(0, 0, @bounds[2], @bounds[3])
            return

        drawQuadSpace: (quadspace) ->
            if quadspace.nw?
                @drawQuadSpace(quadspace.nw)
                Hal.glass.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3])
            if quadspace.ne?
                @drawQuadSpace(quadspace.ne)
                Hal.glass.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3])
            if quadspace.sw?
                @drawQuadSpace(quadspace.sw)
                Hal.glass.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3])
            if quadspace.se?
                @drawQuadSpace(quadspace.se)
                Hal.glass.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3])

        calcLocalMatrix: () ->
            @local_matrix = Matrix3.mul(@localMatrix(), @rotationMatrix())

        init: () ->
            @paused = false
            @addCamera()
            @calcLocalMatrix()

            @on "CHANGE", (prop) ->
                if prop and prop[0] is "draw_quadspace"
                    return

            @camera.on "CHANGE", () =>
                @calcLocalMatrix()
                @update_clip = true

            Hal.on "EXIT_FRAME", () =>
                Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
                if @draw_camera_center
                    Hal.glass.ctx.translate(@camera.cx, @camera.cy)
                    Hal.glass.strokeRect([-3, -3, 6, 6], "white")
                    Hal.glass.strokeRect([-@camera.w2, -@camera.h2, @camera.w, @camera.h], "yellow")
                    Hal.glass.ctx.translate(-@camera.cx, -@camera.cy)

                if @draw_stat
                    @drawStat()

                if @draw_quadspace
                    Hal.glass.ctx.translate(@camera.x, @camera.y)
                    Hal.glass.ctx.scale(@camera.zoom, @camera.zoom)
                    @drawQuadSpace(@quadspace)

            Hal.on ["LEFT_CLICK", "LEFT_DBL_CLICK"], () =>
                ents = @quadspace.searchInRange(@world_pos, @search_range, @)
                log.debug "Nasao entiteta: #{ents.length}"
                for p in ents
                    if Hal.math.isPointInRect(p.worldToLocal(@localToWorld(@world_pos)), p.bbox)
                        p.trigger "LEFT_CLICK"

            @on "ENTITY_MOVING", (ent) ->
                if not Hal.math.isPointInRect(ent.viewportPos(), ent.quadspace.bounds)
                    log.debug "i'm out of my quadspace #{ent.id}"
                    ent.quadspace.remove(ent)
                    @quadspace.insert(ent)
                @camera.trigger "CHANGE"
                @calcLocalMatrix()

    return Scene