"use strict"

define [],

() ->

    class Renderer 
        constructor: (@bounds, canvas, z) ->
            if canvas? 
                @canvas     = canvas
            else 
                @canvas     = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], z)
                Hal.dom.addCanvas(@canvas, @bounds[0], @bounds[1], true)
            
            @ctx = @canvas.getContext("2d")

    Renderer::resize = (w, h) ->
        @canvas.width   = w
        @canvas.height  = h
        @prev_bnds      = @bounds.slice()
        @bounds[2]      = w
        @bounds[3]      = h

    Renderer::strokePolygon = (points, style) ->
        @ctx.strokeStyle = style
        @ctx.beginPath()
        @ctx.moveTo(points[0][0], points[0][1])
        for p in points[1...]
            @ctx.lineTo(p[0], p[1])
        @ctx.closePath()
        @ctx.stroke()

    Renderer::strokePolygonO = (points, ox = 0, oy = 0, style) ->
        @ctx.strokeStyle = style
        @ctx.translate(ox, oy)
        @ctx.beginPath()
        @ctx.moveTo(points[0][0] - ox, points[0][1] - oy)
        for p in points[1...]
            @ctx.lineTo(p[0] - ox, p[1] - oy)
        @ctx.closePath()
        @ctx.stroke()
        @ctx.translate(-ox, -oy)

    Renderer::drawLine = (x0, y0, x1, y1, style) ->
        @ctx.strokeStyle = style
        @ctx.beginPath()
        @ctx.moveTo(x0, y0)
        @ctx.lineTo(x1, y1)
        @ctx.closePath()
        @ctx.stroke()
    
    Renderer::strokeRect = (pts, style) ->
        @ctx.strokeStyle = style
        @ctx.strokeRect(pts[0], pts[1], pts[2], pts[3])

    Renderer::strokeRectO = (pts, style) ->
        @ctx.strokeStyle = style
        @ctx.strokeRect(pts[0] - pts[2]*0.5, pts[1] - pts[3] * 0.5, pts[2], pts[3])

    Renderer::drawSprite = (sprite, x = 0, y = 0) ->
        @ctx.drawImage(sprite.img, -sprite.w2 - x, -sprite.h2 - y)

    return Renderer