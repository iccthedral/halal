"use strict"

###
 Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
###
define ["vec2", "geometry", "sprite"],

(Vec2, Geometry, Sprite) ->

    class Drawable
        drawableToggleState: (state = DrawableStates.stroke) ->
            @_drawableState ^= state

        drawableOnState: (state) ->
            @_drawableState |= state

        drawableOffState: (state) ->
            @drawableOnState(state)
            @drawableToggleState(state)

        drawableIsState: (state) ->
            return (@_drawableState & state) is state;

        constructor: () ->
            llogd @
            @_drawableState = 0x00
            @stroke_color   = "white"
            @fill_color     = "orange"
            @sprite         = null
            @glow_amount    = 1
            @glow_color     = "blue"
            @stroke_width   = 1

            @on "CHANGE", (key, val) ->
                if key is "sprite"
                    return if not @sprite? or not @sprite instanceof Sprite
                    shape = Geometry.createPolygonFromRectangle(@sprite.w2, @sprite.h2)
                    lloge shape
                    debugger
                    @setShape(shape)
                    @drawableOnState(@DrawableStates.Sprite)
                    @drawableOffState(@DrawableStates.Fill)
                    @drawableOffState(@DrawableStates.Stroke)
                else if key is "glow" and val is true
                    @drawableOnState(@DrawableStates.Stroke)
                    @drawableOnState(@DrawableStates.Glow)
                else if key is "glow" and val is false
                    @drawableOffState(@DrawableStates.Glow)

            @on "POST_FRAME", (ctx, delta) ->
                ### @FILL ###
                if @drawableIsState(@DrawableStates.Fill)
                    ctx.fillStyle = @fill_color
                    ctx.beginPath()
                    ctx.moveTo(@_mesh[0][0], @_mesh[0][1])
                    i = 1
                    while i < @_numvertices
                        ctx.lineTo(@_mesh[i][0], @_mesh[i][1])
                        ++i
                    ctx.closePath()
                    ctx.fill()

                ### @DRAW @SPRITE ###
                if @drawableIsState(@DrawableStates.Sprite) and @sprite?
                    ctx.drawImage(@sprite.img, -@sprite.w2, -@sprite.h2)

                ### @GLOW ###
                if @drawableIsState(@DrawableStates.Glow)
                    ctx.shadowColor = @glow_color
                    ctx.shadowBlur = @glow_amount

                ### @STROKE ###
                if @drawableIsState(@DrawableStates.Stroke)
                    ctx.lineWidth = @stroke_width
                    ctx.strokeStyle = @stroke_color
                    ctx.beginPath()
                    ctx.moveTo(@_mesh[0][0], @_mesh[0][1])
                    i = 1
                    while i < @_numvertices
                        ctx.lineTo(@_mesh[i][0], @_mesh[i][1])
                        ++i
                    ctx.closePath()
                    ctx.stroke()
                    ctx.lineWidth = 1

                if @drawableIsState(@DrawableStates.Glow)
                    ctx.shadowBlur = 0

                ### @DRAW @NORMALS ###
                if @drawableIsState(@DrawableStates.DrawNormals)
                    i = 0
                    p1 = Vec2.acquire()
                    p2 = Vec2.acquire()
                    mid = Vec2.acquire()
                    p = Vec2.acquire()
                    while i < @_numvertices
                        Vec2.copy(p1, @_mesh[i])
                        Vec2.copy(p2, @_mesh[(i + 1) % @_numvertices])
                        Vec2.addAndScale(mid, p1, p2, 0.5)
                        Vec2.sub(p, p2, p1)
                        Vec2.perpendicular(p1, p)
                        Vec2.normalize(p2, p1)
                        Vec2.scale(p1, p2, 50)
                        Vec2.add(p, p1, mid)
                        ctx.strokeStyle = "yellow"
                        ctx.beginPath()
                        ctx.moveTo(mid[0], mid[1])
                        ctx.lineTo(p[0], p[1])
                        ctx.closePath()
                        ctx.stroke()
                        ++i
                    Vec2.release(p1)
                    Vec2.release(p2)
                    Vec2.release(mid)
                    Vec2.release(p)

                if @drawableIsState(@DrawableStates.DrawCenter)
                    ctx.strokeRect(0, 0, 1, 1)

                if @drawableIsState(@DrawableStates.DrawBBox)
                    ctx.strokeRect(@_bbox[0], @_bbox[1], @_bbox[2], @_bbox[3])

    Drawable::DrawableStates = 
        DrawCenter:             0x01
        DrawOriginNormals:      0x02
        Glow:                   0x04
        DrawNormals:            0x08
        Fill:                   0x10
        Sprite:                 0x20
        DrawBBox:               0x40
        Stroke:                 0x80
    return Drawable