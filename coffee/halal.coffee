"use strict"

define [
    "logger"
    "eventdispatcher"
    "scene"
    "dommanager"
    "renderer"
    "geometry"
    "vec2"
    "matrix3"
    "deferred"
    "deferredcounter"
    "domeventmanager"
    "assetmanager"
    "imgutils"
    "isometricscene"
    "ajax"
    "shape"
    "line"
    "mathutil"
    "bbresolvers",
    "drawable"
],

(
    Logger,
    EventDispatcher, 
    Scene, 
    DOMManager, 
    Renderer, 
    Geometry, 
    Vec2,
    Matrix3,
    Deferred, 
    DeferredCounter, 
    DOMEventManager, 
    AssetManager, 
    ImgUtils,
    IsometricScene, 
    Ajax, 
    Shape,
    Line,
    MathUtil,
    BBResolvers,
    Drawable,
) ->

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
    last_frame_id       = 0
    prev_time           = 0
    fps_cap             = 30
    fstep               = 1 / fps_cap
    draw_info           = null
    paused              = true
    focused_scene       = null

    rafLoop = () ->
        prev_time           = cur_time
        cur_time            = performance.now()
        delta               = (cur_time - prev_time) * 0.001
        cur_fps_time        += delta
        delta               = Math.min(delta, fstep)

        Hal.trigger "ENTER_FRAME", delta

        if focused_scene? and not focused_scene.paused
            focused_scene.update(delta)
            focused_scene.draw(delta)

        if cur_fps_time >= fps_trigger_time
            Hal.fps         = fps_counter
            cur_fps_time    = 0
            fps_counter     = 0
            Hal.trigger "FPS_UPDATE", Hal.fps
            
        Hal.trigger "EXIT_FRAME", delta
        last_frame_id = requestAnimFrame(rafLoop)
        fps_counter++

    class Halal extends EventDispatcher
        constructor: () ->
            super()
            @dom            = new DOMManager(@)
            @glass_z_index  = 100
            @id             = 0
            @debug_mode     = false
            @pressed_keys   = []
            @scenes         = []
            @fps            = 0
            @glass          = null
            llogd "Engine constructed"

    Halal::setFocusedScene = (scene) ->
        focused_scene = scene

    Halal::addScene = (scene, to_focus = true) ->
        if @scenes.length is 0 and not @glass?
            @start()

        if not (scene instanceof Scene)
            lloge "Not a Scene instance"
            return null
        if not scene.bounds
            lloge "Bounds not set on scene #{scene.name}"
            return null
        if not scene.name
            llogw "Name for scene wasn't provided"
            scene.name = "#scene" + "_" + scene.id
        scene.init()
        @scenes.unshift(scene)
        llogd "Added scene: #{scene.name}"
        Hal.trigger "SCENE_ADDED", scene
        if to_focus
            focused_scene  = scene
        return scene

    Halal::pause = () ->
        paused = true
        cancelAnimationFrame(last_frame_id)
        @trigger "ENGINE_PAUSED"

    Halal::resume = () ->
        paused = false
        rafLoop()
        @trigger "ENGINE_RESUMED"

    Halal::viewportBounds = () ->
        return [0, 0, @dom.area.width, @dom.area.height]

    Halal::supports = (feature) ->
        @trigger "SUPPORTS_#{feature}"

    Halal::init = () ->
        @evm = 
            new DOMEventManager()
        @glass = 
            new Renderer(@viewportBounds(), null, @glass_z_index, true)
        @glass.ctx.font =
            "9pt monospace"
        @glass.ctx.fillStyle = 
            "black"

        @on "SCENE_REQ_DESTROY", (scene) ->
            ind = @scenes.indexOf(scene)
            if ind is -1
                lloge "No such scene: #{scene.name}"
            @scenes.splice(ind, 1)
            if focused_scene is scene
                focused_scene = null
            if @scenes.length is 0
                @dom.removeCanvasLayer(@glass_z_index)
                @pause()
            llogi "Destroyed scene: #{scene.name}"
            scene = null

        llogd "Engine initialized"
    
    Halal::start = () ->
        @init()
        paused = false
        @trigger "ENGINE_STARTED"
        llogd "Engine started"
        rafLoop()
        
    Halal::isPaused = () ->
        return paused

    Halal::debug = (@debug_mode) ->
        Hal.trigger "DEBUG_MODE", @debug_mode

    Halal::ID = () ->
        return ++@id

    Halal::tween = (obj, property, t, from, to, repeat = 1, arr_index) ->
        defer = new Deferred()
        t *= 0.001
        accul = 0
        speed = (to - from) / t
        val = from
        Hal.on "ENTER_FRAME", $ = (delta) ->
            accul += delta
            val += speed * delta
            obj.attr(property, val, arr_index)
            accul = Math.min(accul, t)
            if t is accul
                repeat--
                obj.attr(property, to, arr_index)
                if repeat is 0
                    defer.resolve(obj, $)
                    Hal.removeTrigger "ENTER_FRAME", $
                    return
                else
                    accul = 0
                    val = from
        return [defer.promise(), $]

    Halal::tweenF = (t, func, from, to, repeat = 1) ->
        t *= 0.001
        accul = 0
        speed = (to - from) / t
        val = from
        Hal.on "ENTER_FRAME", $ = (delta) ->
            accul += delta
            val += speed * delta
            func(val, delta)
            accul = Math.min(accul, t)
            if t is accul
                repeat--
                func(to, delta)
                if repeat is 0
                    Hal.removeTrigger "ENTER_FRAME", $
                    return
                else
                    accul = 0
                    val = from
        return

    Halal::fadeInViewport = (t) ->
        @tweenF(t, ((val) -> Hal.dom.viewport.style["opacity"] = val), 0, 1)

    Halal::fadeOutViewport = (t) ->
        @tweenF(t, ((val) -> Hal.dom.viewport.style["opacity"] = val), 1, 0)

    ###
        @todo kontekst bi valjalo prosledjivati, mozda window ne bude window
        i undefined ne bude undefined
    ###
    Halal::math     = MathUtil
    Halal::geometry = Geometry
    Halal::asm      = new AssetManager()
    Halal::im       = new ImgUtils()
    
    ### classes ###
    Halal::Line             = Line
    Halal::Vec2             = Vec2
    Halal::Matrix3          = Matrix3
    Halal::Shape            = Shape
    Halal::Scene            = Scene
    Halal::Ajax             = Ajax
    Halal::BBResolvers      = BBResolvers
    Halal::DrawableStates   = Drawable.DrawableStates
    Halal::IsometricScene   = IsometricScene
    Halal::Deferred         = Deferred
    Halal::DeferredCounter  = DeferredCounter

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
        SPACE: 32
        LEFT: 37
        RIGHT: 39
        UP: 38
        DOWN: 40
        F: 70

    return window.Hal = new Halal()