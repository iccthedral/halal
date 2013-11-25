"use strict"

require.config
    urlArgs: Math.random()
    baseUrl: "src"
    
    paths:
        "loglevel" : "../vendor/loglevel/dist/loglevel"

require ["halal"], (halal) ->
    # log.setLevel log.levels.DEBUG
    # return halal
    
    # require ["halal"], (halal) ->
    #     Hal.log.debug "Halal loaded"
    #     Hal.log.debug halal
