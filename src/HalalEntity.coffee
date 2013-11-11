"use strict"

define ["EventDispatcher"],

(EventDispatcher) ->
    
    class HalalEntity extends EventDispatcher
        constructor: () ->
            @anim_chain = []
            @anim_done = true
            super()

        attr: (key, val) ->
            if arguments.length is 1
                return @[key] if typeof key is "string"
                @extend(key)
                @trigger "CHANGE", key
            else
                @[key] = val
                @trigger "CHANGE", [key, val]
                
        extend: (obj) ->
            return @ if not obj?
            for key, val of obj
                continue if @ is val
                @[key] = val
            return @

        tween: (meta) ->
            if @anim_done
                @anim_done = false
                Hal.tween(@, meta.attr, meta.duration, meta.from, meta.to, meta.repeat).then () =>
                    @anim_done = true
                    meta = @anim_chain.pop()
                    @tween(meta) if meta?
            else
                @anim_chain.unshift(meta)
            return @

        #stopTweening: () ->

