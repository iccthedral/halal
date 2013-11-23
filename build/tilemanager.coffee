"use strict"

define ["spriteentity"], 
(SpriteEntity) ->

    class Tile extends SpriteEntity
        constructor: (meta) ->
            super(meta)
            @row    = meta.row
            @col    = meta.col
            @layers = [null, null, null, null, null]

        addTileLayer: (tile, layer) ->
            layer = layer || tile.layer
            layer_present = @layers[layer]?
            
            if layer_present and @layers[layer].name is tile.name
                log.debug "You're trying to add the same layer"
                return

            if layer_present
                @layers[layer].destroy()
            
            @layers[layer] = tile
            ent = @addEntityToQuadspace(tile)
            ent.attr("shape", @shape)
            ent.attr("draw_shape", false)

            # @on "ENTITY_DESTROYED", (layer) ->
            #     @parent.layers[layer] = null

        update: (delta) ->
            super(delta)
            for layer in @layers
                layer.update(delta) if layer?

        draw: (delta) ->
            super(delta)
            for layer in @layers
                layer.draw(delta) if layer?

    class TileLayer extends SpriteEntity
        constructor: (meta) ->
            # @layer_renderers = [
            #     new Renderer(@bounds, null, @z)
            #     new Renderer(@bounds, null, @z)
            #     new Renderer(@bounds, null, @z)
            #     new Renderer(@bounds, null, @z)
            # ]
            super(meta)
            @name   = if meta.name? then meta.name else "#{@id}"
            @layer = if meta.layer? then meta.layer else 0
            
            @on "SELECTED", () ->
                @attr("glow", true)
                @attr("glow_color", "blue")
                @attr("draw_shape", true)
                @attr("stroke_color", "white")
                Hal.tween(@,
                    "line_width",
                    200,
                    1,
                    14.5,
                    5
                )

            @on "DESELECTED", () ->
                @attr("line_width", 1)
                @attr("glow", false)
                @attr("draw_shape", false)

        destroy: (destroy_children = true) ->
            log.debug "destroying myself"
            log.debug @
            @parent.layers[@layer] = null
            super(destroy_children)

    class TileManager
        constructor: (@tilew, @tileh, tileList = "") ->
            @TilesByID = {}
            @TilesByName = {}
            @_id = 0

            Hal.on "TILE_MNGR_NEW_TILE", (tile) =>
                @add(tile)
            Hal.on "TILE_MNGR_LOAD_TILES", (tiles) =>
                @load(tiles)

        loadFromList: (list = "assets/TilesList.list") ->
            Ajax.get "assets/amjad/TilesList.json", (tiles) =>
            log.debug "TileManager loaded tiles."
            tiles = JSON.parse(tiles)
            for k, t of tiles
                @add(t)

        load: (tiles) ->
            log.debug "Loading tiles..."
            log.debug tiles
            for i, t of tiles
                @add(t)

        add: (tile) ->
            tile.id = ++@_id
            @TilesByName[tile.name] = tile
            @TilesByID[tile.id] = tile

        removeByName: (name) ->
            t = @TilesByName[name]
            delete @TilesByID[t.id]
            delete @TilesByName[t.name]
            t = null

        newTileLayer: (meta) ->
            return new TileLayer(meta)

        newTileHolder: (meta) ->
            return new Tile(meta)

        addTileLayerToHolder: (holder, tile, layer) ->
            # tile.attr("draw_bbox", true)
            if not holder? or not tile?
                log.debug "holder or tile is null"
                return
            holder.addTileLayer(tile, layer)




