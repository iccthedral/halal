"use strict"

define [], () ->

    class TileManager
        constructor: (tileList = "") ->
            @Tiles = []
            @TilesByName = {}

            Hal.on "TILE_ADDED", (tile) =>
                @add(tile)

        loadFromList: (list = "assets/TilesList.list") ->
            Ajax.get "assets/amjad/TilesList.json", (tiles) =>
            log.debug "TileManager loaded tiles."
            tiles = JSON.parse(tiles)
            for k, t of tiles
                @add(t)

        add: (tile) ->
            @TilesByName[tile.name] = tile
            @Tiles[tile.id] = tile





