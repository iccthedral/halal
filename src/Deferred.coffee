"use strict"

define () -> 
    
    class Promise
        constructor: () ->
            @successChain = [] 
            @failChain = []

        then: (successClb) ->
            @successChain.push(successClb)
            return @

        fail: (failClb) ->
            @failChain.push(failClb)
            return @

    class Deferred
        constructor: (numTriggers) ->
            @prom = new Promise()

        resolve: (target, args...) ->
            @traverse_chain("successChain", target, args)

        reject: (target, args...) ->
            @traverse_chain("failChain", target, args)

        promise: () ->
            return @prom

        traverse_chain: (chain, target = @, args) ->
            clb.apply(target, args) for clb in @prom[chain]

    ### @todo izbaciti ovo ###
    window.Deferred = Deferred
    return Deferred