"use strict"

define ["shape"], 

(Shape) ->

    class Tile extends Shape
        constructor: (meta) ->
            super(meta)
            @row    = meta.row
            @col    = meta.col
            @layers = [null, null, null, null, null]

        addTileLayer: (tile, layer) ->
            layer = layer || tile.layer
            layer_present = @layers[layer]?
            
            if layer_present and @layers[layer].name is tile.name
                llogd "You're trying to add the same layer"
                return

            if layer_present
                @layers[layer].destroy()
            
            @layers[layer] = tile
            # ent = @addEntityToQuadspace(tile)
            # ent.attr("shape", @shape)
            # ent.attr("draw_shape", false)
            return ent

        init: () ->
            super()
            # @drawableOffState(@DrawableStates.Stroke)
            @on "LAYER_DESTROYED", (layer) ->
                llogd "layer destroyed #{layer}"
                @layers[layer] = null
            return @

        destroy: (destroy_children = false) ->
            @parent.trigger "ENTITY_DESTROYED", @
            super(destroy_children)

    class TileLayer extends Shape
        constructor: (meta) ->
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
            llogd "destroying myself"
            llogd @
            if @parent?
                @parent.trigger "LAYER_DESTROYED", @layer
            super(destroy_children)

    class TileManager
        constructor: (@map, tileList = "") ->
            @tile_layer_map = {}
            @tile_name_map = {}
            @_id = 0

            Hal.on "TILE_MNGR_NEW_TILE", (tile) =>
                @add(tile)
            Hal.on "TILE_MNGR_LOAD_TILES", (tiles) =>
                @load(tiles)

        loadFromList: (list = "assets/TilesList.list") ->
            Ajax.get "assets/amjad/TilesList.json", (tiles) =>
            llogd "TileManager loaded tiles."
            tiles = JSON.parse(tiles)
            for k, t of tiles
                @add(t)

        load: (tiles) ->
            llogd "Loading tiles..."
            llogd tiles
            for i, t of tiles
                @add(t)

        add: (tile) ->
            tile.id = ++@_id
            @tile_name_map[tile.name] = tile
            if not @tile_layer_map[tile.layer]?
                @tile_layer_map[tile.layer] = {}

            @tile_layer_map[tile.layer][tile.name] = tile

        removeByName: (name) ->
            t = @tile_name_map[name]
            delete @tile_layer_map[t.layer][t.name]
            delete @tile_name_map[t.name]
            t = null

        newTileLayer: (meta) ->
            return new TileLayer(meta)

        newTileHolder: (meta) ->
            # meta.parent = @map
            return new Tile(meta)

        addTileLayerToHolder: (holder, tile, layer = tile.layer, x_offset = 0, y_offset = 0) ->
            if not holder? or not tile?
                llogd "holder or tile is null"
                return

            if tile.attr("group") is "default" 
                tile.attr("group", "layer_#{layer}")

            llogd "x_offset: #{x_offset}"
            llogd "y_offset: #{y_offset}"

            tile = holder.addTileLayer(tile, layer)
            return if not tile?

            # pos = holder.worldToLocal(@map.localToWorld([x_offset - @map.tilew2, y_offset - @map.tileh2]))
            # llogd pos

            llogd x_offset
            llogd y_offset
            
            # tile.attr("w", x_offset)
            # tile.attr("h", y_offset)

            return tile