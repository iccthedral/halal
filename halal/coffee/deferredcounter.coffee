"use strict"

define ["deferred"], 

(Deferred) -> 
    
    class DeferredCounter extends Deferred
        constructor: (@total_trigs) ->
            @num_approved = 0
            @num_rejected = 0
            super()

        resolve: (target, args) ->
            if (@num_approved + @num_rejected) is @total_trigs
                super(target, {@num_approved, @num_rejected}, args) 

        reject: (target, args) -> 
            super(target, {@num_approved, @num_rejected}, args)
            #zato sto moze da se desi reject na poslednjem trigu 
            #sto bi takodje trebalo oznaciti zavrsen posao
            if (@num_approved + @num_rejected) is @total_trigs
                @resolve(target, args)

        acquire: (target, args...) ->
            @num_rejected++            
            @reject(target, args)
        
        release: (target, args...) -> 
            @num_approved++
            @resolve(target, args)

    return DeferredCounter
