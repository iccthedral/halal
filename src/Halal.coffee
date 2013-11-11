"use strict"

define ["EventDispatcher", "Scene", "DOMManager", "Renderer", "MathUtil", "Vec2", "DeferredCounter", "DOMEventManager"],

(EventDispatcher, Scene, DOMManager, Renderer, MathUtil, Vec2, DeferredCounter, DOMEventManager) ->

    ###
        A shim (sort of) to support RAF execution
    ###
    window.requestAnimFrame = do () ->
        return  window.requestAnimationFrame       or
                window.webkitRequestAnimationFrame or
                window.mozRequestAnimationFrame    or
                (callback) ->
                    window.setTimeout(callback, 1)

    ###
        A shim to support timer. 
        performance.now is an ultra-precise timer and is preferred over Date.now
    ###
    if not window.performance?
        window.performance = Date

    cur_time            = performance.now()
    delta               = 0
    fps_trigger_time    = 1
    cur_fps_time        = 0
    fps_counter         = 0
    fps                 = 0
    last_frame_id       = 0
    prev_time           = 0

    fps_cap             = 30
    fstep               = 1 / fps_cap
    _draw_info          = null

    rafLoop = () ->
        prev_time = cur_time
        cur_time = performance.now()
        delta = (cur_time - prev_time) * 0.001
        cur_fps_time += delta
        delta = Math.min(delta, fstep)

        Hal.trigger "ENTER_FRAME", delta

        if cur_fps_time >= fps_trigger_time
            fps = fps_counter
            cur_fps_time = 0
            fps_counter = 0
            Hal.trigger "FPS_UPDATE", fps

        Hal.trigger "EXIT_FRAME"

        last_frame_id = requestAnimFrame(rafLoop)
        fps_counter++

    class Halal extends EventDispatcher
        constructor: () ->
            super()
            @dom            = new DOMManager(@)
            @math           = MathUtil
            @id             = 0
            @paused         = true
            @debug_mode     = false
            @pressed_keys   = []
            @scenes         = []
            log.debug "Engine constructed"

    Halal::addScene = (scene) ->
        if not (scene instanceof Scene)
            log.error "Not a Scene instance"
            return null

        if not scene.bounds
            log.error "Bounds not set on scene #{scene.name}"
            return null

        if not scene.name
            log.warn "Name for scene wasn't provided"
            scene.name = "#scene" + "_" + scene.id

        scene.init()
        Hal.trigger "SCENE_ADDED_" + scene.name.toUpperCase(), scene
        
        @scenes.unshift(scene)

        log.debug "Added scene: #{scene.name}"
        return scene

    Halal::viewportBounds = () ->
        return [0, 0, @dom.area.width, @dom.area.height]

    Halal::supports = (feature) ->
        @trigger "SUPPORTS_#{feature}"

    Halal::init = () ->
        @glass = new Renderer(@viewportBounds(), null, 11)
        @evm = new DOMEventManager()
        log.debug "Engine initialized"
        
    Halal::start = () ->
        @init()
        @paused = false
        @trigger "ENGINE_STARTED"
        log.debug "Engine started"
        rafLoop()

    Halal::debug = (@debug_mode) ->
        if @debug_mode and not _draw_info?
            Hal.on "EXIT_FRAME", _draw_info = (delta) ->
                Hal.drawInfo()
        else if not @debug_mode
            Hal.remove "EXIT_FRAME", _draw_info
            _draw_info = null

    Halal::ID = () ->
        return ++@id

    Halal::drawInfo = () ->
        @glass.ctx.setTransform(1, 0, 0, 1, 0, 0)
        @glass.ctx.fillStyle = "black"
        @glass.ctx.fillText("FPS: #{fps}", 0, 10)

    Halal::tween = (obj, property, t, from, to, repeat = 1) ->
        defer = new DeferredCounter(repeat)
        t *= 0.001
        accul = 0
        speed = (to - from) / t
        val = from
        Hal.on "ENTER_FRAME", $ = (delta) ->
            accul += delta
            val += speed * delta
            obj.attr(property, val)
            accul = Math.min(accul, t)
            if t is accul
                repeat--
                defer.release(obj)
                obj.attr(property, to)
                if repeat is 0
                    Hal.remove "ENTER_FRAME", $
                    return
                else
                    accul = 0
                    val = from

        return defer.promise()

    Halal::tweenF = (t, func, from, to) ->
        t *= 0.001
        accul = 0
        speed = (to - from) / t
        Hal.on "ENTER_FRAME", $ = (delta) ->
            accul += delta
            from += speed * delta
            func(from)
            accul = Math.min(accul, t)
            if t is accul
                Hal.remove "ENTER_FRAME", $
                func(to)
                return
        return        

    Halal::fadeInViewport = (t) ->
        @tweenF(t, ((val) -> Hal.dom.viewport.style["opacity"] = val), 0, 1)

    Halal::fadeOutViewport = (t) ->
        @tweenF(t, ((val) -> Hal.dom.viewport.style["opacity"] = val), 1, 0)

    Halal::Keys = 
        SHIFT: 16
        G: 71
        D: 68
        W: 87
        C: 67
        I: 73
        ONE: 49
        TWO: 50
        THREE: 51
        FOUR: 52
        DELETE: 46
        LEFT: 37
        RIGHT: 39
        UP: 38
        DOWN: 40
        F: 70
    
    ###
        @todo kontekst bi valjalo prosledjivati, mozda window ne bude window
        i undefined ne bude undefined
    ###
    
    return (window.Hal = new Halal())