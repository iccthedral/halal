"use strict"

define [],

() ->

    class Renderer 
        constructor: (@bounds, canvas, @z) ->
            @canvases = {}
            if canvas? 
                @canvases[z] = canvas
            else 
                @canvases[@z] = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], z)
                Hal.dom.addCanvas(@canvases[@z], @bounds[0], @bounds[1], true)
            
            @ctx = @canvases[@z].getContext("2d")

    Renderer::resize = (w, h) ->
        for k,canvas of @canvases
            canvas.width   = w
            canvas.height  = h
            @prev_bnds      = @bounds.slice()
            @bounds[2]      = w
            @bounds[3]      = h

    createLayers: (z_indices) ->
        for z in z_indices
            layer = @z + z
            @canvases[layer] = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], layer)
            Hal.dom.addCanvas(@canvases[layer], @bounds[0], @bounds[1], true)

    return Renderer