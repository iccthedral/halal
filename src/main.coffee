"use strict"

require.config
    urlArgs: Math.random()
    baseUrl: "src"

require ["halal"], (halal) ->
    log.setLevel log.levels.DEBUG
    return halal
    
    # require ["halal"], (halal) ->
    #     log.debug "Halal loaded"
    #     log.debug halal
