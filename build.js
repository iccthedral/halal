{
    // "appDir": "js",
    // "baseUrl": ".",
    // "dir": "build",
    //"mainConfigFile": "js/main.js",
    // "modules": [
    //     {
    //         "name": "halal"
    //     }
    // ]
    "baseUrl": "js",
    
    "paths": {
        "requireLib" : "../vendor/requirejs/require",
        "loglevel" : "../vendor/loglevel/dist/loglevel"
    },

    "removeCombined": true,
    "findNestedDependencies": true,
    "name" : "halal",
    "out" : "build/halal.js"
}
