"use strict"

define [],

() ->

    class Renderer 
        constructor: (@bounds, canvas, z) ->
            if canvas? 
                @canvas     = canvas
            else 
                @canvas     = Hal.dom.createCanvasLayer(z)
                @bounds[0]  = 0
                @bounds[1]  = 0
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
        for p in points[1..]
            @ctx.lineTo(p[0], p[1])
        @ctx.closePath()
        @ctx.stroke()
        @ctx.strokeStyle = ""

    return Renderer