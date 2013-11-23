"use strict"

define ["Vec2"], 

(Vec2) ->
    capacity = 12

    class QuadTree
        constructor: (@bounds) ->
            @pts = []
            @nw = null
            @sw = null
            @ne = null
            @se = null

        insert: (ent) ->
            if not Hal.math.isPointInRect(ent.worldPos(), @bounds)
                return false

            if @pts.length < capacity
                ent.quadspace = @
                @pts.push(ent)
                return true

            if not @nw?
                @divide()

            if @nw.insert(ent)
                return true
            if @ne.insert(ent)
                return true
            if @sw.insert(ent)
                return true
            if @se.insert(ent)
                return true

            return false

        remove: (ent) ->
            ind = @pts.indexOf(ent)
            @pts.splice(ind, 1)

        searchInRange: (pos, range, scene) ->
            entsInRange = []
            lab = [pos[0] - range, pos[1] - range, 2*range, 2*range]
            if not Hal.math.rectIntersectsRect(lab, @bounds)
                return entsInRange

            for p in @pts
                cp = p.worldToLocal(scene.localToWorld(pos))
                if Hal.math.rectIntersectsRect(p.bbox, [cp[0] - range, cp[1] - range, 2*range, 2*range])
                     entsInRange.push(p)

            if not @nw?
                return entsInRange

            entsInRange = entsInRange.concat(@nw.searchInRange(pos, range, scene))
            entsInRange = entsInRange.concat(@ne.searchInRange(pos, range, scene))
            entsInRange = entsInRange.concat(@sw.searchInRange(pos, range, scene))
            entsInRange = entsInRange.concat(@se.searchInRange(pos, range, scene))

            return entsInRange

        divide: () ->
            w = @bounds[2] * 0.5
            h = @bounds[3] * 0.5

            @nw = new QuadTree([@bounds[0], @bounds[1], w, h])
            @ne = new QuadTree([@bounds[0] + w, @bounds[1], w, h])
            
            @sw = new QuadTree([@bounds[0], @bounds[1] + h, w, h])
            @se = new QuadTree([@bounds[0] + w, @bounds[1] + h, w, h])


    return QuadTree