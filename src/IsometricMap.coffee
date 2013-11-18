"use strict"

define ["Scene", "SpriteEntity", "Entity"], 

(Scene, SpriteEntity, Entity) ->

    class Tile extends SpriteEntity
        constructor: (meta) ->
            super(meta)
            @row    = meta.row
            @col    = meta.col
            @name   = if meta.name? then meta.name else "#{@id}"

    class IsometricMap extends Scene
        constructor: (meta) ->
            @tilew          = meta.tilew
            @tileh          = meta.tileh
            @nrows          = meta.rows
            @ncols          = meta.cols

            @tilew2prop     = 2 / @tilew
            @tileh2prop     = 2 / @tileh
            @tilew2         = @tilew / 2
            @tileh2         = @tileh / 2
            @map            = []
            @total_rendered = 0

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
            @search_range       = 50

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

            Hal.on "RIGHT_CLICK", (pos) =>
                return if @paused
                @camera.lerpTo(@localToWorld(@world_pos))

            @on "ENTITY_DESTROYED", (ent) =>
                ind = @map.indexOf(ent)
                if ind is -1
                    log.debug "oh shit, no such entity #{ent.id}"
                    return
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
                    tile.draw(delta)
                    @total_rendered++

            @g.ctx.setTransform(
                @local_matrix[0], 
                @local_matrix[3],
                @local_matrix[1],
                @local_matrix[4],
                @local_matrix[2],
                @local_matrix[5]
            )

            @showRegion(@mpos, 3, 3)

            if @draw_quadspace
                @drawQuadSpace(@quadspace)
                @g.strokeRect(@camera.view_frustum, "green")

            #@g.ctx.setTransform(1, 0, 0, 1, -@search_range*@camera.zoom, -@search_range*@camera.zoom)
            #@g.strokeRect([
            #    @mpos[0], 
            #    @mpos[1], 
            #    2*@search_range*@camera.zoom, 
            #    2*@search_range*@camera.zoom  
            #], "red")

        calcDrawingArea: () ->
            top_left = @getTileAt(@worldToLocal([0, 0]))
            if not top_left?
                sc = 0
                sr = 0
            else 
                sc = top_left.col
                sr = top_left.row

            @display = {
                startc: sc
                endr: Math.min(@nrows-1, Math.round((@bounds[3] / (@tileh * @camera.zoom)) + 4))
                startr: sr
                endc: Math.min(@ncols-1, Math.round((@bounds[2] / (@tilew2 * @camera.zoom)) + 4))
            }

        toOrtho: (pos) ->
            coldiv  = ((pos[0] + @camera.view_frustum[0]) * @tilew2prop)
            rowdiv  = ((pos[1] + @camera.view_frustum[1]) * @tileh2prop)
            off_x   = ~~((pos[0] + @camera.view_frustum[0]) - ~~(coldiv * 0.5) * @tilew)
            off_y   = ~~((pos[1] + @camera.view_frustum[1]) - ~~(rowdiv * 0.5) * @tileh)
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
            # @world_dim = [0, 0, (@ncols + 1) * @tilew2, (@nrows + 1) * @tileh]
            # 

            for i in [0..@nrows-1]
                for j in [0..@ncols-1]
                    x = (j / 2) * @tilew
                    y = (i + ((j % 2) / 2)) * @tileh

                    t = new Tile(
                        "shape": @iso_shape
                        "draw_shape": false
                        "x": x
                        "y": y
                        "row": i
                        "col": j
                        "visible_sprite": true
                        "sprite": "test/grid_unit_128x64"
                    )
                    @map.push(@addEntity(t))

            @calcDrawingArea()
            @camera.trigger "CHANGE"

    return IsometricMap