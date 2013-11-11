"use strict"

define  ()->

    class EventDispatcher
        constructor: () ->
            @listeners = []      
            # @list_arr = []

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
            
        return clb

    EventDispatcher::remove = (type, clb) ->
        if @listeners[type]? 
            ind = @listeners[type].indexOf(clb)
            @listeners[type].splice(ind, 1) if ind isnt -1

    EventDispatcher::removeAll = (type) ->
        if type
            delete @listeners[type]
        else
            @listeners = []
        
    EventDispatcher::trigger = (type, msg, target = @) ->
        # @list_arr = 
        return if not @listeners[type]
        for clb in @listeners[type]
            clb.call(target, msg, clb) if clb?

    return EventDispatcher
    