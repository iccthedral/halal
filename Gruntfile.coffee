fs      = require "fs"
io      = require("socket.io").listen(8080, {log: false})
# rjs     = require "r.js"
path    = require "path"
log     = console.log

###
    Meta information and settings
###
config =
    pub_dir: "."
    src_dir: "src#{path.sep}"

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
                src: ["**/*.coffee"]
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
                    # "**/*.coffee"
                ]
                tasks: ["coffee:glob_all"]
                options:
                    nospawn: true
                    livereload: true

    grunt.event.on "watch", (action, filepath) ->
        log filepath.red
        filepath = filepath.replace(grunt.config("coffee.glob_all.cwd"), "")
        grunt.config("coffee.glob_all.src", [filepath])

    grunt.registerTask "serve", ["connect:server", "watch"]
