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
                super(target, args) 

        reject: (target, args) -> 
            super(target, args)
            #zato sto moze da se desi reject na poslednjem trigu 
            #sto bi takodje trebalo oznaciti zavrsen posao
            if (@num_approved + @num_rejected) is @total_trigs
                @resolve.apply(@, [target].concat args)

        acquire: (target, args...) ->
            @num_rejected++            
            @reject.apply(@, [target].concat args)
        
        release: (target, args...) -> 
            @num_approved++
            @resolve.apply(@, [target].concat args)

    return DeferredCounter
