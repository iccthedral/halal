"use strict"

define [],

() ->

    class DOMEventManager
        constructor: () ->
            @mouse_leftbtn_down      = false
            @mouse_rightbtn_down     = false
            @can_drag                = true
            @pos                     = [0, 0]
            @viewport                = Hal.dom.renderspace
            @hud                     = Hal.dom.hud
            @dragging                = false
            @under_hud               = false

            ### @todo ovo izbaciti iz engina posle ###
            #ako ne podrzava queryselectorall
            #napravi shim koji prolazi kroz childove
            #node-a koji je ispod trenutne pozicije misha
            #@hud = document.getElementById("hud")
            ### end @todo ###
            @viewport.addEventListener("mousedown", @mouseDown)
            @viewport.addEventListener("mouseup", @mouseUp)
            @viewport.addEventListener("mousemove", @mouseMove)
            @viewport.addEventListener("onmousewheel", @wheelMoved)
            @viewport.addEventListener("onContextMenu", () -> return false)
            @viewport.addEventListener("mousewheel", @wheelMoved)
            @viewport.addEventListener("click", @mouseClick)
            @viewport.addEventListener("dblclick", @mouseDblClick)

            window.addEventListener("keydown", @keyDown)
            window.addEventListener("keyup", @keyUp)

        wheelMoved: (evt) =>
            @getMousePos(evt)
            Hal.trigger "SCROLL", {down: evt.wheelDelta < 0, pos: @pos}

        keyDown: (evt) =>
            return if @under_hud
            Hal.trigger("KEY_DOWN", evt)

        keyUp: (evt) =>
            return if @under_hud
            Hal.trigger("KEY_UP", evt)

        mouseDblClick: (evt) =>
            @getMousePos(evt)
            Hal.trigger("LEFT_DBL_CLICK", @pos)

        mouseClick: (evt) =>
            return if @under_hud
            @getMousePos(evt)
            Hal.trigger("MOUSE_CLICK", @pos)

        mouseMove: (evt) =>
            @under_hud = @hud.querySelectorAll(':hover').length > 0
            return if @under_hud
            @getMousePos(evt)
            Hal.trigger("MOUSE_MOVE", @pos)
            if (@mouse_leftbtn_down and (not @dragging and @can_drag))
                Hal.trigger("DRAG_STARTED", @pos)
                @dragging = true
                @can_drag = false

        mouseUp: (evt) =>
            if @under_hud
                @mouse_leftbtn_down = false
                return
            @getMousePos(evt)
            if @dragging
                @dragging = false
                Hal.trigger("DRAG_ENDED", @pos)
                @can_drag = true
            if @mouse_rightbtn_down and not @dragging
                Hal.trigger("RIGHT_CLICK", @pos)
                @mouse_rightbtn_down = false
            else if @mouse_leftbtn_down and not @dragging
                Hal.trigger("LEFT_CLICK", @pos)
                @mouse_leftbtn_down = false

        mouseDown: (evt) =>
            if @under_hud
                @mouse_leftbtn_down = false
                return
            @getMousePos(evt)
            if evt.button is 0
                @mouse_leftbtn_down = true
            else if evt.button is 2
                @mouse_rightbtn_down = true

        getMousePos: (evt) =>
            @pos[0] = evt.clientX - Hal.dom.area.left
            @pos[1] = evt.clientY - Hal.dom.area.top

    return DOMEventManager