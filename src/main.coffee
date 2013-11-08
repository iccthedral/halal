"use strict"

require.config
    urlArgs: Math.random()
    baseUrl: "src"
    paths:
        "loglevel": "../vendor/loglevel/dist/loglevel"
    shim:
        "loglevel":
            exports: "log"

require ["loglevel"], (log) ->
    window.log = log
    require ["Halal", "Scene", "Entity"], (Halal, Scene, Entity) ->

        log.debug "wtf"
        ent = new Entity({
            shape: Hal.math.createRegularon(12, 30)
        })
        ent.attr("stroke_color", "blue")
        ent.attr("fill_color", "green")

        class Bla extends Scene
            draw: (delta) ->
                #log.debug delta
                Hal.glass.ctx.fillStyle = @bg_color
                Hal.glass.ctx.fillRect(@bounds[0], @bounds[1], @bounds[2], @bounds[3])
                Hal.glass.ctx.fill()
                for p in @entities
                    p.update(delta)
                    p.draw(delta)

        bla = new Bla({name: "bla scena"})
        bla.addEntity(ent)
        Hal.addScene(bla)
        Hal.start()
