/*
Deferred i DeferredCounter
AssetManager
 -> @load()
    -> loads everything, updates on progress
        loading is executed upon establishing a connection to a websockets server
        or with an explicit function call that accepts a string referring to a 
        a file with a list of assets 
        . server listens on a port 9000 and sends out a message of a format which 
          is described in it's source file
          e.g 
            {type: "sprites", files: ["fileA.png"]}
            {type: "audio", files: ["fileB.ogg"]}

 -> @loadFromArray(@@type: string, @@in: array)
        @@insets from @@in array
         e.g @loadFromArray("sprites", ["fileA.png"])

 -> @loadFromFileList(@@list: string)
        @@list: 
         loads assets that are listed in a file 
         e.g 
            @loadFromFileList("assets_amjad_01.list")

 -> what gets loaded and how?
  - sprites 
    . located in assets/sprite folder
    . just a single image, that is, it isn't a spritesheet
  
  - spritesheets
    . located in assets/spritesheets folder
    . sheets of images in a TexturePacker format and perhaps in the future
      in one of my own (with tar compression support)

  - audio
    . wav or ogg formats which are 
      the most widely supported on today's web browsers
      aac is left out because of its size which isn't very practical
      for a game engine

  - how it's loaded and stored?

    @assets = {
        @sprites: []
        @spritesheets: []
        @audio: []
        @animation: []
    }
    
    Hal("load sprites from folder abcde")
    Hal("
        spr = sprite("horse");
        move spr to @x @y
    ")

    @on "each frame if selected"
        crtaj se u nekom fazonu

    @on["each frame"] = on_selected radi ono gore

    on frame repeat true
    @on "each right click and frame if selected" () ->
        moveonpath @pos @mpos

    a onda moveonpath moze da boji tajlove pod kojima entitet prolazi
    ili da ih markira, ili samo da se proseta
    mozda da ide napred-nazad?

-> provides specialized functions to retrieve assets by their name

-> @getSprite(group_name)
 -group
    refers to a folder where the sprite is
 -name 
    refers to a image file name

usage:
    @getSprite("horses/whitehorse")
    @getSprite("horses/white/shadowfax)

-> @getSpritesFrom(folder)
folder
    refers to a folder where the sprites are
returns:
    list of all sprites in a folder
usage: 
    @getSpritesFrom("horses")
*/


(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["deferred", "deferredounter", "ajax", "spritefactory", "sprite", "spritesheet", "eventdispatcher"], function(Deferred, DeferredCounter, Ajax, SpriteFactory, Sprite, SpriteSheet, EventDispatcher) {
    var AssetManager, extract_type, res_url, ws_url;
    res_url = "/assets/";
    ws_url = "http://localhost:8080";
    extract_type = /^(.*)\.(.*)$/;
    AssetManager = (function(_super) {
      __extends(AssetManager, _super);

      function AssetManager() {
        AssetManager.__super__.constructor.call(this);
        this.assets = {
          sprites: {},
          spritesheets: {},
          audio: {},
          animation: {}
        };
        this.tint_cache = {};
        this.wait_queue = [];
      }

      return AssetManager;

    })(EventDispatcher);
    AssetManager.prototype.setResourcesRelativeURL = function(url) {
      return res_url = url;
    };
    AssetManager.prototype.resolvePath = function(url) {
      var g, grps, key, top, _i, _len, _ref;
      grps = url.split("/");
      if (this.assets.hasOwnProperty(grps[0])) {
        top = this.assets[grps[0]];
        _ref = grps.slice(1, +(grps.length - 2) + 1 || 9e9);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          g = _ref[_i];
          if (!top.hasOwnProperty(g)) {
            top[g] = {};
          }
          top = top[g];
        }
      }
      key = grps[grps.length - 1];
      key = key.substring(0, key.lastIndexOf("."));
      return [top, key];
    };
    AssetManager.prototype.addToStorage = function(url, obj) {
      var key, top, _ref;
      _ref = this.resolvePath(url), top = _ref[0], key = _ref[1];
      top[key] = obj;
      return top[key];
    };
    AssetManager.prototype.deleteFromStorage = function(url) {
      var key, top, _ref;
      _ref = this.resolvePath(url), top = _ref[0], key = _ref[1];
      top[key] = null;
      return delete top[key];
    };
    AssetManager.prototype.loadImage = function(imgURL) {
      var defer, img,
        _this = this;
      defer = new Deferred();
      img = new Image();
      img.src = imgURL;
      img.onload = function() {
        return defer.resolve(img, img);
      };
      img.onerror = function() {
        return defer.reject(img, imgURL);
      };
      return defer.promise();
    };
    AssetManager.prototype.loadImages = function(imgs) {
      var defer, img, _i, _len;
      defer = new DeferredCounter(imgs.length);
      for (_i = 0, _len = imgs.length; _i < _len; _i++) {
        img = imgs[_i];
        this.loadImage(img).then(function(x) {
          return defer.release(this, x);
        }).fail(function(x) {
          return defer.acquire(this, x);
        });
      }
      return defer.promise();
    };
    AssetManager.prototype.tint = function(spr, color) {
      /*
        @todo 
          Treba proveriti velicinu tint kesa, isprazniti ga 
          ako predje neke threshold
      */

      var id;
      id = spr.folder + spr.name + color;
      if (!this.tint_cache[id]) {
        this.tint_cache[id] = Hal.im.tintImage(spr.img, color, 0.5);
      }
      return this.tint_cache[id];
    };
    AssetManager.prototype.loadSprite = function(url) {
      var defer,
        _this = this;
      url = res_url + url;
      defer = new Deferred();
      this.loadImage(url).then(function(img) {
        var name, sprite;
        sprite = SpriteFactory.fromSingleImage(img, url);
        name = sprite.getName();
        if (_this.wait_queue[name]) {
          log.debug(_this.wait_queue[name]);
          _this.wait_queue[name].changeSprite(sprite);
          delete _this.wait_queue[url];
        }
        Hal.trigger("SPRITE_LOADED", sprite);
        return defer.resolve(_this, sprite);
      }).fail(function(x) {
        return defer.reject(_this, x);
      });
      return defer.promise();
    };
    AssetManager.prototype.loadAudio = function(audioURL) {
      var audio, defer;
      defer = new Deferred();
      return audio = new Audio(audioURL);
    };
    AssetManager.prototype.loadSound = function(url) {
      var defer;
      url = res_url + url;
      defer = new Deferred();
      return this.loadAudio();
    };
    AssetManager.prototype.addSprite = function(g) {
      var _this = this;
      return this.loadSprite(g).then(function(sprite) {
        return _this.addToStorage(g, sprite);
      });
    };
    AssetManager.prototype.addSound = function(g) {
      var _this = this;
      return this.loadSound(g).then(function(sound) {
        return _this.addToStorage(g, sound);
      });
    };
    AssetManager.prototype.resolveFolderPath = function(url) {
      var g, grps, key, top, _i, _len, _ref;
      grps = url.split("/");
      if (this.assets.hasOwnProperty(grps[0])) {
        top = this.assets[grps[0]];
        if (grps.length > 3) {
          _ref = grps.slice(1, +(grps.length - 3) + 1 || 9e9);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            g = _ref[_i];
            if (!top.hasOwnProperty(g)) {
              top[g] = {};
            }
            top = top[g];
          }
        }
      }
      key = grps[grps.length - 2];
      return [top, key];
    };
    AssetManager.prototype.loadViaSocketIO = function() {
      var _this = this;
      if (typeof io === "undefined" || io === null) {
        log.error("Couldn't find socket.io library");
        return;
      }
      this.socket = io.connect(ws_url);
      this.socket.on("connect", function() {
        return log.debug("connected");
      });
      this.socket.on("LOAD_SPRITES", function(data) {
        var g, i, length, list, _i, _len, _results;
        list = JSON.parse(data.files);
        length = list.length;
        _this.trigger("SPRITES_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSprite(data.url + g).then(function() {
              _this.trigger("SPRITE_LOADED", g);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("LOAD_SOUNDS", function(data) {
        var g, i, length, list, _i, _len, _results;
        list = JSON.parse(data.files);
        length = list.length;
        _this.trigger("SOUNDS_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          g = list[i];
          _results.push((function(g, i) {
            return _this.addSound(data.url + g).then(function() {
              _this.trigger("SOUND_LOADED");
              if (i >= (length - 1)) {
                return _this.trigger("SOUNDS_LOADED");
              }
            });
          })(g, i));
        }
        return _results;
      });
      this.socket.on("SPRITE_ADDED", function(data) {
        log.debug("sprite added");
        log.debug(data);
        return _this.addSprite(data.url);
      });
      this.socket.on("SPRITESHEET_ADDED", function(data) {
        return log.debug(data);
      });
      this.socket.on("SPRITE_DELETED", function(data) {
        log.debug("sprite deleted");
        log.debug(data);
        return _this.deleteFromStorage(data.url);
      });
      this.socket.on("SPRITE_FOLDER_DELETED", function(data) {
        var key, storage, _ref;
        log.debug("sprite folder deleted");
        log.debug(data);
        _ref = _this.resolveFolderPath(data.url), storage = _ref[0], key = _ref[1];
        delete storage[key];
        return _this.trigger("SPRITES_LOADED");
      });
      this.socket.on("SPRITE_FOLDER_ADDED", function(data) {
        var file, i, length, _i, _len, _ref, _results;
        log.debug("sprite folder added");
        log.debug(data);
        length = data.files.length;
        _this.trigger("SPRITES_LOADING");
        _ref = data.files;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          file = _ref[i];
          log.debug("file: " + file);
          _results.push((function(file, i) {
            log.debug(data.url + file);
            return _this.addSprite(data.url + file).then(function() {
              _this.trigger("SPRITE_LOADED", file);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(file, i));
        }
        return _results;
      });
      return this.socket.on("SPRITESHEET_DELETED", function(data) {
        return log.debug(data);
      });
    };
    AssetManager.prototype.loadSpritesFromFileList = function(list) {
      var _this = this;
      return Ajax.get(list, function(data) {
        var i, length, spr, _i, _len, _results;
        data = data.split("\n");
        data.splice(-1);
        length = data.length;
        _this.trigger("SPRITES_LOADING", length);
        _results = [];
        for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
          spr = data[i];
          _results.push((function(spr, i) {
            return _this.addSprite(spr).then(function() {
              _this.trigger("SPRITE_LOADED", spr);
              if (i >= (length - 1)) {
                return _this.trigger("SPRITES_LOADED");
              }
            });
          })(spr, i));
        }
        return _results;
      });
    };
    AssetManager.prototype.loadFromArray = function(type, array) {
      var _ref;
      if (_ref = !type, __indexOf.call(this.assets, _ref) >= 0) {

      }
    };
    AssetManager.prototype.getSprite = function(spr) {
      var key, store, _ref;
      _ref = this.resolvePath("sprites/" + spr + "."), store = _ref[0], key = _ref[1];
      return store[key];
    };
    AssetManager.prototype.getSpritesFromFolder = function(folder) {
      var ind, k, key, out, storage, v, _ref, _ref1;
      if (folder === "/") {
        return this.getSpriteFolders();
      }
      ind = folder.indexOf("/");
      if (ind === 0) {
        folder = folder.substring(ind + 1);
      }
      ind = folder.charAt(folder.length - 1);
      if (ind !== "/") {
        folder = "" + folder + "/";
      }
      out = {};
      _ref = this.resolveFolderPath("sprites/" + folder), storage = _ref[0], key = _ref[1];
      _ref1 = storage[key];
      for (k in _ref1) {
        v = _ref1[k];
        if (v.img != null) {
          out[k] = v;
        }
      }
      return out;
    };
    AssetManager.prototype.getSpriteFoldersFromFolder = function(folder) {
      var ind, k, key, out, storage, v, _ref, _ref1;
      ind = folder.indexOf("/");
      if (ind === 0) {
        folder = folder.substring(ind + 1);
      }
      ind = folder.charAt(folder.length - 1);
      if (ind !== "/") {
        folder = "" + folder + "/";
      }
      out = {};
      _ref = this.resolveFolderPath("sprites/" + folder), storage = _ref[0], key = _ref[1];
      _ref1 = storage[key];
      for (k in _ref1) {
        v = _ref1[k];
        if (v.img == null) {
          out[k] = v;
        }
      }
      return out;
    };
    AssetManager.prototype.getSpriteFolders = function() {
      return this.assets.sprites;
    };
    AssetManager.prototype.waitFor = function(spr_instance, sprurl) {
      return this.wait_queue[sprurl] = spr_instance;
    };
    return AssetManager;
  });

}).call(this);
