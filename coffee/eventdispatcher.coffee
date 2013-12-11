"use strict"

define [], 

() ->

    class EventDispatcher
        constructor: () ->
            @listeners = {}

    EventDispatcher::on = (type, clb) ->
        if type instanceof Array
            for t in type
                if not @listeners[t]?
                    @listeners[t] = []
                @listeners[t].push(clb)
        else
            if not @listeners[type]?
                @listeners[type] = []
            @listeners[type].push(clb)
            ind = @listeners[type].indexOf(clb)
        llogi "Added listener: TYPE = #{type}"
        return clb

    EventDispatcher::remove = (type, clb) ->
        if @listeners[type]?
            ind = @listeners[type].indexOf(clb)
            @listeners[type].splice(ind, 1) if ind isnt -1
            # clb = null
            if ind isnt -1
                llogi "Removed listener: TYPE = #{type}"

    EventDispatcher::removeAll = (type) ->
        if type
            delete @listeners[type]
            llogi "Removed listeners: TYPE = #{type}"
        else
            keys = Object.keys(@listeners)
            for key in keys
                llogi "Removed listeners: KEY = #{key}"
                @remove(key, list) for list in @listeners[key]

    EventDispatcher::trigger = (type, arg1, arg2, arg3) ->
        return if not @listeners[type]
        for clb in @listeners[type]
            if clb? 
                clb.call(@, arg1, arg2, arg3)

    return EventDispatcher
    