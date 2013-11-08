"use strict"

define ["HalalEntity", "Renderer"],

(HalalEntity, Renderer) ->

    class Scene extends HalalEntity
        constructor: (meta = {}) ->
            super()
            @name   = if meta.name then meta.name else Hal.ID()
            @bounds = if meta.bounds then  meta.bounds else Hal.viewportBounds()
            
            @draw_loop = 
                Hal.on "ENTER_FRAME", (delta) =>
                    Hal.glass.ctx.clearRect(0, 0, @bounds[2], @bounds[3])
                    @update(delta)
                    @draw(delta)

            @bg_color = if meta.bg_color then meta.bg_color else "white"
            @entities = []

            # @todo #
            @camera = null

        addEntity: (ent) ->
            @entities.push(ent)
            ent.attr("parent", @)

        destroy: () ->
            Hal.remove "ENTER_FRAME", @draw_loop

        update: () -> return
        draw: () -> return
        init: () -> return

    return Scene