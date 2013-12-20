"use strict"

require.config
    urlArgs: Math.random()
    baseUrl: "js"
    paths:
        "requireLib" : "../vendor/requirejs/require"

require ["halal"], (halal) ->
    return halal
    
    # log.setLevel log.levels.DEBUG
    # return halal
    # require ["halal"], (halal) ->
    #     llogd "Halal loaded"
    #     llogd halal