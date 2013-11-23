"use strict"

define ["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2"],

(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2) ->

    class Scene extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @name               = if meta.name? then meta.name else "#{Hal.ID()}"
            @bounds             = if meta.bounds? then meta.bounds else Hal.viewportBounds()
            @paused             = true
            @bg_color           = if meta.bg_color? then meta.bg_color else "white"
            @entities           = []
            @identity_matrix    = Matrix3.create()
            @update_clip        = false
            @mpos               = [0, 0]
            @viewport_pos       = [0, 0]
            @world_pos          = [0, 0]
            @quadspace          = null
            @ent_cache          = {}
            @draw_camera_center = if meta.draw_camera_center? then meta.draw_camera_center else false
            @draw_stat          = if meta.draw_stat? then meta.draw_stat else true
            @draw_quadspace     = if meta.draw_quadspace? then meta.draw_quadspace else false
            @local_matrix       = Matrix3.create()
            @z                  = if meta.z? then meta.z else 1
            @g                  = new Renderer(@bounds, null, @z)
            @cam_bounds         = if meta.cam_bounds? then meta.cam_bounds else @bounds.slice()
            
            log.debug @cam_bounds
            @resetQuadSpace([0, 0, @cam_bounds[2], @cam_bounds[3]])

        resetQuadSpace: (dim) ->
            log.debug "QuadSpace reset"
            @quadspace = null
            @quadspace = new QuadTree(dim)
            @quadspace.divide()

        addCamera: () ->
            @camera = new Camera(@g.ctx, @cam_bounds, @)
            @camera.enableDrag()
            @camera.enableLerp()
            @camera.enableZoom()

        addEntityToQuadspace: (ent) ->
            ent = @addEntity(ent)
            @quadspace.insert(ent)
            return ent

        addEntity: (ent) ->
            @entities.push(ent)
            @ent_cache[ent.id] = ent
            ent.attr("parent", @)
            ent.attr("scene", @)
            ent.attr("needs_updating", true)
            ent.trigger "ENTITY_ADDED"
            return ent

        rotationMatrix: () ->
            return [
                Math.cos(@camera.angle), -Math.sin(@camera.angle), @camera.cx,
                Math.sin(@camera.angle), Math.cos(@camera.angle),  @camera.cy,
                0, 0, 1
            ]

        localMatrix: () ->
            ###
                @camera.zoom * (@camera.x / @camera.zoom - @camera.cx)
                #(@camera.x / @camera.zoom)# affects how camera.x is
                #scaled on zoom, higher the ratio, harder the camera moves
                All of this is done so that the zoom is applied on the center
                of camera
            ###
            return [
                @camera.zoom, 0, @camera.zoom * (@camera.x - @camera.cx),
                0, @camera.zoom, @camera.zoom * (@camera.y - @camera.cy),
                0, 0, 1
            ]

        worldToLocal: (pos) ->
            return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], @local_matrix)))

        localToWorld: (pos) ->
            inv = Matrix3.transpose(Matrix3.create(), @local_matrix)
            return Vec2.transformMat3([], pos, inv)

        destroy: () ->
            @removeAllEntities()
            @camera.remove "CHANGE", @cam_change

            Hal.remove "EXIT_FRAME", @exit_frame
            Hal.remove "ENTER_FRAME", @enter_frame
            Hal.remove "LEFT_CLICK", @click_listeners
            Hal.remove "LEFT_DBL_CLICK", @click_listeners
            Hal.remove "RESIZE", @resize_event
            Hal.trigger "DESTROY_SCENE", @
            @quadspace  = null
            @camera     = null
            @renderer   = null
            @removeAll()

        drawStat: () ->
            return if @paused
            @g.ctx.setTransform(1, 0, 0, 1, 0, 0)
            @g.ctx.font = "10pt monospace"
            @g.ctx.fillStyle = "black"

            @g.ctx.fillText("FPS: #{Hal.fps}", 0, 10)
            @g.ctx.fillText("Num of entities: #{@entities.length}", 0, 25)
            @g.ctx.fillText("Zoom: #{@camera.zoom}", 0, 40)
            @g.ctx.fillText("Mouse: #{@mpos[0]}, #{@mpos[1]}", 0, 55)
            @g.ctx.fillText("Camera pos: #{@camera.x}, #{@camera.y}", 0, 70)
            @g.ctx.fillText("World pos: #{@world_pos[0]}, #{@world_pos[1]}", 0, 85)
            @g.ctx.fillText("Center relative pos: #{@mpos[0] - @camera.cx - @bounds[0]}, #{@mpos[1] - @camera.cy - @bounds[1]}", 0, 100)

        removeEntity: (ent) ->
            if not @ent_cache[ent.id]
                log.error "No such entity #{ent.id} in cache"
                return
            ind = @entities.indexOf(ent)
            if ind is -1
                log.error "No such entity #{ent.id} in entity list"
                return
            delete @ent_cache[ent.id]
            @trigger "ENTITY_DESTROYED", ent
            # @entities[ind] = null
            @entities.splice(ind, 1)

        getAllEntities: () ->
            return @entities.slice()

        removeAllEntities: () ->
            for ent in @getAllEntities()
                #let each children entity destroy itself 
                #rather it to be destroyed by its parent
                ent.destroy(false)
            return

        removeEntityByID: (entid) ->
            ent = @ent_cache[entid]
            if ent?
                ent.removeEntity(ent)
            else
                log.error "No such entity #{entid} in entity cache"

        update: () -> return

        draw: () ->
            return if @paused
            @g.ctx.fillStyle = @bg_color
            @g.ctx.fillRect(0, 0, @bounds[2], @bounds[3])

        drawQuadSpace: (quadspace) ->
            return if @paused
            if quadspace.nw?
                @drawQuadSpace(quadspace.nw)
                @g.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3])
            if quadspace.ne?
                @drawQuadSpace(quadspace.ne)
                @g.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3])
            if quadspace.sw?
                @drawQuadSpace(quadspace.sw)
                @g.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3])
            if quadspace.se?
                @drawQuadSpace(quadspace.se)
                @g.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3])

        calcLocalMatrix: () ->
            @local_matrix = Matrix3.mul(@localMatrix(), @rotationMatrix())

        pause: () ->
            @attr("paused", true)

        resume: () ->
            @attr("paused", false)

        init: () ->
            @paused = false
            @addCamera()
            @calcLocalMatrix()

            @on "CHANGE", (prop) ->
                if prop and prop[0] is "draw_quadspace"
                    return

            @cam_change = 
            @camera.on "CHANGE", () =>
                return if @paused
                @calcLocalMatrix()
                @update_clip = true

            @resize_event = 
            Hal.on "RESIZE", (area) =>
                @g.resize(area.width, area.height)
                @bounds[2] = area.width
                @bounds[3] = area.height
                @camera.resize(area.width, area.height)

            @exit_frame = 
            Hal.on "EXIT_FRAME", () =>
                return if @paused
                if @draw_camera_center
                    @g.ctx.setTransform(1, 0, 0, 1, 0, 0)
                    @g.ctx.translate(@camera.cx, @camera.cy)
                    @g.strokeRect([-3, -3, 6, 6], "white")
                    @g.ctx.lineWidth = 5
                    @g.strokeRect([-@camera.w2, -@camera.h2, @camera.w, @camera.h], "white")
                    @g.ctx.translate(-@camera.cx, -@camera.cy)
                    @g.ctx.lineWidth = 1

                if @draw_stat
                    @drawStat()

            #@enter_frame =
            #Hal.on "ENTER_FRAME", (delta) =>
                #if @draw_quadspace
                    # @g.ctx.translate(@camera.x, @camera.y)
                    # @g.ctx.scale(@camera.zoom, @camera.zoom)
                #@g.strokeRect([0, 0, 100, 100], "green")
                #@drawQuadSpace(@quadspace)

            # @click_listeners =
            # Hal.on ["LEFT_CLICK", "LEFT_DBL_CLICK"], () =>
            #     return if @paused
            #     ents = @quadspace.searchInRange(@world_pos, @search_range, @)
            #     log.debug "Nasao entiteta: #{ents.length}"
            #     for p in ents
            #         if Hal.math.isPointInRect(p.worldToLocal(@localToWorld(@world_pos)), p.bbox)
            #             p.trigger "LEFT_CLICK"

            @on "ENTITY_MOVING", (ent) ->
                if not Hal.math.isPointInRect(ent.viewportPos(), ent.quadspace.bounds)
                    log.debug "i'm out of my quadspace #{ent.id}"
                    ent.quadspace.remove(ent)
                    @quadspace.insert(ent)
                @camera.trigger "CHANGE"
                @calcLocalMatrix()

    return Scene