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
    sprite_list: "assets/sprites/sprites.list"
    cur_dir: process.cwd()

is_win         = !!process.platform.match(/^win/)
is_sprite      = is_spritesheet = /^.*\.[png|jpg]+$/
is_json        = /^.*\.[json]+$/

io.sockets.on "connection", (sck) ->
    socket = sck

    allSprites = getAllSprites()
    saveSprites(allSprites)

    socket.emit("LOAD_SPRITES", {
        files: JSON.stringify(allSprites)
        url: "sprites/"
    })

getAllSprites = () ->
    allSprites = wrench.readdirSyncRecursive(config.sprite_dir)
    console.log "Is windows: #{is_win}"
    console.log "Platform #{process.platform}"

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

    grunt.registerTask "serve", ["connect:server", "watch"]
