"use strict"

###
 Ovo ce biti klasa za menadzovanje iscrtavanja po scenu na koju se ubaci
###
define ["vec2", "geometry", "sprite"],

(Vec2, Geometry, Sprite) ->

    class Drawable
        drawableToggleState: (state = 0x00) ->
            @_drawableState ^= state

        drawableOnState: (state = 0x00) ->
            @_drawableState |= state

        drawableOffState: (state = 0x00) ->
            @drawableOnState(state)
            @drawableToggleState(state)

        drawableIsState: (state = 0x00) ->
            return (@_drawableState & state) is state;

        destructor: () ->
            @removeTrigger "CHANGE", @drawable_change
            @removeTrigger "POST_FRAME", @drawable_post_frame
            console.info "You got destroyed"
            
        constructor: () ->
            @_drawableState = 0xF00
            @stroke_color   = "white"
            @fill_color     = "orange"
            @sprite         = null
            @glow_amount    = 1
            @glow_color     = "blue"
            @stroke_width   = 1
            @opacity        = 1

            @on "CHANGE", @drawable_change = (key, val) ->
                if key is "sprite"
                    console.log "koliko puta ide ovo"
                    return if not @sprite? or not @sprite instanceof Sprite
                    # shape = Geometry.createPolygonFromRectangle(@sprite.w, @sprite.h)
                    # lloge shape
                    # @setShape(shape)
                    @trigger "SPRITE_ADDED", @sprite
                    @drawableOnState(Drawable.DrawableStates.Sprite)
                    @drawableOffState(Drawable.DrawableStates.Fill)
                    @drawableOffState(Drawable.DrawableStates.Stroke)
                else if key is "glow" and val is true
                    @drawableOnState(Drawable.DrawableStates.Stroke)
                    @drawableOnState(Drawable.DrawableStates.Glow)
                else if key is "glow" and val is false
                    @drawableOffState(Drawable.DrawableStates.Glow)
                # else if key is "opacity"
                #     @opacity

            @on "POST_FRAME", @drawable_post_frame = (ctx, delta) ->
                ### @FILL ###
                if @drawableIsState(Drawable.DrawableStates.Fill)
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
                if @drawableIsState(Drawable.DrawableStates.Sprite) and @sprite?
                    ctx.drawImage(@sprite.img, -@sprite.w2, -@sprite.h2)

                ### @GLOW ###
                if @drawableIsState(Drawable.DrawableStates.Glow)
                    ctx.shadowColor = @glow_color
                    ctx.shadowBlur = @glow_amount

                ### @STROKE ###
                if @drawableIsState(Drawable.DrawableStates.Stroke)
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

                if @drawableIsState(Drawable.DrawableStates.Glow)
                    ctx.shadowBlur = 0

                ### @DRAW @NORMALS ###
                if @drawableIsState(Drawable.DrawableStates.DrawNormals)
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

                if @drawableIsState(Drawable.DrawableStates.DrawCenter)
                    ctx.strokeRect(0, 0, 1, 1)

                if @drawableIsState(Drawable.DrawableStates.DrawBBox)
                    ctx.strokeRect(@_bbox[0], @_bbox[1], @_bbox[2], @_bbox[3])

    Drawable.DrawableStates = 
        DrawCenter:             0x01
        DrawOriginNormals:      0x02
        Glow:                   0x04
        DrawNormals:            0x08
        Fill:                   0x10
        Sprite:                 0x20
        DrawBBox:               0x40
        Stroke:                 0x80

    return Drawable