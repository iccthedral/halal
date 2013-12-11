(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["halalentity", "renderer", "camera", "matrix3", "quadtree", "vec2", "geometry", "transformable", "groupy"], function(HalalEntity, Renderer, Camera, Matrix3, QuadTree, Vec2, Geometry, Transformable, Groupy) {
    var Scene, reactives;
    reactives = ["angle", "scale", "position", "origin"];
    Scene = (function(_super) {
      __extends(Scene, _super);

      Scene.include(Transformable);

      Scene.include(Groupy);

      function Scene(meta) {
        if (meta == null) {
          meta = {};
        }
        Scene.__super__.constructor.call(this);
        this.name = meta.name != null ? meta.name : "" + (Hal.ID());
        this.bounds = meta.bounds != null ? meta.bounds : Hal.viewportBounds();
        this.paused = true;
        this.bg_color = meta.bg_color != null ? meta.bg_color : "white";
        this.entities = [];
        this.mpos = [0, 0];
        this.z = 1;
        this.g = new Renderer(this.bounds, null, this.z);
        this.draw_stat = true;
        this.update_ents = true;
        this.cam_move = Vec2.acquire();
        this.dragging = false;
        this.start_drag_point = [0, 0];
        this.drag = null;
        this.drag_started = null;
        this.drag_ended = null;
        this.zoom = null;
        this.lerp_anim = null;
        this.zoom_step = 0.1;
        this.camera_speed = 2;
        this._update_zoom = false;
        this.prev_pos = [this.position[0], this.position[1]];
        this.center = Vec2.from(this.bounds[2] * 0.5, this.bounds[3] * 0.5);
        this._update_transform = true;
        this.view_matrix = Matrix3.create();
        this.view_matrix[2] = this.center[0];
        this.view_matrix[5] = this.center[1];
        this.setPosition(0, 0);
        return this;
      }

      Scene.prototype.addEntity = function(ent) {
        this.entities.push(ent);
        ent.attr("scene", this);
        this.trigger("ENTITY_ADDED", ent);
        return ent;
      };

      Scene.prototype.drawStat = function() {
        Hal.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
        Hal.glass.ctx.clearRect(0, 0, 400, 300);
        Hal.glass.ctx.fillStyle = "black";
        Hal.glass.ctx.fillText("FPS: " + Hal.fps, 0, 10);
        Hal.glass.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        Hal.glass.ctx.fillText("Camera position: " + (this.position[0].toFixed(2)) + ", " + (this.position[1].toFixed(2)), 0, 40);
        Hal.glass.ctx.fillText("Camera origin: " + (this.origin[0].toFixed(2)) + ", " + (this.origin[1].toFixed(2)), 0, 55);
        Hal.glass.ctx.fillText("Camera zoom: " + (this.scale[0].toFixed(2)) + ", " + (this.scale[1].toFixed(2)), 0, 70);
        Hal.glass.ctx.fillText("Mouse: " + this.mpos[0] + ", " + this.mpos[1], 0, 85);
        Hal.glass.ctx.fillText("Num of free pool vectors: " + Vec2.free, 0, 100);
        Hal.glass.ctx.fillText("View origin: " + (this.view_matrix[2].toFixed(2)) + ", " + (this.view_matrix[5].toFixed(2)), 0, 115);
        return Hal.glass.ctx.fillText("View scale: " + (this.view_matrix[0].toFixed(2)) + ", " + (this.view_matrix[4].toFixed(2)), 0, 130);
      };

      Scene.prototype.getAllEntities = function() {
        return this.entities.slice();
      };

      Scene.prototype.update = function(delta) {
        var en, _i, _len, _ref, _results;
        this.g.ctx.fillStyle = this.bg_color;
        this.g.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
        if (this._update_transform) {
          this.combineTransform(this.view_matrix);
          this.update_ents = true;
        }
        _ref = this.entities;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          _results.push(en.update(this.g.ctx, delta));
        }
        return _results;
      };

      Scene.prototype.checkForCollisions = function(ent) {
        var check, en, _i, _len, _ref, _results;
        _ref = this.entities;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          if (en === ent) {
            continue;
          }
          check = Geometry.polygonIntersectsOrContainsPolygon(en._mesh, ent._mesh, ent.inverseTransform(), en.transform());
          if (check && !ent.in_collision && !en.in_collision) {
            ent.trigger("COLLISION_STARTED", en);
            _results.push(en.trigger("COLLISION_STARTED", ent));
          } else if (ent.in_collision && en.in_collision && !check) {
            ent.trigger("COLLISION_ENDED", en);
            _results.push(en.trigger("COLLISION_ENDED", ent));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Scene.prototype.draw = function(delta) {
        var en, _i, _len, _ref;
        if (this.draw_stat) {
          this.drawStat();
        }
        _ref = this.entities;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          en.draw(this.g.ctx, delta);
        }
        this.update_ents = false;
        this.g.ctx.setTransform(1, 0, 0, 1, 0, 0);
        return this.g.ctx.strokeRect(this.center[0] - 1, this.center[1] - 1, 2, 2);
      };

      Scene.prototype.pause = function() {
        return this.attr("paused", true);
      };

      Scene.prototype.resume = function() {
        return this.attr("paused", false);
      };

      Scene.prototype.init = function() {
        var _this = this;
        this.paused = false;
        this.on("CHANGE", function(key, val) {
          if (__indexOf.call(reactives, key) >= 0) {
            this._update_transform = true;
            return this._update_inverse = true;
          }
        });
        Hal.on("RESIZE", function(area) {
          _this.g.resize(area.width, area.height);
          _this.bounds[2] = area.width;
          return _this.bounds[3] = area.height;
        });
        Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          Vec2.set(_this.cam_move, (_this.center[0] - pos[0]) + _this.position[0], (_this.center[1] - pos[1]) + _this.position[1]);
          if (_this.lerp_anim) {
            Hal.remove("EXIT_FRAME", _this.lerp_anim);
            _this.lerp_anim = null;
          }
          return _this.lerp_anim = Hal.on("EXIT_FRAME", function(delta) {
            Vec2.lerp(_this.position, _this.position, _this.cam_move, delta * 2);
            if ((~~Math.abs(_this.position[0] - _this.cam_move[0]) + ~~Math.abs(-_this.position[1] + _this.cam_move[1])) < 2) {
              Hal.remove("EXIT_FRAME", _this.lerp_anim);
              _this.lerp_anim = null;
            }
            return _this._update_transform = true;
          });
        });
        this.drag_started = Hal.on("DRAG_STARTED", function(pos) {
          if (_this.paused) {
            return;
          }
          _this.dragging = true;
          _this.start_drag_point[0] = pos[0];
          _this.start_drag_point[1] = pos[1];
          _this.prev_pos = [_this.position[0], _this.position[1]];
          _this._update_transform = true;
          _this._update_inverse = true;
          if (_this.lerp_anim) {
            Hal.remove("EXIT_FRAME", _this.lerp_anim);
            return _this.lerp_anim = null;
          }
        });
        this.drag_ended = Hal.on("DRAG_ENDED", function(pos) {
          return _this.dragging = false;
        });
        this.drag = Hal.on("MOUSE_MOVE", function(pos) {
          if (_this.paused) {
            return;
          }
          if (_this.dragging) {
            _this.position[0] = _this.prev_pos[0] + (pos[0] - _this.start_drag_point[0]);
            _this.position[1] = _this.prev_pos[1] + (pos[1] - _this.start_drag_point[1]);
            _this._update_transform = true;
            return _this._update_inverse = true;
          }
        });
        this.zoom = Hal.on("SCROLL", function(ev) {
          if (_this.paused) {
            return;
          }
          if (ev.down) {
            _this.view_matrix[0] -= _this.zoom_step;
            _this.view_matrix[4] -= _this.zoom_step;
          } else {
            _this.view_matrix[0] += _this.zoom_step;
            _this.view_matrix[4] += _this.zoom_step;
          }
          _this._update_transform = true;
          return _this._update_inverse = true;
        });
        return Scene.__super__.init.call(this);
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
