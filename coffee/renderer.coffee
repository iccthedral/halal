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

    return Renderer