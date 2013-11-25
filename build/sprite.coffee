"use strict"

define [],
() ->

    class Sprite
        constructor: (@img, name, @x, @y, @w, @h) ->
            spl = @img.src.match(/\/assets\/sprites\/(.*\/)(.*)\.png/)
            @name = if spl and spl[2] then spl[2] else ""
            @w2 = @w * 0.5
            @h2 = @h * 0.5
            @folder = if spl and spl[1] then spl[1] else ""
            @onLazyLoad = null

        changeSprite: (other) ->
            @img    = other.img
            @name   = other.name
            @x      = other.x
            @y      = other.y
            @w      = other.w
            @h      = other.h
            @folder = other.folder
            @w2     = other.w2
            @h2     = other.h2
            
            if @onLazyLoad?
                @onLazyLoad()

        getName: () ->
            return @folder + @name
            
    return Sprite