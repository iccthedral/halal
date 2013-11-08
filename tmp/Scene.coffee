"use strict"

define [],

() ->

    class Scene extends HalalEntity
        constructor: (meta) ->
            @name = Hal.id() unless meta.name




