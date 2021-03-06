(function() {
  "use strict";
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define([], function() {
    var DOMEventManager;
    DOMEventManager = (function() {
      function DOMEventManager() {
        this.getMousePos = __bind(this.getMousePos, this);
        this.mouseDown = __bind(this.mouseDown, this);
        this.mouseUp = __bind(this.mouseUp, this);
        this.mouseMove = __bind(this.mouseMove, this);
        this.mouseClick = __bind(this.mouseClick, this);
        this.mouseDblClick = __bind(this.mouseDblClick, this);
        this.keyUp = __bind(this.keyUp, this);
        this.keyDown = __bind(this.keyDown, this);
        this.wheelMoved = __bind(this.wheelMoved, this);
        this.mouse_leftbtn_down = false;
        this.mouse_rightbtn_down = false;
        this.can_drag = true;
        this.pos = [0, 0];
        this.viewport = Hal.dom.renderspace;
        this.hud = Hal.dom.hud;
        this.dragging = false;
        this.under_hud = false;
        this.hud_check = true;
        /* @todo ovo izbaciti iz engina posle*/

        /* end @todo*/

        this.viewport.addEventListener("mousedown", this.mouseDown);
        this.viewport.addEventListener("mouseup", this.mouseUp);
        this.viewport.addEventListener("mousemove", this.mouseMove);
        this.viewport.addEventListener("onmousewheel", this.wheelMoved);
        this.viewport.addEventListener("onContextMenu", function() {
          return false;
        });
        this.viewport.addEventListener("mousewheel", this.wheelMoved);
        this.viewport.addEventListener("click", this.mouseClick);
        this.viewport.addEventListener("dblclick", this.mouseDblClick);
        window.addEventListener("keydown", this.keyDown);
        window.addEventListener("keyup", this.keyUp);
      }

      DOMEventManager.prototype.disableHudCheck = function() {
        this.hud_check = false;
        return this.under_hud = false;
      };

      DOMEventManager.prototype.enableHudCheck = function() {
        this.under_hud = false;
        return this.hud_check = true;
      };

      DOMEventManager.prototype.wheelMoved = function(evt) {
        if (this.under_hud) {
          return;
        }
        this.getMousePos(evt);
        return Hal.trigger("SCROLL", {
          down: evt.wheelDelta < 0,
          pos: this.pos
        });
      };

      DOMEventManager.prototype.keyDown = function(evt) {
        if (this.under_hud) {
          return;
        }
        return Hal.trigger("KEY_DOWN", evt);
      };

      DOMEventManager.prototype.keyUp = function(evt) {
        if (this.under_hud) {
          return;
        }
        return Hal.trigger("KEY_UP", evt);
      };

      DOMEventManager.prototype.mouseDblClick = function(evt) {
        this.getMousePos(evt);
        return Hal.trigger("LEFT_DBL_CLICK", this.pos);
      };

      DOMEventManager.prototype.mouseClick = function(evt) {
        if (this.under_hud) {
          return;
        }
        this.getMousePos(evt);
        return Hal.trigger("MOUSE_CLICK", this.pos);
      };

      DOMEventManager.prototype.isMouseUnderHud = function() {
        if (this.hud_check) {
          this.under_hud = this.hud.querySelectorAll(':hover').length > 0;
        } else {
          this.under_hud = false;
        }
        return this.under_hud;
      };

      DOMEventManager.prototype.mouseMove = function(evt) {
        if (this.isMouseUnderHud()) {
          return;
        }
        this.getMousePos(evt);
        Hal.trigger("MOUSE_MOVE", this.pos);
        if (this.mouse_leftbtn_down && (!this.dragging && this.can_drag)) {
          Hal.trigger("DRAG_STARTED", this.pos);
          this.dragging = true;
          return this.can_drag = false;
        }
      };

      DOMEventManager.prototype.mouseUp = function(evt) {
        if (this.under_hud) {
          this.mouse_leftbtn_down = false;
          return;
        }
        this.getMousePos(evt);
        if (this.dragging) {
          this.dragging = false;
          Hal.trigger("DRAG_ENDED", this.pos);
          this.can_drag = true;
        }
        if (this.mouse_rightbtn_down && !this.dragging) {
          Hal.trigger("RIGHT_CLICK", this.pos);
          return this.mouse_rightbtn_down = false;
        } else if (this.mouse_leftbtn_down && !this.dragging) {
          Hal.trigger("LEFT_CLICK", this.pos);
          return this.mouse_leftbtn_down = false;
        }
      };

      DOMEventManager.prototype.mouseDown = function(evt) {
        if (this.under_hud) {
          this.mouse_leftbtn_down = false;
          return;
        }
        this.getMousePos(evt);
        if (evt.button === 0) {
          return this.mouse_leftbtn_down = true;
        } else if (evt.button === 2) {
          return this.mouse_rightbtn_down = true;
        }
      };

      DOMEventManager.prototype.getMousePos = function(evt) {
        this.pos[0] = evt.clientX - Hal.dom.area.left;
        return this.pos[1] = evt.clientY - Hal.dom.area.top;
      };

      return DOMEventManager;

    })();
    return DOMEventManager;
  });

}).call(this);
