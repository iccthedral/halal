"use strict"

define ["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2", "geometry", "transformable", "groupy"],

(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2, Geometry, Transformable, Groupy) ->
    
    reactives = ["angle", "scale", "position", "origin"]
    class Scene extends HalalEntity
        @include Transformable
        @include Groupy

        constructor: (meta = {}) ->
            @parseMeta(meta)
            @paused             = true
            @entities           = []
            @ent_cache          = {}
            @mpos               = [0, 0]
            @z                  = 1
            @g                  = new Renderer(@bounds, null, @z)
            #create layers
            # @g.createLayers(
            #     @z, @z+1, @z+2, @z+3
            # )
            @draw_stat          = true
            @update_ents        = true
            @cam_move           = Vec2.acquire()
            @dragging           = false
            @start_drag_point   = [0,0]
            @drag               = null
            @drag_started       = null
            @drag_ended         = null
            @zoom               = null
            @lerp_anim          = null
            @zoom_step          = 0.1
            @camera_speed       = 2
            @_update_zoom       = false            
            @center             = Vec2.from(@bounds[2] * 0.5, @bounds[3] * 0.5)
            @_update_transform  = true

            @view_matrix        = Matrix3.create()
            @view_matrix[2]     = @center[0]
            @view_matrix[5]     = @center[1]

            super()

            @setOrigin(@center[0], @center[1])
            @prev_pos = [@position[0], @position[1]]
            #@combineTransform(@view_matrix)
            return @

        parseMeta: (meta) ->
            @name               = if meta.name? then meta.name else "#{Hal.ID()}"
            @bounds             = if meta.bounds? then meta.bounds else Hal.viewportBounds()
            @bg_color           = if meta.bg_color? then meta.bg_color else "white"

        addEntity: (ent) ->
            if not ent?
                lloge "Entity is null" 
                return
            @entities.push(ent)
            @ent_cache[ent.id] = ent
            ent.attr("scene", @)
            @trigger "ENTITY_ADDED", ent
            return ent

        drawStat: () ->
            Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
            Hal.glass.ctx.clearRect(0, 0, 400, 300)
            Hal.glass.ctx.fillStyle = "black"
            Hal.glass.ctx.fillText("FPS: #{Hal.fps}", 0, 10)
            Hal.glass.ctx.fillText("Num of entities: #{@entities.length}", 0, 25)
            Hal.glass.ctx.fillText("Camera position: #{@position[0].toFixed(2)}, #{@position[1].toFixed(2)}", 0, 40)
            Hal.glass.ctx.fillText("Camera origin: #{@origin[0].toFixed(2)}, #{@origin[1].toFixed(2)}", 0, 55)
            Hal.glass.ctx.fillText("Camera zoom: #{@scale[0].toFixed(2)}, #{@scale[1].toFixed(2)}", 0, 70)
            Hal.glass.ctx.fillText("Mouse: #{@mpos[0]}, #{@mpos[1]}", 0, 85)
            Hal.glass.ctx.fillText("Num of free pool vectors: #{Vec2.free}", 0, 100)
            Hal.glass.ctx.fillText("View origin: #{@view_matrix[2].toFixed(2)}, #{@view_matrix[5].toFixed(2)}", 0, 115)
            Hal.glass.ctx.fillText("View scale: #{@view_matrix[0].toFixed(2)}, #{@view_matrix[4].toFixed(2)}", 0, 130)

        getAllEntities: () ->
            return @entities.slice()

        update: (delta) ->
            @g.ctx.fillStyle = @bg_color
            @g.ctx.setTransform(1, 0, 0, 1, 0, 0)
            @g.ctx.fillRect(0, 0, @bounds[2], @bounds[3])
            @g.ctx.strokeRect(@center[0] - 1, @center[1] - 1, 2, 2)
            
            if @_update_transform
                @transform(@view_matrix)
                @update_ents = true

            for en in @entities
                en.update(@g.ctx, delta)

        checkForCollisions: (ent) ->
            #get moving entities
            #group them by the quadspace quadrant they're in
            #group collision check, and resolve

            for en in @entities
                continue if en is ent
                check = Geometry.polygonIntersectsOrContainsPolygon(en._mesh, ent._mesh, ent.inverseTransform(), en.transform())
                if check and not ent.in_collision and not en.in_collision
                   ent.trigger "COLLISION_STARTED", en
                   en.trigger "COLLISION_STARTED", ent
                else if ent.in_collision and en.in_collision and not check
                    ent.trigger "COLLISION_ENDED", en
                    en.trigger "COLLISION_ENDED", ent

        draw: (delta) ->
            if @draw_stat
                @drawStat()
            for en in @entities
                en.draw(@g.ctx, delta)
            @update_ents = false

        pause: () ->
            @attr("paused", true)

        resume: () ->
            @attr("paused", false)

        getAllEntities: () ->
            return @entities.slice()

        removeEntity: (ent) ->
            if not @ent_cache[ent.id]
                lloge "No such entity #{ent.id} in cache"
                return
            ind = @entities.indexOf(ent)
            if ind is -1
                lloge "No such entity #{ent.id} in entity list"
                return
            delete @ent_cache[ent.id]
            @trigger "ENTITY_DESTROYED", ent
            @entities.splice(ind, 1)

        removeAllEntities: (destroy_children = false) ->
            for ent in @getAllEntities()
                #let each children entity destroy itself 
                #rather it to be destroyed by its parent
                ent.destroy()
            return

        removeEntityByID: (entid) ->
            ent = @ent_cache[entid]
            if ent?
                ent.removeEntity(ent)
            else
                llogw "No such entity #{entid} in entity cache"

        ### valja sve unregistorovati posle ###
        init: () ->
            @paused = false

            @on "CHANGE", (key, val) ->
                if key in reactives
                    @_update_transform = true
                    @_update_inverse   = true
            
            @on "ENTITY_REQ_DESTROYING", (entity) ->
                @removeEntity(entity)

            Hal.on "RESIZE", (area) =>
                @g.resize(area.width, area.height)
                @bounds[2] = area.width
                @bounds[3] = area.height
                @_update_transform = true
                @_update_inverse = true

            Hal.on "RIGHT_CLICK", (pos) =>
                return if @paused
                Vec2.set(@cam_move,
                    (@center[0] - pos[0]) + @position[0],
                    (@center[1] - pos[1]) + @position[1]
                )

                if @lerp_anim
                    Hal.removeTrigger "EXIT_FRAME", @lerp_anim
                    @lerp_anim = null
                    @_update_transform = true
                    @_update_inverse = true

                @lerp_anim = 
                Hal.on "EXIT_FRAME", (delta) =>
                    Vec2.lerp(@position, @position, @cam_move, delta * 2)
                    if (~~Math.abs(@position[0] - @cam_move[0]) + ~~Math.abs(-@position[1] + @cam_move[1])) < 2
                        Hal.removeTrigger "EXIT_FRAME", @lerp_anim
                        @lerp_anim = null
                    @_update_transform = true
                    @_update_inverse = true

            @drag_started = 
            Hal.on "DRAG_STARTED", (pos) =>
                return if @paused
                @dragging               = true
                @start_drag_point[0]    = pos[0]
                @start_drag_point[1]    = pos[1]
                @prev_pos               = [@position[0], @position[1]]
                @_update_transform      = true
                @_update_inverse        = true

                if @lerp_anim
                    Hal.removeTrigger "EXIT_FRAME", @lerp_anim
                    @lerp_anim = null

            @drag_ended = 
            Hal.on "DRAG_ENDED", (pos) =>
                @dragging = false
                @_update_transform = true
                @_update_inverse = true

            @drag =
            Hal.on "MOUSE_MOVE", (pos) =>
                return if @paused
                if @dragging
                    @position[0] = (@prev_pos[0] + (pos[0] - @start_drag_point[0]))
                    @position[1] = (@prev_pos[1] + (pos[1] - @start_drag_point[1]))
                    @_update_transform = true
                    @_update_inverse = true

            @zoom =
            Hal.on "SCROLL", (ev) =>
                return if @paused
                if ev.down
                    @view_matrix[0] -= @zoom_step
                    @view_matrix[4] -= @zoom_step
                else
                    @view_matrix[0] += @zoom_step
                    @view_matrix[4] += @zoom_step

                @_update_transform = true
                @_update_inverse = true

            super()

    return Scene