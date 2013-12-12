"use strict"

define ["scene", "shape", "tilemanager", "quadtree", "geometry", "vec2"], 

(Scene, Entity, TileManager, QuadTree, Geometry, Vec2) ->

    class IsometricMap extends Scene
        constructor: (meta) ->
            @tilew          = meta.tilew
            @tileh          = meta.tileh
            @nrows          = +meta.rows
            @ncols          = +meta.cols

            @tm             = new TileManager(@)

            @tilew2prop     = 2 / @tilew
            @tileh2prop     = 2 / @tileh
            @tilew2         = @tilew / 2
            @tileh2         = @tileh / 2
            @map            = []

            @translate_x    = 0
            @max_rows       = @nrows - 1
            @max_cols       = @ncols - 1

            @selected_tile          = null
            @selected_tile_x        = 0
            @selected_tile_y        = 0
            @selected_tile_sprite   = null

            @old_camx       = 0

            @on_exit_frame  = null

            @supported_modes = 
                "mode-default": () =>
                    @processMouseClick()
                    return
                "mode-erase": () =>
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
                    return if not @tile_under_mouse?
                    t = @tm.addTileLayerToHolder(
                        @tile_under_mouse,
                        @selected_tile,
                        @tile_under_mouse.position[0], 
                        @tile_under_mouse.position[1] #,@selected_tile.layer
                    )
                    return

            @camera_moved       = false
            @current_mode       = "mode-default"
            @current_mode_clb   = @supported_modes[@current_mode]
            
            @world_bounds   = [0, 0, (@ncols-1) * @tilew2, (@nrows-0.5) * @tileh]
            
            llogd "camera bounds: #{meta.world_bounds}"

            @iso_shape = [
                Hal.Vec2.from(-@tilew2, 0),
                Hal.Vec2.from(0, @tileh2),
                Hal.Vec2.from(@tilew2, 0),
                Hal.Vec2.from(0, -@tileh2)
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
                start_col: "starting col: "
                end_row: "end row: "
                end_col: "end_col: "
                tile_under_mouse: "Tile position: "
                world_pos: "Mouse world position: "
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

            super(meta)

        drawStat: () ->
            super()
            if @tile_under_mouse?
                Hal.glass.ctx.fillText(@info.row + @tile_under_mouse.row, 0, 195)
                Hal.glass.ctx.fillText(@info.col + @tile_under_mouse.col, 0, 210)
                Hal.glass.ctx.fillText(@info.tile_under_mouse + Vec2.str(@tile_under_mouse.position), 0, 225)
                Hal.glass.ctx.fillText(@info.world_pos + Vec2.str(@world_pos) , 0, 240)        

        screenToWorld: (point) ->
            return Geometry.transformPoint(point[0], point[1], @inverseTransform())

        init: (meta) ->
            super(meta)

            @last_clicked_layer = null
            @tile_under_mouse   = null
            @quadtree           = new QuadTree(@world_bounds)
            @search_range       = [0, 0, @bounds[2], @bounds[3]]

            Hal.on "LEFT_CLICK", () =>
                @current_mode_clb()

            ###map editor stuff###
            Hal.on "EDITOR_MODE_CHANGED", (@current_mode) =>
                if @supported_modes[@current_mode]
                    @current_mode_clb = @supported_modes[@current_mode]
                else
                    llogw "Mode #{mode} not supported"
                llogd @current_mode

            Hal.on "TILE_LAYER_SELECTED", (tile) =>
                llogd "Tile layer selected from editor"
                llogd tile
                @selected_tile = tile
                @selected_tile_sprite = Hal.asm.getSprite(@selected_tile.sprite)
                @selected_tile_x = @selected_tile_sprite.w2  #- @tilew2
                @selected_tile_y = @selected_tile_sprite.h2  #- @tileh2

            Hal.on "MOUSE_MOVE", (pos) =>
                Vec2.release(@world_pos) if @world_pos?
                @world_pos = @screenToWorld(pos)
                t = @getTileAt(@world_pos)
                if t isnt @tile_under_mouse
                    if @tile_under_mouse
                        @tile_under_mouse.drawableOffState(Hal.DrawableStates.Fill)
                    @tile_under_mouse = t
                    if @tile_under_mouse?
                        @tile_under_mouse.drawableOnState(Hal.DrawableStates.Fill)

            @initMap()
            # llog.setLevel "DEBUG"

        maxRows: () ->
            return Math.min(@nrows-1, Math.round((@bounds[3] / (@tileh * @scale[0])) + 4))

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

        initMap: () ->
            @clicked_layer = null
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

        processMouseClick: () ->
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
                            @clicked_layer = tile
                    else if (layer.holder.row is @clicked_layer.holder.row)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = tile
                    else if (layer.holder.col is @clicked_layer.holder.col)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = tile
                    else if (layer.holder.col isnt @clicked_layer.holder.col) and (layer.holder.row isnt @clicked_layer.holder.row)
                        if (layer.h + layer.position[1] > @clicked_layer.h + @clicked_layer.position[1])
                            @clicked_layer = tile
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

        drawQuadTree: (quadtree) ->
            return if @paused
            @g.ctx.textAlign = "center"
            @g.ctx.fillStyle = "white"
            
            if quadtree.nw?
                @drawQuadTree(quadtree.nw)
                @g.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3])
                @g.ctx.fillText("#{quadtree.nw.id}", quadtree.nw.bounds[0] + quadtree.nw.bounds[2]*0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3]*0.5)

            if quadtree.ne?
                @drawQuadTree(quadtree.ne)
                @g.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3])
                @g.ctx.fillText("#{quadtree.ne.id}", quadtree.ne.bounds[0] + quadtree.ne.bounds[2]*0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3]*0.5)

            if quadtree.sw?
                @drawQuadTree(quadtree.sw)
                @g.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3])
                @g.ctx.fillText("#{quadtree.sw.id}", quadtree.sw.bounds[0] + quadtree.sw.bounds[2]*0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3]*0.5)

            if quadtree.se?
                @drawQuadTree(quadtree.se)
                @g.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3])
                @g.ctx.fillText("#{quadtree.se.id}", quadtree.se.bounds[0] + quadtree.se.bounds[2]*0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3]*0.5)
        
        draw: (delta) ->
            super(delta)
            @g.ctx.setTransform(
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
                @g.ctx.globalAlpha = 0.5
                @g.ctx.drawImage(@selected_tile_sprite.img, @tile_under_mouse.position[0] - @selected_tile_x, @tile_under_mouse.position[1] - @selected_tile_y)
                @g.ctx.globalAlpha = 1.0

    return IsometricMap