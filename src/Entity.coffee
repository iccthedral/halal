"use strict"

define ["HalalEntity", "Scene", "Matrix3", "BBoxAlgos", "Vec2"],

(HalalEntity, Scene, Matrix3, BBoxAlgos, Vec2) ->

    class Entity extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @id             = Hal.ID()
            @shape          = if meta.shape? then meta.shape else [[0, 0], [0, 1], [1,1], [1,0]]
            @x              = if meta.x? then meta.x else 0
            @y              = if meta.y? then meta.y else 0
            @angle          = if meta.angle? then meta.angle else 0
            @scale          = if meta.scale? then meta.scale else 1
            @stroke_color   = if meta.stroke_color? then meta.stroke_color else "black"
            @glow           = if meta.glow? then meta.glow else false
            @glow_color     = if meta.glow_color? then meta.glow_color else "blue"
            @glow_amount    = if meta.glow_amount? then meta.glow_amount else 16
            @line_width     = if meta.line_width? then meta.line_width else 1.0
            @draw_shape     = if meta.draw_shape? then meta.draw_shape else true
            @opacity        = if meta.opacity? then meta.opacity else 1
            @parent         = null
            @world_pos      = [0, 0]
            
            # its part of quadspace
            @quadspace      = null
            
            @needs_updating = true
            @draw_origin    = false
            @local_matrix   = @localMatrix()
            @bbox           = BBoxAlgos.rectFromPolyShape(@shape)
            
            @children       = []
            @shapes         = []
            @drawables      = []
            @scene          = null

            @selected_color     = "white"
            @unselected_color   = @stroke_color

            @on "CHANGE", (attr) ->
                prop = attr[0]
                if prop in ["angle", "scale", "x", "y", "glow", "parent", "line_width", "h"]
                    @needs_updating = true

                if prop is "shape"
                    if not @sprite?
                        @bbox = BBoxAlgos.rectFromPolyShape(@shape)
                        @needs_updating = true

                if prop in ["x", "y"]
                    if @parent? and @quadspace?
                        @parent.trigger "ENTITY_MOVING", @
                        for ch in @children
                            @parent.trigger "ENTITY_MOVING", ch

            @on "ENTITY_ADDED", () ->
                @init()

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

            @on "EXIT_FRAME", () ->
               @scene.g.ctx.setTransform(1, 0, 0, 1, 0, 0)
               
            @on "LEFT_CLICK", (attr) ->
                @selected = not @selected

                if @selected
                    @trigger "SELECTED"
                else
                    @trigger "DESELECTED"

                log.debug "yay, i've been selected: #{@id}"
            
            # @scene.camera.on "CHANGE", () =>
            #     log.debug "hello from #{@id}"
            #     log.debug @

        viewportPos: () ->
            inv = Matrix3.transpose([], @local_matrix)
            return Vec2.transformMat3([], [0, 0], inv)

        worldPos: () ->
            return @localToWorld([@x, @y])

        localToWorld: (pos) ->
            inv = Matrix3.transpose([], @local_matrix)
            return Vec2.transformMat3([], pos, inv)

        worldToLocal: (pos) ->
            return Vec2.transformMat3([], pos, Matrix3.transpose([], Matrix3.invert([], @local_matrix)))

        addEntity: (ent) ->
            @children.push(ent)
            @scene.addEntity(ent)
            @trigger "CHILD_ENTITY_ADDED", ent
            ent.attr("scene", @scene)
            ent.attr("parent", @)

        addEntityToQuadspace: (ent) ->
            @children.push(ent)
            @scene.addEntityToQuadspace(ent)
            @trigger "CHILD_ENTITY_ADDED", ent
            ent.attr("scene", @scene)
            ent.attr("parent", @)
            return ent

        destroy: (destroy_children = true) ->
            #remove all listeners
            @removeAll()
            @scene.removeEntity(@)
            if destroy_children
                @destroyChildren()

            @children = null

            #isto tako i za drawables
            #i za shapes uostalom
            @drawables   = null
            @parent      = null
            if not @quadspace?
                log.warn "this entity had no quadspace"
            else 
                @quadspace.remove(@)
            @quadspace = null
            @scene = null
            @trigger "ON_DESTROY"

        destroyChildren: () ->
            for c in @children
                c.destroy()

        update: (delta) ->
            @scene.g.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3],
                @local_matrix[1],
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )

            if @needs_updating
                @local_matrix = Matrix3.mul(@rotationMatrix(), @localMatrix())
                @local_matrix = Matrix3.mul(@local_matrix, @parent.local_matrix)
                @needs_updating = false
                if not @glow
                    @scene.g.ctx.shadowBlur = 0

        addDrawable: (drawableFunc) ->
            @drawables.push(drawableFunc)

        addShape: (shape) ->
            @shapes.push(shape)

        draw: (delta) ->
            @scene.g.ctx.globalAlpha = @opacity

            if @draw_shape
                @scene.g.ctx.lineWidth = @line_width if @line_width > 1.0
            
            if @glow
                @scene.g.ctx.shadowBlur = @glow_amount 
                @scene.g.ctx.shadowColor = @glow_color
            
            if @draw_shape   
                @scene.g.strokePolygon(@shape, if not @selected then @stroke_color else @selected_color)

            if @glow
                @scene.g.ctx.shadowBlur = 0
            
            @scene.g.ctx.lineWidth = 1.0 if @line_width isnt 1.0 and @draw_shape

            if @draw_origin
                @scene.g.drawLine(0, 0, 0, -100, "green")
                @scene.g.drawLine(-50, 0, 50, 0, "green")

            if @draw_bbox
                @scene.g.strokeRect(@bbox, "cyan")

            for s in @drawables
                s.call(@, delta)

            for s in @shapes
                @scene.g.strokePolygon(s, "blue")

            # @scene.g.ctx.globalAlpha = 1.0
    return Entity
