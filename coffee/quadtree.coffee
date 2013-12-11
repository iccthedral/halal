"use strict"

define ["vec2"], 

(Vec2) ->
    
    capacity = 1
    total = 0

    class QuadTree
        constructor: (@bounds) ->
            @pts = []
            @nw = null
            @sw = null
            @ne = null
            @se = null
            @id = Hal.ID()

        total: () ->
            return total

        insert: (ent) ->
            if not Hal.math.isPointInRect(ent.worldPos(), @bounds)
                # llogd "Entity doesnt't interrsect #{@id}"
                return false

            if @pts.length < capacity
                ent.quadspace = @
                @pts.push(ent)
                total++
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
            if ind is -1
                # log.error "Entity #{ent.id} is not in quadspace"
                return
            @pts.splice(ind, 1)
            total--

        searchInRange: (pos, range, scene) ->
            entsInRange = []
            lab = [pos[0] - range, pos[1] - range, 2*range, 2*range]
            if not Hal.math.rectIntersectsRect(lab, @bounds)
                # llogd "Entity not in #{@id}"
                return entsInRange

            for p in @pts
                cp = p.worldToLocal(scene.localToWorld(pos))
                if Hal.math.rectIntersectsRect(p.bbox, [cp[0] - range*0.5, cp[1] - range*0.5, range, range])
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