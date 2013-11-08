fs      = require("fs")
io      = require("socket.io").listen(8080, {log: false})
path    = require("path")
wrench  = require("wrench")
watchr  = require("watchr")
colors  = require('colors')
Q       = require("q")
Buffer  = require("buffer").Buffer

socket          = undefined
                #/^.*\/public\/assets\/((.*?)\/(.*\.[png|jpg|ogg|json|wav]+))$/
parse_dir       = /^public\/assets\/((.*?)\/(.*))$/

is_sprite      = is_spritesheet = /^.*\.[png|jpg]+$/
is_json        = /^.*\.[json]+$/
baseDir         = "public"
curDir          = process.cwd()
isWin           = !!process.platform.match(/^win/)
publicDir       = curDir + path.sep + baseDir
resourceDir     = publicDir + path.sep + "assets"
spriteDir       = resourceDir + path.sep + "sprites" + path.sep
spriteSheetsDir = resourceDir + path.sep + "spritesheets" + path.sep
mapsDir         = resourceDir + path.sep + "maps" + path.sep

if isWin
    is_resource     = /^.*\\public\\assets\\((.*?)\\(.*\.?[png|jpg|ogg|json|wav]*))$/ 
else
    is_resource     = /^.*\/public\/assets\/((.*?)\/(.*\.?[png|jpg|ogg|json|wav]*))$/ 

io.sockets.on "connection", (sck) ->
    socket = sck

    allSprites = getAllSprites()
    saveSprites(allSprites)

    socket.emit("LOAD_SPRITES", {
        files: JSON.stringify(allSprites)
        url: "sprites/"
    })

    allMaps = wrench.readdirSyncRecursive(mapsDir)
    allMaps = allMaps.filter((x) -> return is_json.test(x))

    if isWin
        allMaps = allMaps.map (x) -> return x.replace(/\\/g,'\/')

    socket.emit "LOAD_MAPS", JSON.stringify(allMaps)

    initSocketListeners()

resources = 
    tileslist: resourceDir + path.sep + "amjad" + path.sep + "TilesList.json"
    patterns: resourceDir + path.sep + "amjad" + path.sep + "Patterns.json"
    maps: resourceDir + path.sep + "maps" + path.sep + "maps.list"
    sprites: spriteDir + path.sep + "sprites.list"
    spritesheets: spriteSheetsDir + path.sep + "spritesheets.list"

sockEmit = (msg, data) ->
    if socket?
        socket.emit msg, data
    else
        console.log "no websock connection".red

##########watch maps##############
watchr.watch
    paths: [mapsDir]
    listeners:
        change: (type, fpath, fcurstat, fprevstat) ->


##########watch sprites###########
watchr.watch
    paths: [spriteDir]
    listeners:
        log: (loglevel) ->
            #console.log arguments
        error: (err) ->
            #console.log "error occured: " + err
        change: (type, fpath, fileCurrentStat, filePreviousStat) ->
            #console.log "watch event = #{type}".cyan
            #console.log "path = #{fpath}".green
            matches = is_resource.exec(fpath)

            return if not matches? or matches.length < 4
            url = matches[1]
            type = matches[2]
            if isWin
                url = url.replace(/\\/g, "\/")
            #console.log "url: #{url}".yellow

            if type is "sprites"
                allSprites = wrench.readdirSyncRecursive(spriteDir)

            if type is "delete"
                if is_sprite.test(fpath)
                    #console.log("deleted sprite")
                    sockEmit "SPRITE_DELETED", {
                        url: url
                    }
                    #emit deleted sprite
                else
                    #console.log("deleted directory")
                    sockEmit "SPRITE_FOLDER_DELETED", {
                        url: url + "/"
                    }
                    #emit deleted sprite folder

            else if type is "create"
                if is_sprite.test(fpath)
                    #console.log("created sprite")
                    sockEmit "SPRITE_ADDED", {url: url}
                else
                    #console.log("created directory")
                    files = wrench.readdirSyncRecursive(fpath)
                    data = files.filter((x) -> return is_sprite.test(x))
                    if isWin
                        data = data.map (x) -> return x.replace(/\\/g, '\/')
                    sockEmit "SPRITE_FOLDER_ADDED", {
                        files: data
                        url: url + "\/"
                    }

            else if type is "update"
                if is_sprite.test(fpath)
                    #console.log("updated sprite")
                else
                    #console.log("updated directory")

                #is_dir = fs.statSync(fpath).isDirectory()
            #console.log "is directory: " + is_dir
            #console.log arguments
##############################################

getAllSprites = () ->
    allSprites = wrench.readdirSyncRecursive(spriteDir)
    #console.log allSprites
    console.log "Is windows: #{isWin}"
    console.log "Platform #{process.platform}"

    allSprites = allSprites.filter((x) -> return is_sprite.test(x))
    if isWin
        allSprites = allSprites.map (x) -> return x.replace(/\\/g,"\/")
    return allSprites

saveSprites = (sprites) ->
    sprites = sprites.map(
        (x) ->
            return "sprites/#{x}"
    )
    fs.writeFileSync(resources.sprites, sprites.join().replace(/,/g,"\n"))

initSocketListeners = () ->
    socket.on "NEW_TILE", (data) ->
        tile = JSON.parse(data.tile)
        console.log "new tile #{tile.name}".yellow
        list = JSON.parse(fs.readFileSync(resources.tileslist))
        list[tile.name] = tile
        fs.writeFileSync(resources.tileslist, JSON.stringify(list))
        socket.emit "TILE_ADDED", tile
    
    socket.on "NEW_PATTERN", (data) ->
        console.log "new pattern added".yellow
        console.log data
        list = JSON.parse(fs.readFileSync(resources.patterns))
        pat = JSON.parse(data.pattern)
        list[data.name] = pat
        fs.writeFileSync(resources.patterns, JSON.stringify(list))
        socket.emit "PATTERN_ADDED", data

    socket.on "NEW_MAP", (data) ->
        console.log "new map #{data.name}".yellow
        fs.writeFileSync(resourceDir + path.sep + "maps" + path.sep + data.name + ".json", data.map);
        socket.emit "MAP_SAVED", data.name

    socket.on "DELETE_TILE", (data) ->
        level = data.level
        name = data.name
        console.log "delete tile #{level} - #{name}".yellow
        list = JSON.parse(fs.readFileSync(resources.tileslist))
        delete list[name]
        fs.writeFileSync(resources.tileslist, JSON.stringify(list))
        socket.emit "TILE_DELETED", {level: level, name: name}

# monitor_resources = (x, action, is_dir) ->
#     if is_dir
#         matches = parse_dir.exec(x)
#     else
#         matches = is_resource.exec(x)

#     if matches.length < 4
#         return

#     res_dir = resourceDir + path.sep + matches[2]
#     console.log(res_dir)
#     files = wrench.readdirSyncRecursive(res_dir)

#     if matches[2] == "sprites"
#         data = files.filter((x) -> return is_sprite.test(x))
#         data = data.map (x) -> return "sprites/" + x
#     else if matches[2] == "spritesheets"
#         data = files.filter (x) -> return is_spritesheet.test(x)
#     else if matches[2] == "maps"
#         data = files.filter (x) -> return is_json.test(x)

#     fs.writeFileSync(res_dir + path.sep + matches[2] + '.list', data.join().replace(/,/g,"\n"))
    
#     socket.emit((matches[2] + "_" + action).toUpperCase(), {
#         url: matches[1]
#     })

module.exports = (grunt) ->
    grunt.loadNpmTasks "grunt-contrib-uglify"
    grunt.loadNpmTasks "grunt-contrib-connect"
    grunt.loadNpmTasks "grunt-contrib-watch"
    grunt.loadNpmTasks "grunt-contrib-coffee"

    grunt.initConfig
        pkg: grunt.file.readJSON "package.json"
        
        coffee: 
            glob_all: 
                expand: true,
                cwd: baseDir + path.sep + "js" + path.sep,
                src: ['**/*.coffee'],
                dest: baseDir + path.sep + "js" + path.sep,
                ext: '.js'

        uglify:
            halal:          
                options:
                    banner: "/*! amjad.js <%= grunt.template.today('yyyy-mm-dd') %> */\n"
                    compress: true
                files:
                    src: baseDir + "/js/halal/**/*.js"
                    dest: baseDir + "/halal.js"
        connect: 
            server:
                options:
                    keepalive: false
                    port: 9000
                    base: baseDir
                    debug: false

        watch:
            coffee: 
                files: [
                    baseDir + '/js/halal/**/*.coffee', 
                    baseDir + "/js/main.coffee", 
                    baseDir + "/js/main_editor.coffee",
                    baseDir + "/js/main_game.coffee",
                    baseDir + "/js/amjad/**/*.coffee",
                    baseDir + "/js/scenes/**/*.coffee"
                    baseDir + "/js/amjad/tiles/**/*.coffee"
                ]
                tasks: ['coffee:glob_all']
                options:
                    nospawn: true
                    livereload: true

        grunt.event.on "watch", (action, filepath) ->
            console.log filepath.red
            filepath = filepath.replace(grunt.config("coffee.glob_all.cwd"), '')
            #console.log filepath.red
            grunt.config("coffee.glob_all.src", [filepath])

    grunt.registerTask "serve", ["connect:server", "watch"]


getPNGSize = (pngFile) ->
    deferred = Q.defer()
    fs.open spriteDir + path.sep + pngFile, "r", (stat, fd) ->
        if stat
            deferred.reject(new Error(stat))
            return
        #we're only interested in IHDR chunk, and it's always in first 24 bytes
        buffer = new Buffer(8)
        fs.read fd, buffer, 0, 8, 16, (err, num) ->
            w = buffer.readInt32BE(0)
            h = buffer.readInt32BE(4)
            if w <= 0 or h <= 0
                console.log "something is wrong with the #{pngFile}"
            deferred.resolve {"size": w+"x"+h, "png": pngFile}
    return deferred.promise

createSpritesheet = (map) ->
    sprites = map["128x64"]
    size = sprites.length
    #page = require("webpage").create()
    # max_w = 4096
    #inrow = max_w / 128
    #max_h = Math.ceil(size / inrow)
    #page.viewportSize = {width: max_w, height: max_h}
    #console.log page.viewportSize

    # for k, v of map
    #     size = v.length
    #     console.log "#{k}\t:#{size}".yellow

do inspectSprites = () ->
    map = {}
    sprites = getAllSprites()
    len = sprites.length
    cnt = 0
    console.log "total sprites: #{len}".yellow
    for spr in sprites
        Q(getPNGSize spr).done (res) ->
            map[res.size] = [] if not map[res.size]?
            map[res.size].push res.png
            cnt++
            if cnt >= len
                createSpritesheet(map)
