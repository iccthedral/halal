"use strict"

define ["tile", "tilelayer"], 

(Tile, TileLayer) ->

    class TileManager
        constructor: (@map, tileList = "") ->
            @tile_layer_map = {}
            @tile_name_map  = {}
            @tile_id_map    = {}
            @markers        = []
            @_id            = 0
            @max_layers     = @map.max_layers

            Hal.on "TILE_MNGR_NEW_TILE", (tile) =>
                @add(tile)

            Hal.on "TILE_MNGR_LOAD_MARKERS", (markers) =>
                @loadMarkers(markers)

            Hal.on "TILE_MNGR_NEW_MARKER", (marker) =>
                @addMarker(marker)

            Hal.on "TILE_MNGR_LOAD_TILES", (tiles) =>
                @load(tiles)

        loadMarkers: (markers) ->
            for marker in markers
                @addMarker(marker)
            @map.trigger "TM_MARKERS_LOADED"

        addMarker: (marker) ->
            if @markers.indexOf(marker) is -1
                @markers.push(marker)
            else
                llogw "Marker #{marker} exists!"

        loadFromList: (list = "assets/tiles.list") ->
            Ajax.get list, (tiles) =>
            llogd "TileManager loaded tiles."
            tiles = JSON.parse(tiles)
            @load(tiles)

        load: (tiles) ->
            llogd "Loading tiles..."
            for i, t of tiles
                @add(t)
            @map.trigger "TM_TILES_LOADED"

        add: (tile) ->
            t = @tile_name_map[tile.name]
            if t?
                delete @tile_layer_map[t.layer][t.name]
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

        newTile: (meta) ->
            tile = new Tile(meta)
            for p in [0...@max_layers]
                tile.layers.push(null)
            return tile

        addTileLayerMetaByLayerId: (row, col, layer_id, offset_x = 0, offset_y = 0) ->
            meta = @findById(layer_id)
            return @addTileLayerMeta(row, col, meta, offset_x, offset_y)

        addTileLayerInstance: (row, col, tilelayerobj, override) ->
            tile = @map.getTile(row, col)
            if not tile?
                lloge "No tile at #{row}:#{col}!!!"
                return

            layermeta = tilelayerobj.meta

            if not layermeta?
                lloge "No layermeta!!!"
                return
            if tile.containsLayer(layermeta) and not override
                llogw "You can't add same layer #{layermeta.name} twice"
                return
            if layermeta.layer > @max_layers
                lloge "You can't have more than #{@max_layers} layers"
                return

            x = (tile.col / 2) * @map.tilew
            y = (tile.row + ((tile.col % 2) / 2)) * @map.tileh

            tile.addTileLayer(tilelayerobj)

            off_x = tile.sprite.w*0.5 - @map.tilew2
            off_y = tile.sprite.h*0.5 - @map.tileh2

            tilelayerobj.attr("h", off_y)
            tilelayerobj.setPosition(x, y - off_y)

            ctx = @map.renderer.getLayerContext(tilelayerobj.layer)
            @map.addEntityToQuadSpace(tilelayerobj, ctx)
            tilelayerobj.trigger "ON_MAP"
            # console.debug ctx
            return tile

        addTileLayerMeta: (row, col, layermeta, offset_x = 0, offset_y = 0) ->
            tile = @map.getTile(row, col)
            if not tile?
                lloge "No holder!!!"
                return

            if not layermeta?
                lloge "No layermeta!!!"
                return

            if tile.containsLayer(layermeta)
                llogw "You can't add same layer #{layermeta.name} twice"
                return

            if layermeta.layer > @max_layers
                lloge "You can't have more than #{@max_layers} layers"
                return

            x = (tile.col / 2) * @map.tilew
            y = (tile.row + ((tile.col % 2) / 2)) * @map.tileh

            layerobj = @newTileLayer(layermeta)
            if not layerobj.sprite?
                console.error "No sprite available for given tile: #{layermeta.name}"
                layerobj.destroy()
                return

            tile.addTileLayer(layerobj)
            
            off_x = layerobj.sprite.w*0.5 - @map.tilew2
            off_y = layerobj.sprite.h*0.5 - @map.tileh2

            layerobj.attr("h", off_y)
            layerobj.setPosition(x, y - off_y)

            ctx = @map.renderer.getLayerContext(layerobj.layer)
            @map.addEntityToQuadSpace(layerobj, ctx)            
            layerobj.trigger "ON_MAP"
            return layerobj

        loadTileLayerById: (tile, id) ->
            @addTileLayerMetaByLayerId(tile.row, tile.col, id)

    return TileManager