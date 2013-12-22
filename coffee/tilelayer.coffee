"use strict"

define ["shape"], 

(Shape) ->

    class TileLayer extends Shape
        constructor: (meta) ->
            super(meta)
            @setSprite(Hal.asm.getSprite(meta.sprite))
            @name   = if meta.name? then meta.name else "#{@id}"
            @layer  = if meta.layer? then meta.layer else 0
            @h      = 0
            @attr("group", meta.group) if meta.group?
            @attr("group", meta.layer)

        attachToTile: (tile) ->
            @tile = tile
            @trigger "PLACED_ON_TILE"

        init: (meta) ->
            super(meta)

        initListeners: () ->
            super()
            @on "SELECTED", () ->
                console.log "I'm selected: #{@toString()}"

            @on "DESELECTED", () ->
                console.log "I'm deselected: #{@toString()}"

        destroy: () ->
            # console.log "Destroying myself #{@toString()}"
            super()
            if @tile?
                @tile.removeLayer(@layer)
            delete @tile

        toString: () ->
            return @tile?.toString()

    return TileLayer