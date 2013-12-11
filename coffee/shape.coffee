"use strict"

define [
    "vec2", 
    "matrix3", 
    "halalentity", 
    "transformable", 
    "drawable", 
    "geometry", 
    "collidable",
    "bbresolvers",
    "sprite"
], 

(
    Vec2, 
    Matrix3, 
    HalalEntity, 
    Transformable, 
    Drawable, 
    Geometry, 
    Collidable,
    BBResolvers,
    Sprite
) ->

    reactives = ["angle", "scale", "position", "origin"]
    class Shape extends HalalEntity
        @include Transformable
        @include Drawable
        @include Collidable
        # @include Groupy

        constructor: (meta) ->
            super()
            @_mesh                  = null
            @_numvertices           = 0
            @scene                  = null

            if meta.shape?
                @setShape(meta.shape)
                lloge meta.shape
                @drawableOnState(@DrawableStates.Stroke)
            # if meta.sprite?
            #     @attr("sprite", meta.sprite)
            if meta.x? and meta.y?
                @setPosition(meta.x, meta.y)
            return @

    Shape::init = () ->
        @on "CHANGE", (key, val) ->
            if key in reactives
                @_update_mesh_transform = true
                @_update_transform      = true
                @_update_inverse        = true
        return @

    Shape::setShape = (mesh) -> #ako je vektor iz bazena
        if @_mesh?
            @destroyMesh()

        if not Geometry.isPolygonConvex(mesh)
            llogw "Oh snap, mesh was degenerate"
            mesh = Geometry.polygonSortVertices(mesh)
        center = Hal.geometry.polygonCentroidPoint(mesh)
        llogd center
        @setOrigin(center[0], center[1])
        Vec2.release(center)
        llogd mesh
        debugger
        @_mesh = mesh
        @_numvertices = @_mesh.length
        @trigger "SHAPE_CHANGED"
        return @

    Shape::addVertex = (x, y) ->
        @_numvertices = @_mesh.push(Vec2.from(x, y))
        if not Geometry.isPolygonConvex(@_mesh)
            llogw "Oh snap, mesh was degenerate"
            @setShape(Geometry.polygonSortVertices(@_mesh))
        return @

    Shape::update = (ctx, delta) ->
        if @scene.update_ents
            @_update_transform = true
        @calcTransform()
        # @combineTransform(@scene.transform())
        # @scene.checkForCollisions(@)
        return

    Shape::draw = (ctx, delta) ->
        @trigger "PRE_FRAME", ctx, delta

        ctx.setTransform(
            @scene._transform[0],
            @scene._transform[3],
            @scene._transform[1],
            @scene._transform[4],
            @scene._transform[2],
            @scene._transform[5]
        )

        ctx.transform(
            @_transform[0],
            @_transform[3],
            @_transform[1],
            @_transform[4],
            @_transform[2],
            @_transform[5]
        )

        @trigger "POST_FRAME", ctx, delta
        return

    Shape::angleWithOrigin = (p) ->
        p = Vec2.transformMat3(null, p, @_transform)
        return Geometry.angleOf([p[0] - @origin[0], p[1] - @origin[1]])

    Shape::addShape = () ->
        return
    
    Shape::destroyMesh = () ->
        @_numvertices = 0
        for p in @_mesh
            if p instanceof Float32Array
                Vec2.release(p)

    return Shape