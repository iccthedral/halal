(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["halalentity", "renderer", "matrix3", "quadtree", "vec2", "geometry", "transformable", "groupy"], function(HalalEntity, Renderer, Matrix3, QuadTree, Vec2, Geometry, Transformable, Groupy) {
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
        this.parseMeta(meta);
        this.bounds = Hal.viewportBounds();
        this.world_bounds = Hal.viewportBounds();
        this.entities = [];
        this.ent_cache = {};
        this.z = 0;
        this.renderer = new Renderer(this.bounds, null, this.z, true);
        this.ctx = this.renderer.getLayerContext(this.z);
        this.draw_stat = true;
        this.update_ents = true;
        this.cam_move_vector = Vec2.from(0, 0);
        this.is_camera_panning = false;
        this.camera_panning_point = [0, 0];
        this.zoom_step = 0.05;
        this.camera_speed = 2;
        this._update_zoom = false;
        this.center = Vec2.from(this.bounds[2] * 0.5, this.bounds[3] * 0.5);
        this.view_matrix = Matrix3.create();
        this.camera_moved = false;
        this.view_matrix[2] = this.center[0];
        this.view_matrix[5] = this.center[1];
        this.combineTransform(this.view_matrix);
        this.prev_pos = [this.position[0], this.position[1]];
        this.zoom_limits = [0.3, 2.3];
        this.visible_ents = [];
        return this;
      }

      Scene.prototype.parseMeta = function(meta) {
        this.name = meta.name != null ? meta.name : "" + (Hal.ID());
        this.bg_color = meta.bg_color != null ? meta.bg_color : "white";
        this.draw_stat = meta.draw_stat != null ? meta.draw_stat : true;
        this.world_bounds = meta.world_bounds != null ? meta.world_bounds : Hal.viewportBounds();
        return this.zoom_limits = meta.zoom_limits != null ? meta.zoom_limits : void 0;
      };

      Scene.prototype.addEntity = function(ent, ctx) {
        if (ctx == null) {
          ctx = this.ctx;
        }
        if (ent == null) {
          lloge("Entity is null");
          return;
        }
        ent.attr("ctx", ctx);
        ent.attr("scene", this);
        this.entities.push(ent);
        this.ent_cache[ent.id] = ent;
        this.trigger("ENTITY_ADDED", ent);
        this.update_ents = true;
        ent.trigger("ON_SCENE");
        return ent;
      };

      Scene.prototype.addEntityToQuadSpace = function(ent, ctx) {
        if (ctx == null) {
          ctx = this.ctx;
        }
        this.addEntity(ent, ctx);
        this.quadtree.insert(ent);
        ent.trigger("IN_QUADSPACE");
        return ent;
      };

      Scene.prototype.drawStat = function() {
        Hal.glass.ctx.clearRect(0, 0, 400, 300);
        Hal.glass.ctx.fillText("FPS: " + Hal.fps, 0, 10);
        Hal.glass.ctx.fillText("Num of entities: " + this.entities.length, 0, 25);
        Hal.glass.ctx.fillText("Camera position: " + (this.position[0].toFixed(2)) + ", " + (this.position[1].toFixed(2)), 0, 40);
        Hal.glass.ctx.fillText("Camera origin: " + (this.origin[0].toFixed(2)) + ", " + (this.origin[1].toFixed(2)), 0, 55);
        Hal.glass.ctx.fillText("Num of visible entities: " + this.visible_ents.length, 0, 70);
        Hal.glass.ctx.fillText("Num of free pool vectors: " + Vec2.free, 0, 85);
        Hal.glass.ctx.fillText("View origin: " + (this.view_matrix[2].toFixed(2)) + ", " + (this.view_matrix[5].toFixed(2)), 0, 100);
        return Hal.glass.ctx.fillText("View scale: " + (this.view_matrix[0].toFixed(2)) + ", " + (this.view_matrix[4].toFixed(2)), 0, 115);
      };

      Scene.prototype.getAllEntities = function() {
        return this.entities.slice();
      };

      Scene.prototype.update = function(delta) {
        var en, _i, _len, _ref, _results;
        if (this._update_transform) {
          this.combineTransform(this.view_matrix);
          this.update_ents = true;
        }
        if (this.update_ents) {
          this.visible_ents = [];
          this.quadtree.findEntitiesInRectangle(this.search_range, this._transform, this.visible_ents);
        }
        _ref = this.visible_ents;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          _results.push(en.update(delta));
        }
        return _results;
      };

      Scene.prototype.checkForCollisions = function() {
        var enA, enB, _i, _len, _ref, _results;
        _ref = this.entities;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          enA = _ref[_i];
          _results.push((function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.entities;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              enB = _ref1[_j];
              if (enA === enB) {
                continue;
              }
              if (Geometry.polygonIntersectsOrContainsPolygon(enA._mesh, enB._mesh, enB.inverseTransform(), enA.transform())) {
                _results1.push(enA.trigger("COLLISION_HAPPENED", enB));
              } else {
                _results1.push(void 0);
              }
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      Scene.prototype.draw = function(delta) {
        var en, _i, _len, _ref;
        this.clearRenderers();
        if (this.draw_stat) {
          this.drawStat();
        }
        _ref = this.visible_ents;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          en = _ref[_i];
          en.draw(delta);
        }
        return this.update_ents = false;
      };

      Scene.prototype.clearRenderers = function() {
        var ctx, _i, _len, _ref;
        _ref = this.renderer.contexts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ctx = _ref[_i];
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, this.bounds[2], this.bounds[3]);
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(0, 0, this.bounds[2], this.bounds[3]);
        return this.ctx.strokeRect(this.center[0] - 1, this.center[1] - 1, 2, 2);
      };

      Scene.prototype.pause = function() {
        return this.attr("paused", true);
      };

      Scene.prototype.resume = function() {
        return this.attr("paused", false);
      };

      Scene.prototype.removeEntity = function(ent) {
        var ind, _ref;
        if (!this.ent_cache[ent.id]) {
          lloge("No such entity " + ent.id + " in cache");
          return;
        }
        ind = this.entities.indexOf(ent);
        if (ind === -1) {
          lloge("No such entity " + ent.id + " in entity list");
          return;
        }
        if ((_ref = QuadTree.fromCache(ent.id)) != null) {
          _ref.remove(ent);
        }
        delete this.ent_cache[ent.id];
        this.trigger("ENTITY_DESTROYED", ent);
        this.entities.splice(ind, 1);
        return this.update_ents = true;
      };

      Scene.prototype.removeAllEntities = function(destroy_children) {
        var ent, _i, _len, _ref;
        if (destroy_children == null) {
          destroy_children = false;
        }
        _ref = this.getAllEntities();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ent = _ref[_i];
          this.removeEntity(ent);
        }
      };

      Scene.prototype.removeEntityByID = function(entid) {
        var ent;
        ent = this.ent_cache[entid];
        if (ent != null) {
          return ent.removeEntity(ent);
        } else {
          return llogw("No such entity " + entid + " in entity cache");
        }
      };

      /* valja sve unregistorovati posle*/


      Scene.prototype.init = function() {
        Scene.__super__.init.call(this);
        this.pause();
        this.search_range = this.bounds.slice();
        this.camera_panning_started = null;
        this.camera_panning_started = null;
        this.camera_panning_ended = null;
        this.camera_zoom_listener = null;
        this.camera_lerp_listener = null;
        this.camera_frame_listener = null;
        this.resize_listener = null;
        this.resetQuadTree(this.world_bounds);
        return this.resume();
      };

      Scene.prototype.screenToWorld = function(point) {
        return Geometry.transformPoint(point[0], point[1], this.inverseTransform());
      };

      Scene.prototype.worldToScreen = function(point) {
        return Geometry.transformPoint(point[0], point[1], this.transform());
      };

      Scene.prototype.resetQuadTree = function(bounds) {
        if (this.quadtree != null) {
          this.quadtree.removeAll();
        }
        this.quadtree = new QuadTree(bounds);
        return this.quadtree.divide();
      };

      Scene.prototype.setWorldBounds = function(world_bounds) {
        this.world_bounds = world_bounds;
        this.resetQuadTree(this.world_bounds);
      };

      Scene.prototype.setBounds = function(bounds) {
        this.bounds = bounds;
      };

      Scene.prototype.drawQuadTree = function(quadtree) {
        if (this.paused) {
          return;
        }
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        if (quadtree.nw != null) {
          this.drawQuadTree(quadtree.nw);
          this.ctx.strokeRect(quadtree.nw.bounds[0], quadtree.nw.bounds[1], quadtree.nw.bounds[2], quadtree.nw.bounds[3]);
          this.ctx.fillText("" + quadtree.nw.id, quadtree.nw.bounds[0] + quadtree.nw.bounds[2] * 0.5, quadtree.nw.bounds[1] + quadtree.nw.bounds[3] * 0.5);
        }
        if (quadtree.ne != null) {
          this.drawQuadTree(quadtree.ne);
          this.ctx.strokeRect(quadtree.ne.bounds[0], quadtree.ne.bounds[1], quadtree.ne.bounds[2], quadtree.ne.bounds[3]);
          this.ctx.fillText("" + quadtree.ne.id, quadtree.ne.bounds[0] + quadtree.ne.bounds[2] * 0.5, quadtree.ne.bounds[1] + quadtree.ne.bounds[3] * 0.5);
        }
        if (quadtree.sw != null) {
          this.drawQuadTree(quadtree.sw);
          this.ctx.strokeRect(quadtree.sw.bounds[0], quadtree.sw.bounds[1], quadtree.sw.bounds[2], quadtree.sw.bounds[3]);
          this.ctx.fillText("" + quadtree.sw.id, quadtree.sw.bounds[0] + quadtree.sw.bounds[2] * 0.5, quadtree.sw.bounds[1] + quadtree.sw.bounds[3] * 0.5);
        }
        if (quadtree.se != null) {
          this.drawQuadTree(quadtree.se);
          this.ctx.strokeRect(quadtree.se.bounds[0], quadtree.se.bounds[1], quadtree.se.bounds[2], quadtree.se.bounds[3]);
          return this.ctx.fillText("" + quadtree.se.id, quadtree.se.bounds[0] + quadtree.se.bounds[2] * 0.5, quadtree.se.bounds[1] + quadtree.se.bounds[3] * 0.5);
        }
      };

      Scene.prototype.disablePanning = function() {
        Hal.removeTrigger("DRAG_STARTED", this.camera_panning_started);
        Hal.removeTrigger("DRAG_ENDED", this.camera_panning_ended);
        Hal.removeTrigger("MOUSE_MOVE", this.camera_panning_listener);
        this.camera_panning_listener = null;
        this.camera_panning_ended = null;
        return this.camera_panning_started = null;
      };

      Scene.prototype.enablePanning = function() {
        var _this = this;
        if (this.camera_panning_listener == null) {
          this.camera_panning_started = Hal.on("DRAG_STARTED", function(pos) {
            if (_this.paused) {
              return;
            }
            _this.is_camera_panning = true;
            _this.camera_panning_point[0] = pos[0];
            _this.camera_panning_point[1] = pos[1];
            _this.prev_pos = [_this.position[0], _this.position[1]];
            _this._update_transform = true;
            _this._update_inverse = true;
            if (_this.camera_frame_listener) {
              Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
              return _this.camera_frame_listener = null;
            }
          });
        }
        if (this.camera_panning_ended == null) {
          this.camera_panning_ended = Hal.on("DRAG_ENDED", function(pos) {
            _this.is_camera_panning = false;
            _this._update_transform = true;
            return _this._update_inverse = true;
          });
        }
        if (this.camera_panning_listener == null) {
          return this.camera_panning_listener = Hal.on("MOUSE_MOVE", function(pos) {
            if (_this.paused) {
              return;
            }
            if (_this.is_camera_panning) {
              _this.position[0] = _this.prev_pos[0] + (pos[0] - _this.camera_panning_point[0]);
              _this.position[1] = _this.prev_pos[1] + (pos[1] - _this.camera_panning_point[1]);
              _this._update_transform = true;
              return _this._update_inverse = true;
            }
          });
        }
      };

      Scene.prototype.destroy = function() {
        this.pause();
        Vec2.release(this.center);
        Vec2.release(this.cam_move_vector);
        this.removeAllEntities();
        this.renderer.destroy();
        this.quadtree.removeAll();
        this.quadtree = null;
        this.renderer = null;
        Hal.trigger("SCENE_REQ_DESTROY", this);
        return Scene.__super__.destroy.call(this);
      };

      Scene.prototype.destroyListeners = function() {
        Scene.__super__.destroyListeners.call(this);
        Hal.removeTrigger("SCROLL", this.camera_zoom_listener);
        Hal.removeTrigger("MOUSE_MOVE", this.camera_panning_listener);
        Hal.removeTrigger("DRAG_STARTED", this.camera_panning_started);
        Hal.removeTrigger("DRAG_ENDED", this.camera_panning_ended);
        Hal.removeTrigger("RIGHT_CLICK", this.camera_lerp_listener);
        Hal.removeTrigger("RESIZE", this.resize_listener);
        return Hal.removeTrigger("EXIT_FRAME", this.camera_frame_listener);
      };

      Scene.prototype.initListeners = function() {
        var _this = this;
        Scene.__super__.initListeners.call(this);
        this.on("CHANGE", function(key, val) {
          if (this.paused) {
            return;
          }
          if (__indexOf.call(reactives, key) >= 0) {
            this._update_transform = true;
            return this._update_inverse = true;
          }
        });
        this.on("ENTITY_REQ_DESTROYING", function(entity) {
          return this.removeEntity(entity);
        });
        this.resize_listener = Hal.on("RESIZE", function(area) {
          _this.renderer.resize(area.width, area.height);
          _this.bounds[2] = area.width;
          _this.bounds[3] = area.height;
          _this._update_transform = true;
          _this._update_inverse = true;
          return _this.search_range = _this.bounds.slice();
        });
        this.camera_lerp_listener = Hal.on("RIGHT_CLICK", function(pos) {
          if (_this.paused) {
            return;
          }
          Vec2.set(_this.cam_move_vector, (_this.center[0] - pos[0]) + _this.position[0], (_this.center[1] - pos[1]) + _this.position[1]);
          if (_this.camera_frame_listener) {
            Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
            _this.camera_frame_listener = null;
            _this._update_transform = true;
            _this._update_inverse = true;
          }
          return _this.camera_frame_listener = Hal.on("EXIT_FRAME", function(delta) {
            Vec2.lerp(_this.position, _this.position, _this.cam_move_vector, delta * 2);
            if ((~~Math.abs(_this.position[0] - _this.cam_move_vector[0]) + ~~Math.abs(-_this.position[1] + _this.cam_move_vector[1])) < 2) {
              Hal.removeTrigger("EXIT_FRAME", _this.camera_frame_listener);
              _this.camera_frame_listener = null;
            }
            _this._update_transform = true;
            return _this._update_inverse = true;
          });
        });
        return this.camera_zoom_listener = Hal.on("SCROLL", function(ev) {
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
          _this.view_matrix[0] = Hal.math.clamp(_this.view_matrix[0], _this.zoom_limits[0], _this.zoom_limits[1]);
          _this.view_matrix[4] = Hal.math.clamp(_this.view_matrix[4], _this.zoom_limits[0], _this.zoom_limits[1]);
          _this._update_transform = true;
          return _this._update_inverse = true;
        });
      };

      return Scene;

    })(HalalEntity);
    return Scene;
  });

}).call(this);
