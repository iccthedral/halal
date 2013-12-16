"use strict"

define ["shape"], (Shape) ->

    class Tile extends Shape
        constructor: (meta) ->
            super(meta)
            @row    = meta.row
            @col    = meta.col
            @layers = new Array()
            return @

        containsLayer: (layermeta) ->
            layer = layermeta["layer"]
            if @layers[layer]? and (@layers[layer].name is layermeta.name)
                return true
            return false

        addTileLayer: (layerobj) ->
            layer = layerobj.layer
            console.debug "Adding layer to #{layer} at #{@row}, #{@col}"
            if @layers[layer]?
                @layers[layer].destroy()
            @layers[layer] = layerobj
            @sortLayers()
            layerobj.attachToTile(@)
            return layerobj

        getLayers: () ->
            return @layers.slice()

        removeLayer: (layer) ->
            if @layers[layer]?
                @layers.splice(layer, 1)
                @sortLayers()

        init: (meta) ->
            super(meta)
            return @

        sortLayers: () ->
            @layers.sort (a, b) ->
                return 0 if not a? or not b?
                return a.layer - b.layer

        destroyMesh: () -> 
            @_mesh = null #zato sto deli mesh sa svim tajlovima
            super()
            return

    return Tile
