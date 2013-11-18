"use strict"

define () ->

    class SpriteSheet
        constructor: (@path, @img, @meta, @sprites = {}) ->
            matches = @path.match(/.*\/(.*)\.json/)
            if matches and matches.length > 0
                @name = matches[1]
            else 
                @name = @path
                
        addSprite: (spr) ->
            @sprites[spr.name] = spr

    return SpriteSheet
