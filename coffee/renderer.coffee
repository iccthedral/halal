"use strict"

define [],

() ->

    class Renderer 
        constructor: (@bounds, canvas, @top_z, transp = false) ->
            @canvases           = {}
            @contexts           = []
            @canvases[@top_z]   = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], @top_z)
            Hal.dom.addCanvas(@canvases[@top_z], @bounds[0], @bounds[1], transp)
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
        console.log @top_z + z
        layer = @canvases[@top_z + z]
        if layer?
            return layer.getContext("2d")

    Renderer::createLayers = (z_indices) ->
        for z in z_indices
            layer = @top_z + z
            @canvases[layer] = Hal.dom.createCanvasLayer(@bounds[2], @bounds[3], layer, true)
            @contexts.push(@getLayerContext(z))
            Hal.dom.addCanvas(@canvases[layer], @bounds[0], @bounds[1], true)

    Renderer::removeLayer = (z) ->
        Hal.dom.removeCanvasLayer(z)

    Renderer::destroy = () ->
        llogi "Destroying all canvases under renderer at #{@top_z}: "
        for z, canvas of @canvases
            @removeLayer(z)

    return Renderer