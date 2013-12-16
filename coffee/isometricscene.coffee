"use strict"

define ["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], 

(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) ->

    class IsometricScene extends Scene
        constructor: (meta) ->
            super(meta)

            @tilew2prop             = 2 / @tilew
            @tileh2prop             = 2 / @tileh
            @tilew2                 = @tilew / 2
            @tileh2                 = @tileh / 2
            @map                    = []
            @mpos                   = Vec2.from(0, 0)
            @world_pos              = Vec2.from(0, 0)
            @max_rows               = @nrows - 1
            @max_cols               = @ncols - 1

            @selected_tile_x        = 0
            @selected_tile_y        = @tileh2
            @selected_tile          = null
            @selected_tile_sprite   = null

            ### Isometric shape ###
            @iso_shape = [
                Vec2.from(-@tilew2, 0),
                Vec2.from(0, @tileh2),
                Vec2.from(@tilew2, 0),
                Vec2.from(0, -@tileh2)
            ]

            @info =
                row: "Row: "
                col: "Col: "
                tilename: "Tile: "
                mouse_position: "Mouse position: "
                tile_under_mouse: "Tile position: "
                world_position: "Mouse world position: "

            ### Create iso transparency mask ###
            @mask           = Hal.asm.getSprite("test/tilemask_128x64")
            hittest         = Hal.dom.createCanvas(@tilew, @tileh).getContext("2d")
            hittest.drawImage(@mask.img, 0, 0)
            @mask_data      = hittest.getImageData(0, 0, @tilew, @tileh).data
            for i,j in @mask_data
                @mask_data[j] = i < 120

            @mouse_over_sprites =
                 "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64")
                 "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")

            @world_bounds = [0, 0, (@ncols - 1) * @tilew2, (@nrows-0.5) * @tileh]

        drawStat: () ->
            super()
            if @tile_under_mouse?
                Hal.glass.ctx.fillText(@info.mouse_position + Vec2.str(@mpos) , 0, 130)   
                Hal.glass.ctx.fillText(@info.row + @tile_under_mouse.row, 0, 145)
                Hal.glass.ctx.fillText(@info.col + @tile_under_mouse.col, 0, 160)
                Hal.glass.ctx.fillText(@info.tile_under_mouse + Vec2.str(@tile_under_mouse.position), 0, 175) 
                Hal.glass.ctx.fillText(@info.world_position + Vec2.str(@world_pos) , 0, 190)    

        parseMeta: (meta) ->
            super(meta)
            @tilew = 
                meta.tilew
            @tileh = 
                meta.tileh
            @nrows = 
                +meta.rows
            @ncols = 
                +meta.cols
            @max_layers = 
                meta.max_layers or 5

        init: () ->
            super()
            ### @SUPPORTED_EDITOR_MODES ###
            @clicked_layer      = null
            @tile_under_mouse   = null
            @search_range       = @bounds.slice()
            @initMap()

        #max rows on screen
        maxRows: () ->
            return Math.min(@nrows-1, Math.round((@bounds[3] / (@tileh * @scale[0])) + 4))
        
        #max cols on screen
        maxCols: () ->
            return Math.min(@ncols-1, Math.round((@bounds[2] / (@tilew2 * @scale[1])) + 4))

        toOrtho: (pos) ->
            coldiv  = ((pos[0] + @tilew2) * @tilew2prop)
            rowdiv  = ((pos[1] + @tileh2) * @tileh2prop)
            off_x   = ~~((pos[0] + @tilew2) - ~~(coldiv * 0.5) * @tilew)
            off_y   = ~~((pos[1] + @tileh2) - ~~(rowdiv * 0.5) * @tileh)
            transp  = @mask_data[(off_x + @tilew * off_y) * 4 + 3]
            return [
                coldiv - (transp ^ !(coldiv & 1)),
                (rowdiv - (transp ^ !(rowdiv & 1))) / 2
            ]

        getNeighbours: (tile) ->
            out = []
            return out if not tile?
            for dir in Object.keys(tile.direction)
                n = @getTile(tile.row, tile.col, tile.direction[dir])
                if n?
                    out.push(n)
            return out  

        findInDirectionOf: (tile, dirstr, len) ->
            if not tile?
                return []
            out = []
            out.push(tile)
            fromr = tile.row
            fromc = tile.col
            dir = tile.direction[dirstr]
            while len > 0
                t = @getTile(fromr, fromc, dir)
                if t?
                    out.push(t)
                    fromr = t.row
                    fromc = t.col
                    dir = t.direction[dirstr]
                else
                    break
                len--
            return out

        isAdjacentTo: (cellA, cellB) ->
            return false if not cellB?
            neighs = @getNeighbours(cellB)
            in_neighs = neighs.some (el) ->
                return el.row is cellA.row and el.col is cellA.col
            return in_neighs

        getTile: (row, col, dir=[0,0]) ->
            return @map[(col+dir[1]) + (row+dir[0]) * @ncols]

        getTileAt: (pos) ->
            coord = @toOrtho(pos)
            if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= @nrows || coord[0] >= @ncols)
                return null
            return @map[Math.floor(coord[0]) + Math.floor(coord[1]) * @ncols]

        initMapTiles: () ->
            @pause()
            @section_center = []
            z_indices = []
            z_indices.push z for z in [1..@max_layers]
            @renderer.createLayers z_indices
            @map = new Array(@nrows * @ncols)
            k = 0
            t1 = performance.now()
            for i in [0..@nrows-1]
                for j in [0..@ncols - 1]
                    x = (j / 2) * @tilew
                    y = (i + ((j % 2) / 2)) * @tileh
                    t = @tm.newTile
                        "shape": @iso_shape
                        "x": x
                        "y": y
                        "row": i
                        "col": j
                    @map[k] = @addEntity(t)
                    k++
            t2 = performance.now() - t1
            llogd "Initializing sections took: #{t2} ms"
            @resume()

        initMap: () ->
            @clicked_layer = null
            @on "TILE_MANAGER_LOADED", () ->
                @loadMap()
            @tm = new TileManager(@)

        saveBitmapMap: () ->
            @pause()
            t1 = performance.now()
            out = []
            tiles = @map.slice()
            map_r = @nrows << 32
            map_c = @ncols << 16
            out.push (map_r | map_c)
            for t in tiles
                t_row = t.row << 32
                t_col = t.col << 16
                out.push (t_row | t_col)
                for layer_ind in [0...@max_layers]
                    layer = t.layers[layer_ind]
                    if not layer?
                        out.push -1
                        continue
                    meta = @tm.findByName(layer.name)
                    meta_id = meta.id << 32
                    h = layer.h << 16
                    out.push (h | meta_id)
            t2 = performance.now() - t1
            @resume()
            console.info "Saving took: #{t2} ms"
            @trigger "SECTION_SAVED", out
            return out

        # 54 bita fore da sacuvam informacije o tajlu
        # na pocetku mi treba velicina rows, cols
        # pa onda ide sekcija koju ucitavam, neka bude 200*200 za pocetak
        # treba mi id sa kojim se povezujem sa tile menadzerom
        
        # treba mi row, col koji je tile
        # id za tilelayer 0, height
        # id za tilelayer 1 height
        # i tako dalje
        # za row, max nek je 2^16 granica, isto i za kol
        # znaci taman stane u 4 bajta
        # za id jednog tajla mi treba maks 2 ^ 16, znaci ostane mi
        # jos toliko za height i ko zna sta jos
        # dogovor je da se sve cita od msb-a ka lsb-u
        # znaci, po 16 citam
        # 2^32 - 1, pa shift u desno za 16  -> procitam map rows, pa
        # jos jednom >> 16, pa map cols
        # pa onda redom, za svaki tajl -> row, col, 
        # pa id, pa height
        loadBitmapMap: (bitmap) ->
            bitmap = bitmap.slice()
            t1 = performance.now()
            @pause()
            mask        = 0xFFFF
            qword       = bitmap.shift()
            map_rows    = (qword >> 32) & mask
            map_cols    = (qword >> 16) & mask
            total       = map_rows * map_cols
            if total > @nrows * @ncols
                console.error "Can't load this bitmap, it's too big"
                @resume()
                return false
            @nrows = map_rows
            @ncols = map_cols
            while (tile_qword = bitmap.shift())?
                tile_row = (tile_qword >> 32) & mask
                tile_col = (tile_qword >> 16) & mask
                tile = @getTile(tile_row, tile_col)
                if not tile?
                    console.warn "Oh snap, something's wrong"
                    console.warn "Trying to recover"
                    continue
                for layer in [0...@max_layers]
                    layer_qword  = bitmap.shift()
                    continue if layer_qword is -1
                    layer_id     = (layer_qword >> 32) & mask
                    layer_height = (layer_qword >> 16) & mask
                    @tm.addTileLayerByLayerId(
                        tile_row,
                        tile_col, 
                        layer_id, 
                        0,
                        layer_height
                    )
            t2 = performance.now() - t1
            @resume()
            console.info "Loading took: #{t2} ms"
            @trigger "MAP_LOADED"
            return true

        loadMap: () ->
            @setWorldBounds(@world_bounds)
            return @initMapTiles()

        processLeftClick: () ->
            if @clicked_layer?
                @clicked_layer.trigger "DESELECTED"
                @clicked_layer = null
            t1 = performance.now()
            for layer in @quadtree.findEntitiesInRectangle(@search_range, @_transform)
                transp = Geometry.transformPoint(@world_pos[0], @world_pos[1], layer.inverseTransform())
                if Hal.im.isTransparent(layer.sprite.img, transp[0] + layer.sprite.w2, transp[1] + layer.sprite.h2)
                    Vec2.release(transp)
                    continue
                Vec2.release(transp)
                if not @clicked_layer?
                    @clicked_layer = layer
                else
                    if (layer.holder.col is @clicked_layer.holder.col) and (layer.holder.row is @clicked_layer.holder.row)
                        if layer.layer > @clicked_layer.layer
                            @clicked_layer = layer
                    else if (layer.holder.row is @clicked_layer.holder.row)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = layer
                    else if (layer.holder.col is @clicked_layer.holder.col)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = layer
                    else if (layer.holder.col isnt @clicked_layer.holder.col) and (layer.holder.row isnt @clicked_layer.holder.row)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = layer

            t2 = performance.now() - t1
            llogd "Searching took: #{t2.toFixed(2)} ms"

            if @clicked_layer?
                @trigger "LAYER_SELECTED", @clicked_layer
                @clicked_layer.trigger "SELECTED"

        draw: (delta) ->
            super(delta)
            @ctx.setTransform(
                @_transform[0],
                @_transform[3],
                @_transform[1],
                @_transform[4],
                @_transform[2],
                @_transform[5]
            )
            @drawQuadTree(@quadtree)

        destroy: () ->
            ### @todo @tm.destroy() ###
            Vec2.release(@mpos)
            Vec2.release(@world_pos)
            Hal.removeTrigger "MOUSE_MOVE", @mouse_moved_listener
            Hal.removeTrigger "LEFT_CLICK", @left_click_listener
            super()

        initListeners: () ->
            super()
            @mouse_moved_listener =
            Hal.on "MOUSE_MOVE", (pos) =>
                Vec2.copy(@mpos, pos)
                Vec2.release(@world_pos) if @world_pos?
                @world_pos = @screenToWorld(pos)
                @tile_under_mouse = @getTileAt(@world_pos)
            return

    return IsometricScene