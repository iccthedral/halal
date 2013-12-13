"use strict"

define ["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], 

(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) ->

    class IsometricMap extends Scene
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

            @selected_tile          = null
            @selected_tile_x        = 0
            @selected_tile_y        = @tileh2
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

            super(meta)
            @world_bounds = [0, 0, (@ncols-0.5) * @tilew2, @nrows * @tileh]
            
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

        init: () ->
            super()

            ### @SUPPORTED_EDITOR_MODES ###
            @supported_modes = {}

            @supported_modes["mode-default"] = () =>
                    @processLeftClick()
                    return

            @supported_modes["mode-erase"] = () =>
                @processLeftClick()
                return if not @clicked_layer? or @clicked_layer.animating 
                @clicked_layer.tween(
                    attr: "h"
                    from: 0
                    to: 100
                    duration: 500
                ).tween(
                    attr: "opacity"
                    from: 1
                    to: 0
                    duration: 700
                ).done () -> @destroy()
                @clicked_layer = null
                    
            @supported_modes["mode-place"] = () =>
                return if not @tile_under_mouse?
                @selected_tile_x = @selected_tile_sprite.w2
                @selected_tile_y = @selected_tile_sprite.h - @tileh2
                console.debug @selected_tile_y
                t = @tm.addTileLayerToHolder(
                    @tile_under_mouse.row, @tile_under_mouse.col,
                    @selected_tile, @selected_tile_x, @selected_tile_y #,@selected_tile.layer
                )
                return
                
            @current_mode       = "mode-default"
            @current_mode_clb   = @supported_modes[@current_mode]
            ### @SUPPORTED_EDITOR_MODES ###

            @clicked_layer      = null
            @tile_under_mouse   = null
            @search_range       = @bounds.slice()

            @left_click_listener = 
            Hal.on "LEFT_CLICK", () =>
                @current_mode_clb.call(@)

            ###map editor stuff###
            @editor_mode_listener =
            Hal.on "EDITOR_MODE_CHANGED", (mode) =>
                if @supported_modes[mode]?
                    @current_mode       = mode
                    @current_mode_clb   = @supported_modes[mode]
                else
                    llogw "Mode #{mode} not supported"
                llogd @current_mode

            @layer_selected_listener =
            Hal.on "TILE_LAYER_SELECTED", (tile) =>
                llogd "Tile layer selected from editor"
                llogd tile
                @selected_tile = tile
                @selected_tile_sprite = Hal.asm.getSprite(@selected_tile.sprite)
                @selected_tile_x = @selected_tile_sprite.w2
                @selected_tile_y = @selected_tile_sprite.h - @tileh2

            @mouse_moved_listener =
            Hal.on "MOUSE_MOVE", (pos) =>
                Vec2.copy(@mpos, pos)
                Vec2.release(@world_pos) if @world_pos?
                @world_pos = @screenToWorld(pos)
                t = @getTileAt(@world_pos)
                if t isnt @tile_under_mouse
                    if @tile_under_mouse
                        @tile_under_mouse.drawableOffState(Hal.DrawableStates.Fill)
                    @tile_under_mouse = t
                    if @tile_under_mouse?
                        @tile_under_mouse.drawableOnState(Hal.DrawableStates.Fill)

            @initSections()
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

        getTile: (row, col, dir=[0,0]) ->
            return @map[(col+dir[1]) + (row+dir[0]) * @ncols]

        getTileAt: (pos) ->
            coord = @toOrtho(pos)
            if (coord[0] < 0.0 || coord[1] < 0.0 || coord[1] >= @nrows || coord[0] >= @ncols)
                return null
            return @map[Math.floor(coord[0]) + Math.floor(coord[1]) * @ncols]

        initSections: () ->
            @section_center = []

        loadCenterSection: () ->

        initMap: () ->
            @clicked_layer = null
            @tm = new TileManager(@)
            @map = new Array(@nrows * @ncols)
            k = 0
            t1 = performance.now()
            for i in [0..@nrows-1]
                for j in [0..@ncols - 1]
                    x = (j / 2) * @tilew
                    y = (i + ((j % 2) / 2)) * @tileh
                    t = @tm.newTileHolder
                        "shape": @iso_shape
                        "x": x
                        "y": y
                        "row": i
                        "col": j
                    @map[k] = @addEntity(t)
                    k++
            t2 = performance.now() - t1
            llogd "it took: #{t1}"

        saveBitmapMap: () ->
            out = []
            tiles = @map.slice()
            map_r = @nrows << 32
            map_c = @ncols << 16
            out.push (map_r | map_c)
            for t in tiles
                t_row = t.row << 32
                t_col = t.col << 16
                out.push (t_row | t_col)
                for layer in t.layers
                    if not layer?
                        out.push -1
                        continue
                    meta = @tm.findByName(layer.name)
                    meta_id = meta.id << 32
                    h = layer.h << 16
                    out.push (h | meta_id)

            @trigger "MAP_SAVED", out
            return out

        loadBitmapMap: () ->
            return

        processLeftClick: () ->
            if @clicked_layer?
                @clicked_layer.trigger "DESELECTED"
                @clicked_layer = null
            t1 = performance.now()
            for layer in @quadtree.findEntitiesInRectangle(@search_range, @transform())
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
            llogd "searching took: #{t2.toFixed(2)} ms"

            if @clicked_layer?
                @trigger "LAYER_SELECTED", @clicked_layer
                @clicked_layer.trigger "SELECTED"
                if not @clicked_layer.tweener.animating 
                    @clicked_layer.tween
                        attr: "position[1]"
                        from: @clicked_layer.position[1]
                        to: @clicked_layer.position[1] - 10
                        duration: 300
                    .done () ->
                        @tween
                            attr: "position[1]"
                            from: @position[1]
                            to: @position[1] + 10
                            duration: 300

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

            if @current_mode is "mode-place"
                return if not @selected_tile? or not @tile_under_mouse?
                @ctx.globalAlpha = 0.5
                @ctx.drawImage(@selected_tile_sprite.img, @tile_under_mouse.position[0] - @selected_tile_x, @tile_under_mouse.position[1] - @selected_tile_y)
                @ctx.globalAlpha = 1.0

        destroy: () ->
            ### @todo @tm.destroy() ###
            Vec2.release(@mpos)
            Vec2.release(@world_pos)
            Hal.removeTrigger "EDITOR_MODE_CHANGED", @editor_mode_listener
            Hal.removeTrigger "TILE_LAYER_SELECTED", @layer_selected_listener
            Hal.removeTrigger "MOUSE_MOVE", @mouse_moved_listener
            Hal.removeTrigger "LEFT_CLICK", @left_click_listener
            super()

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
        saveMap: () ->
            for tile in @map
                console.debug tile.binaryFormat()


    return IsometricMap