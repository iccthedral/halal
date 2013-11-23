"use strict"

define ["eventdispatcher", "deferred"],

(EventDispatcher, Deferred) ->
    
    class Tweener
        constructor: (@obj) -> 
            @num_tweens  = 0
            @to_wait     = 0
            @tween_chain = []
            @animating   = false

        tween: (meta) ->
            @num_tweens++
            if @to_wait > 0
                @tween_chain.push(meta)
                return @
            @animating = true
            promise = Hal.tween(@obj, meta.attr, meta.duration, meta.from, meta.to, meta.repeat)
            promise.then () =>
                @num_tweens--
                @done_clb.call(@obj) if @num_tweens is 0 and @done_clb?
                if @to_wait > 0
                    @to_wait--
                    @tween(@tween_chain.pop())
                    @num_tweens--
                if @num_tweens is 0 and @to_wait is 0
                    @animating = false
            return @

        wait: (@wait_clb) ->
            @to_wait++
            return @

        done: (@done_clb) ->

        # delay: () ->

    class HalalEntity extends EventDispatcher
        constructor: () ->
            super()
            @animating = false

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
            return new Tweener(@).tween(meta)


        # t.tween(...).done () ->
        #     log.debug "opa"

        # t.tween().done () -> tween().done () -> 

        # t.tween().tween().done () ->

        # t.tween().delay(1000).tween().done () ->

        # return {
        #     tween
        #     done
        #     delay
        # }