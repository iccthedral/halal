"use strict"

define [], 

() ->
    
    Logger = 
        levels: 
            DEBUG: () ->
                window.llogi = (msg) -> console.info.call(console, msg)
                window.lloge = (msg) -> console.error.call(console, msg)
                window.llogd = (msg) -> console.debug.call(console, msg)
                window.llogw = (msg) -> console.warn.call(console, msg)

            SILENT: () ->
                window.llogi = window.lloge = window.llogd = window.llogw = -> return

        setLevel: (level) ->
            current_level = level
            Logger.levels[level].call()

    Logger.setLevel("DEBUG")
    
    return (window.llog = Logger)