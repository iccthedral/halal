"use strict"

define ["shape"], 

(Shape) ->

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
            layerobj.attr("holder", @)
            @sortLayers()
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

    class TileLayer extends Shape
        constructor: (meta) ->
            super(meta)
            @setSprite(Hal.asm.getSprite(meta.sprite))
            @name   = if meta.name? then meta.name else "#{@id}"
            @layer  = if meta.layer? then meta.layer else 0
            @h      = 0

        init: (meta) ->
            super(meta)
            @on "SELECTED", () ->
                console.log "I'm selected: #{@toString()}"

            @on "DESELECTED", () ->
                console.log "I'm deselected: #{@toString()}"

        destroy: () ->
            # console.log "Destroying myself #{@toString()}"
            super()
            if @holder?
                @holder.removeLayer(@layer)
            delete @holder

        toString: () ->
            return "#{@holder.row}, #{@holder.col}"

    class TileManager
        constructor: (@map, tileList = "") ->
            @tile_layer_map = {}
            @tile_name_map  = {}
            @tile_id_map    = {}
            @_id            = 0
            @max_layers     = @map.max_layers

            Hal.on "TILE_MNGR_NEW_TILE", (tile) =>
                @add(tile)

            Hal.on "TILE_MNGR_LOAD_TILES", (tiles) =>
                @load(tiles)

        loadFromList: (list = "assets/TilesList.list") ->
            Ajax.get "assets/amjad/TilesList.json", (tiles) =>
            llogd "TileManager loaded tiles."
            tiles = JSON.parse(tiles)
            @load(tiles)

        load: (tiles) ->
            llogd "Loading tiles..."
            for i, t of tiles
                @add(t)
            @map.trigger "META_LAYERS_LOADED"

        add: (tile) ->
            @tile_name_map[tile.name] = tile
            @tile_id_map[tile.id]     = tile
            if not @tile_layer_map[tile.layer]?
                @tile_layer_map[tile.layer] = {}
            @tile_layer_map[tile.layer][tile.name] = tile

        getAllByLayer: (layer) ->
            return @tile_layer_map[layer]

        findByName: (name) ->
            t = @tile_name_map[name]
            if not t?
                llogw "No tile with name: #{name}"
            return t

        findById: (id) ->
            t = @tile_id_map[id]
            if not t?
                llogw "No tile with id: #{id}"
            return t

        removeByName: (name) ->
            t = @tile_name_map[name]
            delete @tile_layer_map[t.layer][t.name]
            delete @tile_name_map[t.name]
            delete @tile_id_map[t.id]
            t = null

        removeById: (id) ->
            t = @tile_id_map[id]
            delete @tile_layer_map[t.layer][t.name]
            delete @tile_id_map[t.id]
            delete @tile_name_map[t.name]
            t = null

        newTileLayer: (meta) ->
            return new TileLayer(meta)

        newTileHolder: (meta) ->
            tile_holder = new Tile(meta)
            for p in [0...@max_layers]
                tile_holder.layers.push(null)
            return tile_holder

        addTileLayerToHolderByLayerId: (row, col, layer_id, offset_x = 0, offset_y = 0) ->
            meta = @findById(layer_id)
            return @addTileLayerToHolder(row, col, meta, offset_x, offset_y)

        addTileLayerToHolder: (row, col, layermeta, offset_x = 0, offset_y = 0) ->
            holder = @map.getTile(row, col)
            if not holder?
                lloge "No holder!!!"
                return
            if not layermeta?
                lloge "No layermeta!!!"
                return

            if holder.containsLayer(layermeta)
                llogw "You can't add same layer #{layermeta.name} twice"
                return

            if layermeta.layer > @max_layers
                lloge "You can't have more than #{@max_layers} layers"
                return

            x = (holder.col / 2) * @map.tilew
            y = (holder.row + ((holder.col % 2) / 2)) * @map.tileh

            tile = @newTileLayer(layermeta)

            if tile.attr("group") is "default"
                tile.attr("group", "layer_#{tile.layer}")

            tile = holder.addTileLayer(tile)

            off_x = tile.sprite.w*0.5 - @map.tilew2
            off_y = tile.sprite.h*0.5 - @map.tileh2

            tile.attr("h", off_y)
            tile.setPosition(x, y - off_y)

            ctx = @map.renderer.getLayerContext(tile.layer)
            @map.addEntityToQuadSpace(tile, ctx)
            return tile

    return TileManager