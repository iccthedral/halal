"use strict"

define ["EventDispatcher"],

(EventDispatcher) ->

    class Halal extends EventDispatcher
        constructor: () ->
            super()