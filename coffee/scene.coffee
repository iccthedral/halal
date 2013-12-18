"use strict"

define ["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2", "geometry", "transformable", "groupy"],

(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2, Geometry, Transformable, Groupy) ->
    
    reactives = ["angle", "scale", "position", "origin"]
    class Scene extends HalalEntity
        @include Transformable
        @include Groupy

        constructor: (meta = {}) ->
            super()
            @parseMeta(meta)

            @bounds             = Hal.viewportBounds()
            @world_bounds       = Hal.viewportBounds()

            @entities           = []
            @ent_cache          = {}
            @z                  = 0
            @renderer           = new Renderer(@bounds, null, @z, true)
            @ctx                = @renderer.getLayerContext(@z)

            @draw_stat          = true
            @update_ents        = true
            @cam_move_vector    = Vec2.from(0, 0)
            @is_camera_panning      = false
            @camera_panning_point   = [0, 0]
            @zoom_step          = 0.05
            @camera_speed       = 2
            @_update_zoom       = false
            @center             = Vec2.from(@bounds[2] * 0.5, @bounds[3] * 0.5)
            @view_matrix        = Matrix3.create()
            @camera_moved       = false

            @view_matrix[2]     = @center[0]
            @view_matrix[5]     = @center[1]

            #@setOrigin(@center[0], @center[1])
            @combineTransform(@view_matrix)
            @prev_pos = [@position[0], @position[1]]
            @zoom_limits = [0.1, 2.3]
            @visible_ents = []
            #@init()
            return @

        parseMeta: (meta) ->
            @name               = if meta.name? then meta.name else "#{Hal.ID()}"
            @bg_color           = if meta.bg_color? then meta.bg_color else "white"
            @draw_stat          = if meta.draw_stat? then meta.draw_stat else true 
            @world_bounds       = if meta.world_bounds? then meta.world_bounds else Hal.viewportBounds()
        
        addEntity: (ent, ctx = @ctx) ->
            if not ent?
                lloge "Entity is null" 
                return
            ent.attr("ctx", ctx)
            ent.attr("scene", @)
            @entities.push(ent)
            @ent_cache[ent.id] = ent
            @trigger "ENTITY_ADDED", ent
            @update_ents = true
            ent.trigger "ON_SCENE"
            return ent

        addEntityToQuadSpace: (ent, ctx = @ctx) ->
            # if not ent?
            #     lloge "Entity is null" 
            #     return
            # ent.attr("ctx", ctx)
            # ent.attr("scene", @)
            # @entities.push(ent)
            # @ent_cache[ent.id] = ent
            # @trigger "ENTITY_ADDED", ent
            # ent.trigger "ON_SCENE"
            @addEntity(ent, ctx)
            @quadtree.insert(ent)
            ent.trigger "IN_QUADSPACE"
            return ent

        drawStat: () ->
            Hal.glass.ctx.clearRect(0, 0, 400, 300)
            Hal.glass.ctx.fillText("FPS: #{Hal.fps}", 0, 10)
            Hal.glass.ctx.fillText("Num of entities: #{@entities.length}", 0, 25)
            Hal.glass.ctx.fillText("Camera position: #{@position[0].toFixed(2)}, #{@position[1].toFixed(2)}", 0, 40)
            Hal.glass.ctx.fillText("Camera origin: #{@origin[0].toFixed(2)}, #{@origin[1].toFixed(2)}", 0, 55)
            Hal.glass.ctx.fillText("Num of visible entities: #{@visible_ents.length}", 0, 70)
            Hal.glass.ctx.fillText("Num of free pool vectors: #{Vec2.free}", 0, 85)
            Hal.glass.ctx.fillText("View origin: #{@view_matrix[2].toFixed(2)}, #{@view_matrix[5].toFixed(2)}", 0, 100)
            Hal.glass.ctx.fillText("View scale: #{@view_matrix[0].toFixed(2)}, #{@view_matrix[4].toFixed(2)}", 0, 115)

        getAllEntities: () ->
            return @entities.slice()

        update: (delta) ->
            # @ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
            if @_update_transform
                @combineTransform(@view_matrix)
                @update_ents = true
            if @update_ents
                @visible_ents = []
                @quadtree.findEntitiesInRectangle(@search_range, @_transform, @visible_ents)
            for en in @visible_ents
                en.update(delta)

        checkForCollisions: () ->
            #get moving entities
            #group them by the quadtree quadrant they're in
            #group collision check, and resolve
            for enA in @entities
                for enB in @entities
                    continue if enA is enB
                    if Geometry.polygonIntersectsOrContainsPolygon(enA._mesh, enB._mesh, enB.inverseTransform(), enA.transform())
                        enA.trigger "COLLISION_HAPPENED", enB

                # if check and not ent.in_collision and not en.in_collision
                #    ent.trigger "COLLISION_STARTED", en
                #    en.trigger "COLLISION_STARTED", ent
                # else if ent.in_collision and en.in_collision and not check
                #     ent.trigger "COLLISION_ENDED", en
                #     en.trigger "COLLISION_ENDED", ent

        draw: (delta) ->
            @clearRenderers()
            if @draw_stat
                @drawStat()
            for en in @visible_ents
                en.draw(delta)
            @update_ents = false

        clearRenderers: () ->
            for ctx in @renderer.contexts
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                ctx.clearRect(0, 0, @bounds[2], @bounds[3])
            @ctx.setTransform(1, 0, 0, 1, 0, 0)
            @ctx.fillStyle = @bg_color
            @ctx.fillRect(0, 0, @bounds[2], @bounds[3])
            @ctx.strokeRect(@center[0] - 1, @center[1] - 1, 2, 2)

        pause: () ->
            @attr("paused", true)

        resume: () ->
            @attr("paused", false)

        removeEntity: (ent) ->
            if not @ent_cache[ent.id]
                lloge "No such entity #{ent.id} in cache"
                return
            ind = @entities.indexOf(ent)
            if ind is -1
                lloge "No such entity #{ent.id} in entity list"
                return
            QuadTree.fromCache(ent.id)?.remove(ent)
            delete @ent_cache[ent.id]
            @trigger "ENTITY_DESTROYED", ent
            @entities.splice(ind, 1)
            @update_ents = true

        removeAllEntities: (destroy_children = false) ->
            for ent in @getAllEntities()
                #let each children entity destroy itself 
                #rather it to be destroyed by its parent
                @removeEntity(ent)
            return

        removeEntityByID: (entid) ->
            ent = @ent_cache[entid]
            if ent?
                ent.removeEntity(ent)
            else
                llogw "No such entity #{entid} in entity cache"

        ### valja sve unregistorovati posle ###
        init: () ->
            super()
            @pause()
            @search_range               = @bounds.slice()
            @camera_panning_started     = null
            @camera_panning_started     = null
            @camera_panning_ended       = null
            @camera_zoom_listener       = null
            @camera_lerp_listener       = null
            @camera_frame_listener      = null
            @resize_listener            = null
            @resetQuadTree(@world_bounds)
            @resume()

        screenToWorld: (point) ->
            return Geometry.transformPoint(point[0], point[1], @inverseTransform())
            
        worldToScreen: (point) ->
            return Geometry.transformPoint(point[0], point[1], @transform())

        resetQuadTree: (bounds) ->
            @quadtree.removeAll() if @quadtree?
            @quadtree = new QuadTree(bounds)
            @quadtree.divide()

        setWorldBounds: (@world_bounds) ->
            @resetQuadTree(@world_bounds)
            #uh oh
            return

        setBounds: (@bounds) ->
            #uh oh
            return 

        drawQuadTree: (quadtree) ->
            return if @paused
            @ctx.textAlign = "center"
            @ctx.fillStyle = "white"
            
            if quadtree.nw?
                @drawQuadTree(quadtree.nw)
                @ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3])
                @ctx.fillText("#{quadtree.nw.id}", quadtree.nw.bounds[0] + quadtree.nw.bounds[2]*0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3]*0.5)

            if quadtree.ne?
                @drawQuadTree(quadtree.ne)
                @ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3])
                @ctx.fillText("#{quadtree.ne.id}", quadtree.ne.bounds[0] + quadtree.ne.bounds[2]*0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3]*0.5)

            if quadtree.sw?
                @drawQuadTree(quadtree.sw)
                @ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3])
                @ctx.fillText("#{quadtree.sw.id}", quadtree.sw.bounds[0] + quadtree.sw.bounds[2]*0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3]*0.5)

            if quadtree.se?
                @drawQuadTree(quadtree.se)
                @ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3])
                @ctx.fillText("#{quadtree.se.id}", quadtree.se.bounds[0] + quadtree.se.bounds[2]*0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3]*0.5)

        disablePanning: () ->
            Hal.removeTrigger "DRAG_STARTED", @camera_panning_started
            Hal.removeTrigger "DRAG_ENDED", @camera_panning_ended
            Hal.removeTrigger "MOUSE_MOVE", @camera_panning_listener

        destroy: () ->
            @pause()
            Vec2.release(@center)
            Vec2.release(@cam_move_vector)
            @removeAllEntities()
            @renderer.destroy()
            @quadtree.removeAll()
            @quadtree = null
            @renderer = null
            Hal.trigger "SCENE_REQ_DESTROY", @
            super()
            
        destroyListeners: () ->
            super()
            Hal.removeTrigger "SCROLL", @camera_zoom_listener
            Hal.removeTrigger "MOUSE_MOVE", @camera_panning_listener
            Hal.removeTrigger "DRAG_STARTED", @camera_panning_started
            Hal.removeTrigger "DRAG_ENDED", @camera_panning_ended
            Hal.removeTrigger "RIGHT_CLICK", @camera_lerp_listener
            Hal.removeTrigger "RESIZE", @resize_listener
            Hal.removeTrigger "EXIT_FRAME", @camera_frame_listener

        initListeners: () ->
            super()
            @on "CHANGE", (key, val) ->
                return if @paused
                if key in reactives
                    @_update_transform = true
                    @_update_inverse   = true
            
            @on "ENTITY_REQ_DESTROYING", (entity) ->
                @removeEntity(entity)

            @resize_listener =
            Hal.on "RESIZE", (area) =>
                @renderer.resize(area.width, area.height)
                @bounds[2]          = area.width
                @bounds[3]          = area.height
                @_update_transform  = true
                @_update_inverse    = true
                @search_range = @bounds.slice()

            @camera_lerp_listener = 
            Hal.on "RIGHT_CLICK", (pos) =>
                return if @paused
                Vec2.set(@cam_move_vector,
                    (@center[0] - pos[0]) + @position[0],
                    (@center[1] - pos[1]) + @position[1]
                )

                if @camera_frame_listener
                    Hal.removeTrigger "EXIT_FRAME", @camera_frame_listener
                    @camera_frame_listener  = null
                    @_update_transform      = true
                    @_update_inverse        = true

                @camera_frame_listener = 
                Hal.on "EXIT_FRAME", (delta) =>
                    Vec2.lerp(@position, @position, @cam_move_vector, delta * 2)
                    if (~~Math.abs(@position[0] - @cam_move_vector[0]) + ~~Math.abs(-@position[1] + @cam_move_vector[1])) < 2
                        Hal.removeTrigger "EXIT_FRAME", @camera_frame_listener
                        @camera_frame_listener = null
                    @_update_transform = true
                    @_update_inverse = true

            @camera_panning_started = 
            Hal.on "DRAG_STARTED", (pos) =>
                return if @paused
                @is_camera_panning               = true
                @camera_panning_point[0]    = pos[0]
                @camera_panning_point[1]    = pos[1]
                @prev_pos               = [@position[0], @position[1]]
                @_update_transform      = true
                @_update_inverse        = true

                if @camera_frame_listener
                    Hal.removeTrigger "EXIT_FRAME", @camera_frame_listener
                    @camera_frame_listener = null

            @camera_panning_ended = 
            Hal.on "DRAG_ENDED", (pos) =>
                @is_camera_panning = false
                @_update_transform = true
                @_update_inverse = true

            @camera_panning_started =
            Hal.on "MOUSE_MOVE", (pos) =>
                return if @paused
                if @is_camera_panning
                    @position[0] = (@prev_pos[0] + (pos[0] - @camera_panning_point[0]))
                    @position[1] = (@prev_pos[1] + (pos[1] - @camera_panning_point[1]))
                    @_update_transform = true
                    @_update_inverse = true

            @camera_zoom_listener =
            Hal.on "SCROLL", (ev) =>
                return if @paused
                if ev.down
                    @view_matrix[0] -= @zoom_step
                    @view_matrix[4] -= @zoom_step
                else
                    @view_matrix[0] += @zoom_step
                    @view_matrix[4] += @zoom_step

                @view_matrix[0] = Hal.math.clamp(@view_matrix[0], @zoom_limits[0], @zoom_limits[1])
                @view_matrix[4] = Hal.math.clamp(@view_matrix[4], @zoom_limits[0], @zoom_limits[1])

                @_update_transform = true
                @_update_inverse = true

    return Scene