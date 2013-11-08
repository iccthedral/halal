"use strict"

define  ()->

    class EventDispatcher
        constructor: () ->
            @listeners = []      
            @list_arr = []

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

    EventDispatcher::removeTrigger = (type, clb) ->
        if @listeners[type]? 
            ind = @listeners[type].indexOf(clb)
            @listeners[type].splice(ind, 1) if ind isnt -1

    EventDispatcher::removeTriggers = (type) ->
        if @listeners[type]?
            @listeners[type] = []

    EventDispatcher::removeAllTriggers = () ->
        @listeners = []
        
    EventDispatcher::trigger = (type, msg, target = @) ->
        @list_arr = @listeners[type]
        if @list_arr?
            for clb in @list_arr
                clb.call(target, msg, clb) if clb?

    return EventDispatcher