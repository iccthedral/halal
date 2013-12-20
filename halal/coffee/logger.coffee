# "use strict"

define [], 

() ->
    
    Logger = 
        report:
            info: []
            error: []
            debug: []
            warning: []

        levels: 
            DEBUG: () ->
                window.llogi = (msg) -> console.info.call(console, msg)
                window.lloge = (msg) -> console.error.call(console, msg)
                window.llogd = (msg) -> console.debug.call(console, msg)
                window.llogw = (msg) -> console.warn.call(console, msg)

            SILENT: () ->
                window.llogi = (msg) -> Logger.log_report "info", msg
                window.lloge = (msg) -> 
                    Logger.log_report "error", msg
                window.llogd = (msg) -> Logger.log_report "debug", msg
                window.llogw = (msg) -> Logger.log_report "warning", msg

        log_report: (type, msg) ->
            Logger.report[type].push "Time: #{new Date().toTimeString()}, Line: #{(new Error).lineNumber}, MSG: #{msg}"

        setLevel: (level) ->
            current_level = level
            Logger.levels[level].call()

    Logger.setLevel("DEBUG")
    
    return (window.llog = Logger)