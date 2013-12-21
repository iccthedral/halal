"use strict"

define [],

() ->

    class DOMManager
        constructor: (Hal) ->
            @renderspace                = document.getElementById("renderspace")
            @hud                        = document.getElementById("hud")
            @viewport                   = document.getElementById("viewport")
            @area                       = renderspace.getBoundingClientRect()
            @default_zindex             = 1000
            @canvases                   = {}
            @in_fullscreen              = false
            @screen_w                   = window.screen.availWidth
            @screen_h                   = window.screen.availHeight
            @fullscreen_scale           = [1.0, 1.0]
            # @viewport.style["z-index"]  = 10000000

            Hal.on "SUPPORTS_FULLSCREEN", () ->
                return document.body.mozRequestFullScreen or 
                        document.body.webkitRequestFullScreen or 
                            document.body.requestFullScreen

            Hal.on "FULLSCREEN_CHANGE", (in_fullscreen) =>
                if in_fullscreen
                    Hal.r.resize(@screen_w / @fullscreen_scale[0], @screen_h / @fullscreen_scale[1])
                    for _, c of @canvases
                        c.setAttribute("style", (c.getAttribute("style") || "") + 
                            " " + "-webkit-transform: scale3d(" + 
                                @fullscreen_scale[0] + "," + 
                                    @fullscreen_scale[1] + ", 1.0); -webkit-transform-origin: 0 0 0;")
                    @area = @renderspace.getBoundingClientRect()
                    #Hal.scm.enterFullScreen(@fullscreen_scale)
                else
                    @renderspace.style["width"] = "#{Hal.r.prev_bounds[2]}px"
                    @renderspace.style["height"] = "#{Hal.r.prev_bounds[3]}px"
                    Hal.r.resize(Hal.r.prev_bounds[2], Hal.r.prev_bounds[3])
                    for _, c of @canvases
                        c.setAttribute("style", (c.getAttribute("style") || "") + 
                            " " + "-webkit-transform: scale3d(1.0, 1.0, 1.0); -webkit-transform-origin: 0 0 0;")
                    @area = @renderspace.getBoundingClientRect()
                    #Hal.scm.exitFullScreen([1, 1])
                    
            Hal.on "DOM_ADD", (callb, args...) =>
                if callb?
                    callb.apply({}, [@hud].concat(args))
                    
            Hal.on "REQUEST_FULLSCREEN", (scene) =>
                if not Hal.supports("FULLSCREEN")
                    log.warn "Fullscreen not supported"
                    return
                if not @in_fullscreen
                    @renderspace.style["width"] = "#{@screen_w} + px"
                    @renderspace.style["height"] = "#{@screen_h} + px"
                    @renderspace.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)

            window.addEventListener "resize", () =>
                @area = @renderspace.getBoundingClientRect()
                @screen_w = window.screen.availHeight
                @screen_h = window.screen.availHeight
                Hal.trigger "RESIZE", @area
        
            document.addEventListener "fullscreenchange", () ->
                @in_fullscreen = not @in_fullscreen
                Hal.trigger "FULLSCREEN_CHANGE", @in_fullscreen
            
            document.addEventListener "webkitfullscreenchange", () ->
                @in_fullscreen = not @in_fullscreen
                Hal.trigger "FULLSCREEN_CHANGE", @in_fullscreen

            document.addEventListener "mozfullscreenchange", () ->
                @in_fullscreen = not @in_fullscreen
                Hal.trigger "FULLSCREEN_CHANGE", @in_fullscreen

    DOMManager::createCanvas = (width = @area.width, height = @area.height, z, transp) ->
        ind             = @default_zindex + z
        canvas          = document.createElement("canvas")
        canvas.width    = width
        canvas.height   = height        
        if not transp
            canvas.style["background"] = "white"
        else 
            canvas.style["background-color"] = "transparent"
            canvas.style["background"] = "transparent"
            console.log "it shall be transparent #{ind}"
        canvas.style["z-index"] = ind
        return canvas

    DOMManager::createCanvasLayer = (width = @area.width, height = @area.height, z, transp) ->
        ind = @default_zindex + z
        if @canvases[ind]
            return @canvases[ind]
        canvas = @createCanvas(width, height, z, transp)
        return canvas

    DOMManager::addCanvas = (canvas, x = 0, y = 0) ->
        z = canvas.style["z-index"]
        canvas.style["left"] = "#{x}px"
        canvas.style["top"]  = "#{y}px"            
        if @canvases[z]
            llogw "Canvas with z-index of #{z} already exists"
            return
        @canvases[z] = canvas
        @viewport.appendChild(canvas)
        return canvas

    DOMManager::removeCanvasLayer = (z) ->
        ind = @default_zindex + (+z)
        llogi "Removing canvas layer at z-index: #{ind} / #{z}"
        @viewport.removeChild(@canvases[ind])
        delete @canvases[ind]

    return DOMManager