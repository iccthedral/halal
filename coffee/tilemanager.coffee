"use strict"

define ["shape"], 

(Shape) ->

    class Tile extends Shape
        constructor: (meta) ->
            super(meta)
            @row    = meta.row
            @col    = meta.col
            @layers = [null, null, null, null, null]
            return @

        containsLayer: (layermeta, layer) ->
            layer = layer || layermeta.layer
            layer_present = @layers[layer]?
            if layer_present and @layers[layer].name is layermeta.name
                return true
            return false

        addTileLayer: (layerobj, layer) ->
            if @layers[layer]?
                @layers[layer].destroy()
            @layers[layer] = layerobj
            layerobj.attr("holder", @)
            return layerobj

        init: (meta) ->
            super(meta)
            @on "LAYER_DESTROYED", (layer) ->
                llogd "layer destroyed #{layer}"
                @layers[layer] = null
            return @

        destroy: () ->
            super()
            @destroyMesh()

        destroyMesh: () ->            
            @_mesh = []
            @_numvertices = 0
            return

    class TileLayer extends Shape
        constructor: (meta) ->
            super(meta)
            @setSprite(Hal.asm.getSprite(meta.sprite))
            @name   = if meta.name? then meta.name else "#{@id}"
            @layer  = if meta.layer? then meta.layer else 0

        init: (meta) ->
            super(meta)

            @on "SELECTED", () ->
                console.log "I'm selected: #{@toString()}"

            @on "DESELECTED", () ->
                console.log "I'm deselected: #{@toString()}"

        destroy: (destroy_children = true) ->
            console.log "Destroying myself #{@toString()}"
            if @holder?
                @holder.trigger "LAYER_DESTROYED", @layer
            super()

        toString: () ->
            return "#{@holder.row}, #{@holder.col}"

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

        newTileLayer: (meta, layer) ->
            return new TileLayer(meta, layer)

        newTileHolder: (meta) ->
            return new Tile(meta)

        addTileLayerToHolder: (holder, layermeta, x, y, layer = layermeta.layer) ->
            if holder.containsLayer(layermeta, layer)
                console.warn "You can't add same layer #{layermeta.name} twice"
                return

            if not holder? or not layermeta?
                console.error "Holder or layermeta is null"
                return

            tile = @newTileLayer(layermeta, layer)

            if tile.attr("group") is "default"
                tile.attr("group", "layer_#{layer}")

            tile = holder.addTileLayer(tile, layer)
            tile.setPosition(x, y)
            tile.attr("scene", @map)
            @map.quadtree.insert(tile)
            @map.addEntity(tile)

            return tile