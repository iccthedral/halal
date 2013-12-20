fs      = require "fs"
path    = require "path"
wrench  = require "wrench"
log     = console.log

###
    Meta information and settings
###
config =
    pub_dir: "."
    js_dir: "js#{path.sep}"
    coffee_dir: "coffee#{path.sep}"
    cur_dir: process.cwd()

is_win         = !!process.platform.match(/^win/)
is_json        = /^.*\.[json]+$/

console.log "Is windows: #{is_win}"
console.log "Platform #{process.platform}"

module.exports = (grunt) ->
    grunt.loadNpmTasks("grunt-contrib-coffee")
    grunt.loadNpmTasks("grunt-contrib-watch")

    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        coffee:
            glob_all:
                expand: true
                cwd: "#{config.coffee_dir}"
                src: ["**/*.coffee"]
                dest: "#{config.js_dir}"
                ext: ".js"

            all: 
                expand: true,
                flatten: false,
                cwd: "#{config.coffee_dir}",
                src: ['**/*.coffee'],
                dest: "#{config.js_dir}",
                ext: ".js"

        watch:
            coffee:
                files: [
                    "#{config.coffee_dir}/**/*.coffee"
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
        
        console.log "Compiling Halal".yellow

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