"use strict"

define [],

() ->

    MetaConfig = 
        Regex: 
            SpriteMatcher: /\/assets\/sprites\/(.*\/)(.*)\.png/
            AssetType: /^(.*)\.(.*)$/
        URI:
            Sprites: "sprites/"
            Assets: "/assets/"
            Websockets: "http://localhost:8080"

    return MetaConfig
