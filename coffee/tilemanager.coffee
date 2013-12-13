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

        getLayers: () ->
            out = []
            for l in @layers
                out.push l if l?
            return out

        init: (meta) ->
            super(meta)
            @on "LAYER_DESTROYED", (layer) ->
                llogd "layer destroyed #{layer}"
                @layers[layer] = null
            return @

        destroyMesh: () -> 
            @_mesh = null #zato sto deli mesh sa svim tajlovima
            super()
            return

    class TileLayer extends Shape
        constructor: (meta) ->
            super(meta)
            console.log "tile layer konstruktor"
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
            @tile_id_map = {}
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
                console.log t.name
                console.log t.id
                @add(t)
            @map.renderer.createLayers [-1, -2, -3, -4, -5]

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

        newTileLayer: (meta, layer) ->
            return new TileLayer(meta, layer)

        newTileHolder: (meta) ->
            return new Tile(meta)

        addTileLayerToHolder: (row, col, layermeta, offset_x, offset_y, layer = layermeta.layer) ->
            holder = @map.getTile(row, col)
            if not holder?
                lloge "No holder!!!"
                return
            if not layermeta?
                console.error "No layermeta!!!"
                return

            if holder.containsLayer(layermeta, layer)
                console.warn "You can't add same layer #{layermeta.name} twice"
                return

            x = (holder.col / 2) * @map.tilew
            y = (holder.row + ((holder.col % 2) / 2)) * @map.tileh

            tile = @newTileLayer(layermeta, layer)

            if tile.attr("group") is "default"
                tile.attr("group", "layer_#{layer}")

            console.log offset_y
            console.log offset_x

            tile = holder.addTileLayer(tile, -(layer + 1))

            off_x = tile.sprite.w*0.5 - @map.tilew2
            off_y = tile.sprite.h*0.5 - @map.tileh2

            tile.attr("h", off_y)
            tile.setPosition(x, y - off_y)

            llogd "Adding to layer: #{layer}"
            ctx = @map.renderer.getLayerContext(layer)
            @map.addEntityToQuadSpace(tile, ctx)

            return tile

        saveMap: () ->


        loadMap: (bitarray) ->
            mask = 0xFFFF
            qword = bitarray.shift()
            map_r = (qword >> 32) & mask
            map_c = (qword >> 16) & mask

            @map.
            # console.debug "rows: #{map_r}, cols: #{map_c}"

