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
            @mpos               = [0, 0]
            @viewport_pos       = [0, 0]
            @world_pos          = [0, 0]
            @quadspace          = null
            @ent_cache          = {}
            @ent_groups         = {}
            @draw_camera_center = meta.draw_camera_center?
            @draw_stat          = not meta.draw_stat?
            @draw_quadspace     = if meta.draw_quadspace? then meta.draw_quadspace else false
            @local_matrix       = Matrix3.create()
            @z                  = if meta.z? then meta.z else 1
            @g                  = new Renderer(@bounds, null, @z)
            @cam_bounds         = if meta.cam_bounds? then meta.cam_bounds else @bounds.slice()
            @draw_bbox          = meta.draw_bbox?
            @draw               = if meta.draw? then meta.draw else () -> return
            @update             = if meta.update? then meta.update else () -> return
            @needs_updating     = true
            @center             = [@bounds[2] * 0.5, @bounds[3] * 0.5]
            @search_range       = @bounds[2]
            @visible_ents       = []
            @world_center_pos   = @worldToLocal(@center)
            @total_rendered     = 0

            @left_click_listener        = null
            @left_dbl_click_listener    = null
            @resetQuadSpace([0, 0, @cam_bounds[2], @cam_bounds[3]])

            @on "GROUP_CHANGE", (ent) ->
                group = @ent_groups[ent.group]
                if not group?
                    group = @ent_groups[ent.group] = []
                ind = group.indexOf(ent)
                if ind isnt -1
                    group.splice(ind, 1)
                else
                    group.push(ent)

        resetQuadSpace: (dim) ->
            Hal.log.debug "QuadSpace reset"
            @quadspace = null
            @quadspace = new QuadTree(dim)
            @quadspace.divide()
            @addCamera()

        addCamera: () ->
            @camera = new Camera(@g.ctx, @cam_bounds, @)
            @camera.enableDrag()
            @camera.enableLerp()
            @camera.enableZoom()

        addEntityToQuadspace: (ent) ->
            ent = @addEntity(ent)
            if not @quadspace.insert(ent)
                Hal.log.warn "Couldn't add entity #{ent.id} to quadspace"
            return ent

        addEntity: (ent) ->
            @entities.push(ent)
            @ent_cache[ent.id] = ent
            ent.attr("parent", @)
            ent.attr("scene", @)
            ent.attr("needs_updating", true)
            ent.trigger "ENTITY_ADDED"
            @trigger "GROUP_CHANGE", ent
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
            Hal.remove "LEFT_CLICK", @left_click_listener
            Hal.remove "LEFT_DBL_CLICK", @left_dbl_click_listener
            Hal.remove "RESIZE", @resize_event
            Hal.trigger "DESTROY_SCENE", @
            @quadspace  = null
            @camera     = null
            @renderer   = null
            @removeAll()

        drawStat: () ->
            return if @paused
            Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
            Hal.glass.ctx.clearRect(0, 0, 400, 300)
            Hal.glass.ctx.font = "10pt monospace"
            Hal.glass.ctx.fillStyle = "black"

            Hal.glass.ctx.fillText("FPS: #{Hal.fps}", 0, 10)
            Hal.glass.ctx.fillText("Num of entities: #{@entities.length}", 0, 25)
            Hal.glass.ctx.fillText("Zoom: #{@camera.zoom}", 0, 40)
            Hal.glass.ctx.fillText("Mouse: #{@mpos[0]}, #{@mpos[1]}", 0, 55)
            Hal.glass.ctx.fillText("Camera pos: #{@camera.x.toFixed(2)}, #{@camera.y.toFixed(2)}", 0, 70)
            Hal.glass.ctx.fillText("World pos: #{@world_pos[0].toFixed(2)}, #{@world_pos[1].toFixed(2)}", 0, 85)
            Hal.glass.ctx.fillText("Center relative pos: #{@mpos[0] - @camera.cx - @bounds[0]}, #{@mpos[1] - @camera.cy - @bounds[1]}", 0, 100)
            Hal.glass.ctx.fillText("Rendered total: #{@total_rendered}", 0, 175)

        removeEntity: (ent) ->
            if not @ent_cache[ent.id]
                log.error "No such entity #{ent.id} in cache"
                return

            ind = @entities.indexOf(ent)
            if ind is -1
                log.error "No such entity #{ent.id} in entity list"
                return

            group = @ent_groups[ent.group]
            if group?
                ind = group.indexOf(ent)
                group.splice(ind, 1)

            delete @ent_cache[ent.id]
            @trigger "ENTITY_DESTROYED", ent
            @entities.splice(ind, 1)

        getAllEntities: () ->
            return @entities.slice()

        removeAllEntities: (destroy_children = false) ->
            for ent in @getAllEntities()
                #let each children entity destroy itself 
                #rather it to be destroyed by its parent
                ent.destroy(destroy_children)
            return

        removeEntityByID: (entid) ->
            ent = @ent_cache[entid]
            if ent?
                ent.removeEntity(ent)
            else
                log.error "No such entity #{entid} in entity cache"

        update_: (@delta) ->
            @total_rendered = 0

            if @needs_updating
                @applyIdentity()
                @g.ctx.fillStyle = @bg_color
                @g.ctx.fillRect(0, 0, @bounds[2], @bounds[3])
                @calcLocalMatrix()
                @updateSceneGraph(@quadspace)
            
            @update(delta)

        draw_: (@delta) ->
            return if @paused
            @applyLocal()
            if @draw_quadspace
                @drawQuadSpace(@quadspace)
                @g.ctx.textAlign = "start"
                @g.strokeRect(@camera.view_frustum, "green")

            if @needs_updating
                for ent in @visible_ents
                    ent.draw(@delta)
                    @total_rendered++

                @visible_ents = []
                @needs_updating = false

            @draw(delta)

        applyLocal: () ->
            @g.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3],
                @local_matrix[1],
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )

        applyIdentity: () ->
            @g.ctx.setTransform(
                @identity_matrix[0], 
                @identity_matrix[3],
                @identity_matrix[1],
                @identity_matrix[4],
                @identity_matrix[2],
                @identity_matrix[5]
            )

        updateSceneGraph: (quadspace) ->
            return if @paused

            if quadspace.nw?
                @updateSceneGraph(quadspace.nw)
            if quadspace.ne?
                @updateSceneGraph(quadspace.ne)
            if quadspace.sw?
                @updateSceneGraph(quadspace.sw)
            if quadspace.se?
                @updateSceneGraph(quadspace.se)

            corner = @worldToLocal([0,0])
            rect = [corner[0], corner[1], @camera.w / @camera.zoom, @camera.h / @camera.zoom]

            if Hal.math.rectIntersectsOrContainsRect(rect, quadspace.bounds)
                for ent in quadspace.pts
                    bbox = [ent.x + ent.bbox[0], ent.y + ent.bbox[1], ent.bbox[2] - ent.bbox[0], ent.bbox[3] - ent.bbox[1]]
                    if Hal.math.rectIntersectsOrContainsRect(rect, bbox)
                        @visible_ents.push(ent)
                        ent.needs_updating = true
                        ent.update(@delta)

        drawQuadSpace: (quadspace) ->
            return if @paused
            @g.ctx.textAlign = "center"
            @g.ctx.fillStyle = "white"
            
            if quadspace.nw?
                @drawQuadSpace(quadspace.nw)
                @g.ctx.strokeRect(quadspace.nw.bounds[0], quadspace.nw.bounds[1], quadspace.nw.bounds[2], quadspace.nw.bounds[3])
                @g.ctx.fillText("#{quadspace.nw.id}", quadspace.nw.bounds[0] + quadspace.nw.bounds[2]*0.5, quadspace.nw.bounds[1] + quadspace.nw.bounds[3]*0.5)

            if quadspace.ne?
                @drawQuadSpace(quadspace.ne)
                @g.ctx.strokeRect(quadspace.ne.bounds[0], quadspace.ne.bounds[1], quadspace.ne.bounds[2], quadspace.ne.bounds[3])
                @g.ctx.fillText("#{quadspace.ne.id}", quadspace.ne.bounds[0] + quadspace.ne.bounds[2]*0.5, quadspace.ne.bounds[1] + quadspace.ne.bounds[3]*0.5)

            if quadspace.sw?
                @drawQuadSpace(quadspace.sw)
                @g.ctx.strokeRect(quadspace.sw.bounds[0], quadspace.sw.bounds[1], quadspace.sw.bounds[2], quadspace.sw.bounds[3])
                @g.ctx.fillText("#{quadspace.sw.id}", quadspace.sw.bounds[0] + quadspace.sw.bounds[2]*0.5, quadspace.sw.bounds[1] + quadspace.sw.bounds[3]*0.5)

            if quadspace.se?
                @drawQuadSpace(quadspace.se)
                @g.ctx.strokeRect(quadspace.se.bounds[0], quadspace.se.bounds[1], quadspace.se.bounds[2], quadspace.se.bounds[3])
                @g.ctx.fillText("#{quadspace.se.id}", quadspace.se.bounds[0] + quadspace.se.bounds[2]*0.5, quadspace.se.bounds[1] + quadspace.se.bounds[3]*0.5)

        calcLocalMatrix: () ->
            @local_matrix = Matrix3.mul(@localMatrix(), @rotationMatrix())

        pause: () ->
            @attr("paused", true)

        resume: () ->
            @attr("paused", false)

        group: (group) ->
            return [] if not @ent_groups[group]?
            return @ent_groups[group].slice()

        init: () ->
            @paused = false
            @attr("draw_bbox", @draw_bbox?)

            @on "CHANGE", (prop) ->
                if prop 
                    if prop[0] is "draw_quadspace"
                        return
                    else if prop[0] is "draw_bbox"
                        @entities.forEach (v) =>
                            v.attr("draw_bbox", @draw_bbox)

            @cam_change = 
            @camera.on "CHANGE", () =>
                return if @paused
                @needs_updating = true

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
                    @g.strokeRectO([0, 0, 6, 6], "white")
                    @g.ctx.lineWidth = 5
                    @g.strokeRectO([0, 0, @camera.w, @camera.h], "white")
                    @g.ctx.translate(-@camera.cx, -@camera.cy)
                    @g.ctx.lineWidth = 1

                if @draw_stat
                    @drawStat()

            @calcLocalMatrix()

            @left_click_listener =
            Hal.on "LEFT_CLICK", (pos) =>
                @trigger "LEFT_CLICK", pos

            @left_dbl_click_listener = 
            Hal.on "LEFT_DBL_CLICK", (pos) =>
                @trigger "LEFT_DBL_CLICK", pos

            @on "ENTITY_MOVING", (ent) ->
                if not Hal.math.isPointInRect(ent.viewportPos(), ent.quadspace.bounds)
                    Hal.log.debug "i'm out of my quadspace #{ent.id}"
                    ent.quadspace.remove(ent)
                    @quadspace.insert(ent)
                @camera.trigger "CHANGE"

    return Scene