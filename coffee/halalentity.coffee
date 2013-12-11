"use strict"

define ["eventdispatcher", "deferred"],

(EventDispatcher, Deferred) ->
    
    class Tweener
        constructor: (@obj) -> 
            @num_tweens  = 0
            @to_wait     = 0
            @tween_chain = []
            @animating   = false
            @clb_ids     = []
            @done_clb    = null
            @paused      = false

        tween: (meta) ->
            # supports 1D arrays only, atm
            match = meta.attr.match(/(.*)\[(\d)\]/)
            @num_tweens++
            if @to_wait <= 0
                if match? and match.length is 3
                    index = match[2]
                    meta.attr = match[1]
            else 
                @tween_chain.push(meta)
                return @
            @animating = true
            [promise, clb] = Hal.tween(@obj, meta.attr, meta.duration, meta.from, meta.to, meta.repeat, index)
            @clb_ids.push(clb)
            promise.then (clb) =>
                ind = @clb_ids.indexOf(clb)
                @clb_ids.splice(ind, 1)
                @num_tweens--
                if @to_wait > 0 and @num_tweens isnt 0 and not @paused
                    @to_wait--
                    @tween(@tween_chain.pop())
                    @num_tweens--
                if @num_tweens is 0 and @done_clb? and not @paused
                    @done_clb.call(@obj)
                if @num_tweens is 0 and @to_wait is 0
                    @animating = false
            return @

        wait: (wait_clb, msecs) ->
            @to_wait++
            return @

        pause: () ->
            @paused = true
            Hal.remove "ENTER_FRAME", clb for clb in @clb_ids
            return @

        resume: () ->
            @paused = false
            Hal.on "ENTER_FRAME", clb for clb in @clb_ids
            return @

        stop: () ->
            @paused = true
            Hal.remove "ENTER_FRAME", clb for clb in @clb_ids
            @clb_ids = []
            @num_tweens = 0
            @to_wait = 0
            @animating = false
            @wait_clb = null
            @done_clb = null
            @tween_chain = []
            return @

        done: (@done_clb) ->
            return @

    _init_map = {}
    class HalalEntity extends EventDispatcher
        #mozda i da args strpam pri pozivu konstruktora
        @include: (obj, args...) ->
            @::["__classex__"] = @name
            if obj::constructor?
                llogi "Copying constructor from #{@name}"
                if not _init_map[@name]? then _init_map[@name] = []
                _init_map[@name].push obj::constructor
            llogi "Extending from #{@name} with #{obj.name}"
            throw ("include(obj) requires obj") unless obj::
            for key, val of obj::
                continue if key in ["constructor", "init"]
                if @::[key]?
                    lloge "Added to inheritance chain fn: #{key}"
                @::[key] = val
                llogd "Extended with #{key}"

    HalalEntity::constructor = () ->
        super()
        if _init_map[@__classex__]
            for init in _init_map[@__classex__]
                llogd "Calling #{@__classex__} constructor"
                init.call(@)
        @tweener = new Tweener(@)
        # @init()
        return @

    HalalEntity::init = () ->
        return @

    HalalEntity::attr = (key, val, index) ->
        if arguments.length is 1
            return @[key] if typeof key is "string"
            @extend(key)
        else if index?
            @[key][index] = val
        else
            @[key] = val
        @trigger "CHANGE", key, val
        return @
                
    HalalEntity::extend = (obj, proto) ->
        return @ if not obj?
        for key, val of obj
            continue if @ is val
            if typeof val is "function" and proto
                llogi "is a function #{key}"
                @::[key] = val
            else
                @[key] = val
        return @

    HalalEntity::tween = (meta) ->
        @tweener.stop()
        @tweener.tween(meta)

    return HalalEntity