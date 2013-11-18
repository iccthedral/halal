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
    require ["Halal", "Scene", "Entity", "SpriteEntity"], 
    (Halal, Scene, Entity, SpriteEntity) ->
        #Hal.asm.setResourcesRelativeURL "/assets/"
        Hal.asm.loadSpritesFromFileList "assets/sprites/sprites.list"
        e = new Entity({
            shape: Hal.math.createRegularon(3, 45)
        })
        
        e1 = new SpriteEntity({
            sprite: "test/warhorse"
        })

        e2 = new Entity()

        e.attr("stroke_color", "green")
        e1.attr("stroke_color", "blue")
        e1.attr("fill_color", "green")
        e1.attr("draw_shape", false)

        class Bla extends Scene
            constructor: () ->
                super()
                @search_range = 50

            draw: (delta) ->
                super()

                #pos = @entities[1].worldToLocal(@localToWorld(@worldToLocal(@mpos)))
                # log.debug pos
                #Hal.glass.strokeRect([pos[0], pos[1], 20, 20], "yellow")
    
                for p in @entities
                    p.update(delta)
                    p.draw(delta)

                Hal.glass.ctx.setTransform(1, 0, 0, 1, -@search_range*@camera.zoom, -@search_range*@camera.zoom)
                Hal.glass.strokeRect([
                    @mpos[0], 
                    @mpos[1], 
                    2*@search_range*@camera.zoom, 
                    2*@search_range*@camera.zoom  
                ], "red")

        bla = new Bla()
        bla.attr("name", "Bla Scena")
        bla.attr("bg_color", "gray")

        Hal.addScene(bla)
        
        do addRandom = () ->
            i = 30
            while i > 0
                x       = bla.bounds[2] * Math.random()
                y       = bla.bounds[3] * Math.random()
                scale   = Math.random() * 2.5
                angle   = Math.random() * Math.PI * 2
                size    = Math.round(Math.random() * 50)
                reg     = Math.round(3 + Math.random() * 17)
                ent     = new Entity({
                    x: x
                    y: y
                    scale: scale
                    angle: angle
                    shape: Hal.math.createRegularon(reg, size)
                })
                bla.addEntity(ent)
                log.debug i
                i--

        e.attr("shape", Hal.math.createRegularon(3, 45))
        e.attr("scale", 1)
        #e.attr("line_width", 9)
        e.attr("x", 100)
        e.attr("y", 50)
        e.attr("stroke_color", "white")
        e.attr("glow", true)
        e.attr("glow_color", "blue")
        e.attr("glow_amount", 32)
        #e.attr("angle", -Math.PI/2)
        #e.tween({attr: "x", duration: 5000, from: e.attr("x"), to: 700, repeat: 20}).
        #  tween({attr: "y", duration: 5000, from: e.attr("y"), to: 300, repeat: 20})
        e.attr("draw_origin", true)

        #e1.attr("shape", Hal.math.createRegularon(6, 25))
        e1.attr("angle", 0)
        e1.attr("scale", 1)
        e1.attr("x", 150)
        e1.attr("y", 150)
        #e1.attr("line_width", 4)
        #e1.attr("stroke_color", "white")
        #e1.attr("glow", true)
        #e1.attr("glow_color", "yellow")
        #e1.attr("glow_amount", 22)
        #e1.attr("angle", Math.PI/3)
        #e1.tween({attr: "scale", duration: 1000, from: 0.5, to: 2.5, repeat: 2})
        #e1.tween({attr: "angle", duration: 8000, from: e1.attr("angle"), to: 2*Math.PI, repeat: 5})
        e1.attr("draw_origin", true)
        #e1.addDrawable (delta) ->
            # pos = @worldToLocal(@parent.localToWorld(@parent.worldToLocal(@parent.mpos)))
            # # log.debug pos
            # Hal.glass.strokeRect([pos[0], pos[1], 20, 20], "yellow")
    
        e2.attr("shape", Hal.math.createRegularon(4, 15))
        e2.attr("scale", 1)
        e2.attr("line_width", 3)
        e2.attr("x", 0)
        e2.attr("y", 0)
        e2.attr("stroke_color", "white")
        e2.attr("glow", true)
        e2.attr("glow_color", "green")
        e2.attr("glow_amount", 12)

        # e2.tween(
        #     attr: "angle"
        #     duration: 5000 
        #     from: e2.attr("angle")
        #     to: 2*Math.PI, repeat: 5
        # ).tween(
        #     attr: "line_width"
        #     duration: 4000
        #     from: e1.attr("line_width")
        #     to: 6.0
        #     repeat: 1000
        # )


        e.attr("draw_bbox", true)
        e1.attr("draw_bbox", true)
        e2.attr("draw_bbox", true)


        bla.addEntity(e)
        bla.addEntity(e1)
        #bla.addEntity(e2)

        e.addEntity(e2)

        log.debug [e.id, e1.id, e2.id]

        Hal.asm.on "SPRITES_LOADED", () ->
            Hal.start()
            Hal.fadeInViewport(1000)
            Hal.debug(true)