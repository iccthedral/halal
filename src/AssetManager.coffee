###
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
###
define ["Deferred", "DeferredCounter", "Ajax", "SpriteFactory", "Sprite", "SpriteSheet", "EventDispatcher"], 

(Deferred, DeferredCounter, Ajax, SpriteFactory, Sprite, SpriteSheet, EventDispatcher) ->
  res_url = "/assets/"
  ws_url = "http://localhost:8080"
  extract_type = /^(.*)\.(.*)$/

  class AssetManager extends EventDispatcher
    constructor: () ->
      super()
      @assets = 
        sprites: {},
        spritesheets: {},
        audio: {},
        animation: {}

      @tint_cache = {}
      @wait_queue = []

  AssetManager::setResourcesRelativeURL = (url) ->
    res_url = url
    
  AssetManager::resolvePath = (url) ->
    grps = url.split("/")
    if @assets.hasOwnProperty(grps[0])
      top = @assets[grps[0]]
      for g in grps[1..grps.length-2]
        if not top.hasOwnProperty(g)
          top[g] = {}
        top = top[g]
    key = grps[grps.length-1]
    key = key.substring(0, key.lastIndexOf("."))
    return [top, key]

  AssetManager::addToStorage = (url, obj) ->
    [top, key] = @resolvePath(url)
    top[key] = obj
    return top[key]

  AssetManager::deleteFromStorage = (url) ->
    [top, key] = @resolvePath(url)
    top[key] = null
    delete top[key]

  AssetManager::loadImage = (imgURL) ->
    #parse url to get the version no. of image
    #use that to check if it is in cache (a.k.a storage)
    defer   = new Deferred()
    img     = new Image()
    img.src = imgURL

    img.onload = =>
        defer.resolve(img, img)
    img.onerror = => 
        defer.reject(img, imgURL)

    return defer.promise()

  AssetManager::loadImages = (imgs) ->
      defer = new DeferredCounter(imgs.length)
      for img in imgs
          @loadImage(img)
          .then (x) ->
                  defer.release(@, x)
          .fail (x) ->
                  defer.acquire(@, x)

      return defer.promise()

  AssetManager::tint = (spr, color) ->
    ###
      @todo 
        Treba proveriti velicinu tint kesa, isprazniti ga 
        ako predje neke threshold
    ###
    id = spr.folder + spr.name + color
    if not @tint_cache[id]
      @tint_cache[id] = Hal.im.tintImage(spr.img, color, 0.5)
    return @tint_cache[id]

  AssetManager::loadSprite = (url) ->
    url = res_url + url
    defer = new Deferred()
    @loadImage(url)
    .then (img) =>          
        sprite = SpriteFactory.fromSingleImage(img, url)
        name = sprite.getName()

        #ako je ovaj spraj u waiting redu
        #supeeer, nakaci ga
        if @wait_queue[name]
          log.debug @wait_queue[name]
          @wait_queue[name].changeSprite(sprite)
          delete @wait_queue[url]

        Hal.trigger "SPRITE_LOADED", sprite
        defer.resolve(@, sprite)
    .fail (x) =>
        defer.reject(@, x)
    return defer.promise()

  AssetManager::loadAudio = (audioURL) ->
    defer = new Deferred()
    audio = new Audio(audioURL)
    #audio.src = audioURL

  AssetManager::loadSound = (url) ->
    url = res_url + url
    defer = new Deferred()
    @loadAudio()

  AssetManager::addSprite = (g) ->
    return @loadSprite(g)
      .then (sprite) =>
        @addToStorage(g, sprite)

  AssetManager::addSound = (g) ->
    return @loadSound(g)
     .then (sound) =>
      @addToStorage(g, sound)

  AssetManager::resolveFolderPath = (url) ->
    grps = url.split("/")
    if @assets.hasOwnProperty(grps[0])
      top = @assets[grps[0]]
      if grps.length > 3
        for g in grps[1..grps.length-3]
          if not top.hasOwnProperty(g)
            top[g] = {}
          top = top[g]
    key = grps[grps.length-2]
    return [top, key]

  AssetManager::loadViaSocketIO = () ->
    if not io?
      log.error "Couldn't find socket.io library"
      return
    @socket = io.connect(ws_url)
    
    @socket.on "connect", =>
      log.debug "connected"

    @socket.on "LOAD_SPRITES", (data) =>
      list = JSON.parse(data.files)
      length = list.length
      @trigger "SPRITES_LOADING", length
      for g, i in list
        do (g, i) =>
          @addSprite(data.url + g)
          .then () =>
            @trigger "SPRITE_LOADED", g
            if i >= (length - 1)
              @trigger "SPRITES_LOADED"

    @socket.on "LOAD_SOUNDS", (data) =>
      list = JSON.parse(data.files)
      length = list.length
      @trigger "SOUNDS_LOADING", length
      for g, i in list
        do (g, i) =>
          @addSound(data.url + g)
          .then () =>
            @trigger "SOUND_LOADED"
            if i>= (length - 1)
              @trigger "SOUNDS_LOADED"


    @socket.on "SPRITE_ADDED", (data) =>
      log.debug "sprite added"
      log.debug data
      @addSprite(data.url)

    @socket.on "SPRITESHEET_ADDED", (data) =>
      log.debug data

    @socket.on "SPRITE_DELETED", (data) =>
      log.debug "sprite deleted"
      log.debug data
      @deleteFromStorage(data.url)

    @socket.on "SPRITE_FOLDER_DELETED", (data) =>
      log.debug "sprite folder deleted"
      log.debug data
      [storage, key] = @resolveFolderPath(data.url)
      delete storage[key]
      @trigger "SPRITES_LOADED"

    @socket.on "SPRITE_FOLDER_ADDED", (data) =>
      log.debug "sprite folder added"
      log.debug data
      length = data.files.length
      @trigger "SPRITES_LOADING"
      for file, i in data.files
        log.debug "file: #{file}"
        do (file, i) =>
          log.debug data.url + file
          @addSprite(data.url + file)
          .then () =>
            @trigger "SPRITE_LOADED", file
            if i >= (length - 1)
              @trigger "SPRITES_LOADED"

    @socket.on "SPRITESHEET_DELETED", (data) =>
      log.debug data

  AssetManager::loadSpritesFromFileList = (list) ->
    Ajax.get(list, (data) =>
      data = data.split("\n")
      data.splice(-1)
      length = data.length
      @trigger "SPRITES_LOADING", length
      for spr, i in data
          do (spr, i) =>
            @addSprite(spr)
            .then () =>
              @trigger "SPRITE_LOADED", spr
              if i >= (length - 1)
                @trigger "SPRITES_LOADED"
    )

  AssetManager::loadFromArray = (type, array) ->
    if not type in @assets
      return

  AssetManager::getSprite = (spr) ->
    [store, key] = @resolvePath("sprites/" + spr + ".")
    return store[key]

  AssetManager::getSpritesFromFolder = (folder) ->
    return @getSpriteFolders() if folder is "/"
    ind = folder.indexOf("/") 
    if ind is 0
      folder = folder.substring(ind + 1)      
    ind = folder.charAt(folder.length-1)
    if ind isnt "/"
      folder = "#{folder}/"
    out = {}
    [storage, key] = @resolveFolderPath("sprites/" + folder)
    for k, v of storage[key]
      if v.img?
        out[k] = v
    return out

  AssetManager::getSpriteFoldersFromFolder = (folder) ->
    ind = folder.indexOf("/") 
    if ind is 0
      folder = folder.substring(ind + 1)      
    ind = folder.charAt(folder.length-1)
    if ind isnt "/"
      folder = "#{folder}/"
    out = {}
    [storage, key] = @resolveFolderPath("sprites/" + folder)
    for k, v of storage[key]
      if not v.img?
        out[k] = v
    return out
    
  AssetManager::getSpriteFolders = () ->
    # log.info Object.keys(@assets.sprites)
    return @assets.sprites

  AssetManager::waitFor = (spr_instance, sprurl) ->
    @wait_queue[sprurl] = spr_instance

  return AssetManager