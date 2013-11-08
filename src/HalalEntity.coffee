"use strict"

define ["EventDispatcher"],

(EventDispatcher) ->
    
    class HalalEntity extends EventDispatcher
        constructor: () ->
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