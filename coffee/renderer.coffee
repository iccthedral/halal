"use strict"

define [],

() ->

    class Renderer 
        constructor: (@bounds, canvas, @top_z, transp = false) ->
            @canvases           = {}
            @contexts           = []
            @canvases[@top_z]   = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], @top_z, transp)
            Hal.dom.addCanvas(@canvases[@top_z], @bounds[0], @bounds[1])
            @ctx = @canvases[@top_z].getContext("2d")
            @contexts.push @ctx

    Renderer::resize = (w, h) ->
        for k, canvas of @canvases
            canvas.width    = w
            canvas.height   = h
            @prev_bnds      = @bounds.slice()
            @bounds[2]      = w
            @bounds[3]      = h

    Renderer::getLayerContext = (z) ->
        layer = @canvases[@top_z + z]
        if layer?
            return layer.getContext("2d")

    Renderer::createLayers = (z_indices) ->
        for z in z_indices
            layer = @top_z + z
            console.log ("layer: " + layer)
            @canvases[layer] = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], layer, true)
            Hal.dom.addCanvas(@canvases[layer], @bounds[0], @bounds[1])
            @contexts.push(@getLayerContext(layer))
        console.debug @sortLayers()
        return @contexts

    Renderer::sortLayers = () ->
        return @contexts = @contexts.sort (a, b) ->
            diff = (+a.canvas.style["z-index"]) - (+b.canvas.style["z-index"])
            console.debug "diff: #{diff}"
        @destroy()

        for z,sc of @contexts
            z = c.canvas.style["z-index"]
            @canvases[z] = c.canvas
            Hal.dom.addCanvas(z)
 
    Renderer::removeLayer = (z) ->
        Hal.dom.removeCanvasLayer(z)

    Renderer::destroy = () ->
        llogi "Destroying all canvases under renderer at #{@top_z}: "
        for z, canvas of @canvases
            @removeLayer(z)

    return Renderer