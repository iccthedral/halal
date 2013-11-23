"use strict"

define ["scene", "spriteentity", "entity", "tilemanager"], 

(Scene, SpriteEntity, Entity, TileManager) ->

    class IsometricMap extends Scene
        constructor: (meta) ->
            @tilew          = meta.tilew
            @tileh          = meta.tileh
            @nrows          = meta.rows
            @ncols          = meta.cols

            @tm             = new TileManager(@tilew, @tileh)

            @tilew2prop     = 2 / @tilew
            @tileh2prop     = 2 / @tileh
            @tilew2         = @tilew / 2
            @tileh2         = @tileh / 2
            @map            = []
            @total_rendered = 0

            @translate_x    = 0
            @max_rows       = @nrows - 1
            @max_cols       = @ncols - 1

            @selected_tile  = null
            @old_camx       = 0

            @supported_modes = 
                "mode-default": () =>
                    @processMouseClick()
                    return
                "mode-erase": () =>
                    #treba tintovati sliku nad kojom hoverujemo
                    # @tm.addTileLayerToHolder
                    @processMouseClick()
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
                    
                "mode-place": () =>
                    @tm.addTileLayerToHolder(
                        @tile_under_mouse, 
                        @tm.newTileLayer(@selected_tile)
                    )
                    return

            @camera_moved = false

            @current_mode   = @supported_modes["mode-default"]

            meta.cam_bounds = [@tilew2, @tileh2, @ncols * @tilew2, (@nrows-0.5) * @tileh]
            super(meta)

            @iso_shape = [
                [-@tilew2, 0],
                [0, @tileh2],
                [@tilew2, 0],
                [0, -@tileh2]
            ]

            @display = {
                startr: 0
                endr: 0
                startc: 0
                endc: 0
            }

            @info = {
                row: "row: "
                col: "col: "
                tilename: "tile: "
                start_row: "starting row: "
                start_col: "staring col: "
                end_row: "end row: "
                end_col: "end_col: "
                tile_x: "tile_x: "
                tile_y: "tile_y: "
                num_rendering: "no. rendereded entities: "
                cam_mouse: "camera_mouse: "
            }

            @mask           = Hal.asm.getSprite("test/tilemask_128x64")
            hittest         = Hal.dom.createCanvas(@tilew, @tileh).getContext("2d")
            hittest.drawImage(@mask.img, 0, 0)
            @mask_data      = hittest.getImageData(0, 0, @tilew, @tileh).data
            for i,j in @mask_data
                @mask_data[j] = i < 120

            @over = {
                 "green": Hal.asm.getSprite("test/grid_unit_over_green_128x64")
                 "red": Hal.asm.getSprite("test/grid_unit_over_red_128x64")
            }

            @last_clicked_layer = null
            @tile_under_mouse   = null
            @search_range       = @bounds[2] * 0.5

        showRegion: (pos, range_row, range_col) ->
            c = @getTileAt(@worldToLocal(pos))
            if not c?
                return
            c_row = c.row
            c_col = c.col

            if c_col % 2 is 0
                range_row -= 1

            t_left = @getTile(
                Hal.math.clamp(c_row - range_row, c_row, @nrows - 1)
                ,
                Hal.math.clamp(c_col - range_col, c_col, @ncols - 1)
            )
            b_right = @getTile(
                Hal.math.clamp(c_row + range_row, c_row, @nrows - 1)
                ,
                Hal.math.clamp(c_col + range_col, c_col, @ncols - 1)
            )
            t_right = @getTile(
                Hal.math.clamp(c_row - range_row, c_row, @nrows - 1)
                ,
                Hal.math.clamp(c_col + range_col, c_col, @ncols - 1)
            )
            b_left = @getTile(
                Hal.math.clamp(c_row + range_row, c_row, @nrows - 1)
                ,
                Hal.math.clamp(c_col - range_col, c_col, @ncols - 1)
            )

            if not (t_left? and t_right? and b_left? and b_right?)
                return

            shape = [
                t_left.x - (t_right.x - t_left.x)
                t_left.y - (b_right.y - t_left.y)
                (t_right.x - t_left.x) * 2
                (b_right.y - t_left.y) * 2
            ]
            @g.strokeRect(shape, "cyan")


        drawStat: () ->
            super()
            if @tile_under_mouse?
                @g.ctx.fillText(@info.row + @tile_under_mouse.row, 0, 195)
                @g.ctx.fillText(@info.col + @tile_under_mouse.col, 0, 210)
                @g.ctx.fillText(@info.tile_x + @tile_under_mouse.x, 0, 225)
                @g.ctx.fillText(@info.tile_y + @tile_under_mouse.y, 0, 240)

            @g.ctx.fillText(@info.start_row + @display.startr, 0, 115)
            @g.ctx.fillText(@info.start_col + @display.startc, 0, 130)
            @g.ctx.fillText(@info.end_row + @display.endr, 0, 145)
            @g.ctx.fillText(@info.end_col + @display.endc, 0, 160)
            @g.ctx.fillText(@info.num_rendering + @total_rendered, 0, 175)
            @g.ctx.fillText(@info.cam_mouse + "#{-@camera.x + @mpos[0]}, #{-@camera.y + @mpos[1]}", 0, 255)

        init: () ->
            super()

            ###
                @todo: Ovo posle treba ukloniti!
            ###
            @camera.on "CHANGE", () =>
                @calcDrawingArea()

            Hal.on "LEFT_CLICK", () =>
                @current_mode()

            ###map editor stuff###
            Hal.on "EDITOR_MODE_CHANGED", (mode) =>
                if @supported_modes[mode]
                    @current_mode = @supported_modes[mode]
                else
                    log.warn "Mode #{mode} not supported"
                log.debug mode

            Hal.on "TILE_LAYER_SELECTED", (tile) =>
                log.debug "Tile layer selected from editor"
                log.debug tile
                @selected_tile = tile     

            Hal.on "RIGHT_CLICK", (pos) =>
                return if @paused
                @camera.lerpTo(@localToWorld(@world_pos))

            @on "ENTITY_DESTROYED", (ent) =>
                ind = @map.indexOf(ent)
                if ind is -1
                    log.debug "oh shit, no such entity #{ent.id}"
                else
                    @map[ind] = null

            # @camera.on "ZOOM", (zoom) =>
            #     cam_bounds = [@tilew2, @tileh2, (@ncols-1) * @tilew2*zoom, (@nrows-0.5) * @tileh*zoom]
            #     @camera.setViewFrustum(cam_bounds)

            Hal.on "MOUSE_MOVE", (pos) =>
                t = @getTileAt(@worldToLocal(pos))
                if t isnt @tile_under_mouse
                    if @tile_under_mouse
                        @tile_under_mouse.attr("line_width", 1)
                        @tile_under_mouse.attr("glow", false)
                        @tile_under_mouse.attr("draw_shape", false)
                    @tile_under_mouse = t                   
                    if t?
                        t.attr("glow", true)
                        t.attr("draw_shape", true)
                        t.attr("stroke_color", "white")
                        Hal.tween(t,
                            "line_width",
                            400,
                            1,
                            3.5,
                            1
                        )#.then () ->
                        #    @attr("line_width", 1)
                        #    @attr("glow", false)
                        #    @attr("draw_shape", false)
                #else


            @initMap()

        draw: (delta) ->
            # return
            return if @paused
            super()
            @total_rendered = 0

            for i in [@display.startr..@display.startr + @display.endr]
                for j in [@display.startc..@display.endc + @display.startc]
                    tile = @map[j + i*@ncols]
                    if not tile?
                        continue

                    # if not @camera.isVisible(tile) and not tile.layers[3]?
                    #     continue
                    tile.update(delta)
                    #if @camera_moved
                    #@g.ctx.translate(@camera.x + @old_camx, 0)
                    #tile.attr("x", tile.attr("x") - @translate_x)
                    #tile.attr("x")
                    tile.draw(delta)
                    @total_rendered++

            @camera_moved = false

            @g.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3],
                @local_matrix[1],
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )

            @showRegion(@mpos, 3, 3)

            # if @draw_quadspace
            #     @drawQuadSpace(@quadspace)
            #     @g.strokeRect(@camera.view_frustum, "green")

            # @g.ctx.setTransform(1, 0, 0, 1, -@search_range*@camera.zoom, -@search_range*@camera.zoom)
            # @g.strokeRect([
            #    @mpos[0], 
            #    @mpos[1], 
            #    2*@search_range*@camera.zoom, 
            #    2*@search_range*@camera.zoom  
            # ], "red")

        calcDrawingArea: () ->
            ### mozda da pomerim granicu, jel da? ###
            #@translate_x = @camera.x / @tilew2
            @old_camx = @camera.x
            if (@camera.x % @tilew2) is 0
                log.debug "oh jea"
                @camera_moved = true

            top_left = @getTileAt(@worldToLocal([0, 0]))
            if not top_left?
                sc = 0
                sr = 0
            else 
                sc = top_left.col
                sr = top_left.row

            @display = {
                startc: sc
                endr: @maxRows()
                startr: sr
                endc: @maxCols()
            }

        maxRows: () ->
            return Math.min(@nrows-1, Math.round((@bounds[3] / (@tileh * @camera.zoom)) + 4))

        maxCols: () ->
            return Math.min(@ncols-1, Math.round((@bounds[2] / (@tilew2 * @camera.zoom)) + 4))

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

        initMap: () ->
            @clicked_layer = null

            log.debug "max rows: #{@maxRows()}"
            log.debug "max cols: #{@maxCols()}"
            log.debug "total at this resolution: #{@maxRows() * @maxCols()}"

            @max_rows = @maxRows()
            @max_cols = @maxCols()

            @map = new Array(@nrows * @ncols)
            #@map = new Array(@nrows * @ncols)
            k = 0
            t1 = performance.now()
            for i in [0..@nrows-1] #@max_rows - 1] #@nrows-1]
                for j in [0..@ncols - 1] #@ncols-1]
                    x = (j / 2) * @tilew
                    y = (i + ((j % 2) / 2)) * @tileh
                    #@map[k] = [x, y]
                    # ++k
                    t = @tm.newTileHolder(
                        "shape": @iso_shape
                        "draw_shape": false
                        "x": x
                        "y": y
                        "row": i
                        "col": j
                        "visible_sprite": true
                        "sprite": "test/grid_unit_128x64"
                    )
                    @map[k] = @addEntity(t)
                    k++
                        # row: i
                        # col: j
                        # x: x
                        # y: y #@addEntity(t)

            t2 = performance.now() - t1
            log.debug "it took: #{t1}"
            @calcDrawingArea()
            @camera.trigger "CHANGE"

        processMouseClick: () ->
            if @clicked_layer?
                @clicked_layer.trigger "DESELECTED"
                @clicked_layer = null

            t = performance.now()
            ents = @quadspace.searchInRange(@world_pos, @search_range, @)
            t1 = performance.now() - t
            log.info t1
            log.info ents.length

            for tile in ents
                if not tile.inShapeBounds(@world_pos)
                    continue
                log.debug tile
                if not @clicked_layer?
                    @clicked_layer = tile
                else
                    if (tile.parent.col == @clicked_layer.parent.col) and (tile.parent.row == @clicked_layer.parent.row)
                        if tile.layer > @clicked_layer.layer
                            @clicked_layer = tile
                    else if (tile.parent.row == @clicked_layer.parent.row)
                        if (tile.h + tile.y > @clicked_layer.h + @clicked_layer.y)
                            @clicked_layer = tile
                    else if (tile.parent.col == @clicked_layer.parent.col)
                        if (tile.h + tile.y > @clicked_layer.h + @clicked_layer.y)
                            @clicked_layer = tile
                    else if (tile.parent.col != @clicked_layer.parent.col) and (tile.parent.row != @clicked_layer.parent.row)
                        if (tile.h + tile.y > @clicked_layer.h + @clicked_layer.y)
                            @clicked_layer = tile

            if @clicked_layer?
                log.debug "clicked layer"
                log.debug @clicked_layer
                @trigger "LAYER_SELECTED", @clicked_layer
                @clicked_layer.trigger "LEFT_CLICK"

        splitMap: () ->
            map =
                nw: null
                ns: null
                s: null
                w: null
                e: null
                n: null
                sw: null
                se: null
                c: null

        loadRandomMap: (i, data) ->
            for i in [0..@ncols-1]
                for j in [0..@nrows-1]
                    t = @getTile(i, j)
                    k = 5
                    while k > 0 and not t.isFull()
                        @addRandomLayer(t)
                        --k

        addRandomLayer: (t) ->
            tskeys = Object.keys(@tmngr.Tiles)
            #log.debug tskeys
            randts = ~~(Math.random() * tskeys.length)
            #log.debug randts
            index = tskeys[randts]
            tiles = amj.tmngr.Tiles[index]
            #log.debug tiles
            tkeys = Object.keys(tiles)
            randt = ~~(Math.random() * tkeys.length)
            index = tkeys[randt]
            tileLayer = tiles[index]
            #log.debug tileLayer
            #log.debug tileLayer
            # hw = [0,0]
            # spr = Hal.asm.getSprite(tileLayer.sprite)
            # #log.debug spr
            # @calcCenterAdjPos(hw, spr)
            # #log.debug hw
            # area = @getSpanArea(t, tileLayer.size)
            # if @canBePlacedOn(area, @layers[tileLayer.level])
            #     return t.addLayer(tileLayer.name, hw, true)
        
        genRandomMap: () ->

            #split Map in 8 regions
            
    return IsometricMap