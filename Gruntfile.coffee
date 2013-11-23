fs      = require "fs"
io      = require("socket.io").listen(8080, {log: false})
# rjs     = require "r.js"
path    = require "path"
wrench  = require "wrench"

log     = console.log
socket  = null

###
    Meta information and settings
###
config =
    pub_dir: "."
    src_dir: "src#{path.sep}"
    sprite_dir: "assets/sprites"
    sprite_list: "assets/sprites.list"
    cur_dir: process.cwd()
    tiles: "assets/tiles.list"
    maps: "assets/maps.list"

is_win         = !!process.platform.match(/^win/)
is_sprite      = is_spritesheet = /^.*\.[png|jpg]+$/
is_json        = /^.*\.[json]+$/

console.log "Is windows: #{is_win}"
console.log "Platform #{process.platform}"

io.sockets.on "connection", (sck) ->
    console.log "Connection via socket.io established".green

    socket = sck

    allSprites  = getAllSprites()
    allTiles    = getAllTiles()

    saveSprites(allSprites)

    socket.emit("LOAD_SPRITES", {
        files: JSON.stringify(allSprites)
        url: "sprites/"
    })

    # socket.emit("LOAD_TILES", JSON.stringify(allTiles))

    socket.on "LOAD_MAPEDITOR_ASSETS", () ->
        console.log allTiles.yellow
        socket.emit("LOAD_TILES", JSON.parse(allTiles))

    socket.on "NEW_TILE_SAVED", (tile) ->
        tile = JSON.parse(tile)
        console.log "New tile #{tile.name}".yellow
        list = JSON.parse(fs.readFileSync(config.tiles))
        list[tile.name] = tile
        try
            fs.writeFileSync(config.tiles, JSON.stringify(list))
        catch err
            console.log err
        socket.emit "TILE_ADDED", tile

getAllTiles = () ->
    allTiles = fs.readFileSync(config.tiles)
    return allTiles

getAllSprites = () ->
    allSprites = wrench.readdirSyncRecursive(config.sprite_dir)

    allSprites = allSprites.filter((x) -> return is_sprite.test(x))
    if is_win
        allSprites = allSprites.map (x) -> return x.replace(/\\/g,"\/")

    return allSprites

saveSprites = (sprites) ->
    sprites = sprites.map(
        (x) ->
            return "sprites/#{x}"
    )
    fs.writeFileSync(config.sprite_list, sprites.join().replace(/,/g,"\n"))

module.exports = (grunt) ->
    grunt.loadNpmTasks("grunt-contrib-coffee")
    grunt.loadNpmTasks("grunt-contrib-connect")
    grunt.loadNpmTasks("grunt-contrib-watch")

    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        coffee:
            glob_all:
                expand: true
                cwd: "#{config.src_dir}"
                # src: ["**/*.coffee"]
                dest: "#{config.src_dir}"
                ext: ".js"

        connect:
            server:
                options:
                    keepalive: false
                    port: 9000
                    base: config.pub_dir
                    debug: false

        watch:
            coffee:
                files: [
                    "#{config.src_dir}/**/*.coffee"
                ]
                tasks: ["coffee:glob_all"]
                options:
                    nospawn: true
                    livereload: false

    grunt.event.on "watch", (action, filepath) ->
        log filepath.red
        filepath = filepath.replace(grunt.config("coffee.glob_all.cwd"), "")
        grunt.config("coffee.glob_all.src", [filepath])

    grunt.registerTask "serve", ["watch"]

    grunt.registerTask "compile", "Compiling Halal", () ->
        spawn = require("child_process").spawn
        proc = spawn "r.js", ["-o", "build.js"]

        proc.stdout.setEncoding("utf8")
        proc.stderr.setEncoding("utf8")

        proc.stdout.on "data", (data) ->
            console.log data.yellow
        proc.stderr.on "data", (data) ->
            console.log data.red

        proc.on "exit", (retcode) ->
            console.log retcode
            console.log "Done compiling".green

        proc.on "close", (retcode) ->
            console.log retcode
            console.log "Done compiling".green