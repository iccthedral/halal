"use strict"

define ["vec2", "geometry", "matrix3"], 

(Vec2, Geometry, Matrix3) ->
    
    capacity    = 8
    total       = 0

    class QuadTree
        constructor: (@bounds) ->
            @entities   = []
            @nw         = null
            @sw         = null
            @ne         = null
            @se         = null
            @id         = Hal.ID()

        total: () ->
            return total

        insert: (ent) ->
            if not Geometry.isPointInRectangle(ent.position, @bounds)
                llogd "Entity doesnt't interrsect #{@id}"
                return null

            if not @nw?
                @divide()

            if @entities.length < capacity
                ent.attr("quadspace", @)
                @entities.push(ent)
                total++
                return @

            if @nw.insert(ent)?
                return @nw
            if @ne.insert(ent)
                return @ne
            if @sw.insert(ent)
                return @sw
            if @se.insert(ent)
                return @se

            return null

        remove: (ent) ->
            ind = @entities.indexOf(ent)
            if ind is -1
                lloge "Entity #{ent.id} is not in quadspace"
                return
            @entities.splice(ind, 1)
            total--

        removeAll: () ->
            for p in @entities.slice()
                @remove(p)

        findById: (id) ->
            out = null
            findRec = (where) ->
                if id is where.id
                    out = where
                else if not out?
                    if where.nw? and not out?
                        findRec(where.nw)
                    if where.sw? and not out?
                        findRec(where.sw)
                    if where.ne? and not out?
                        findRec(where.ne)
                    if where.se? and not out?
                        findRec(where.se)
            findRec(@)
            return out

        findUnder: () ->
            out = @entities.slice()
            out = out.concat @nw.findUnder() if @nw?
            out = out.concat @sw.findUnder() if @sw?
            out = out.concat @ne.findUnder() if @ne?
            out = out.concat @se.findUnder() if @se?
            return out

        findQuadsInRectangle: (rect, matrix) ->
            transformBnds = Geometry.transformRectangle(@bounds, matrix)
            quads = []
            if not Geometry.rectangleIntersectsOrContainsRectangle(rect, transformBnds)
                return quads
            quads = [@]
            if not @nw?
                return quads
            quads = quads.concat(@nw.findQuadsInRectangle(rect, matrix))
            quads = quads.concat(@ne.findQuadsInRectangle(rect, matrix))
            quads = quads.concat(@sw.findQuadsInRectangle(rect, matrix))
            quads = quads.concat(@se.findQuadsInRectangle(rect, matrix))
            return quads

        findEntitiesInRectangle: (range, matrix) ->
            entsInRange = []
            transformBnds = Geometry.transformRectangle(@bounds, matrix)
            if not Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)
                return entsInRange
            for p in @entities
                ret = Geometry.rectangleIntersectsOrContainsRectangle(range, 
                    Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)))
                continue if not ret
                entsInRange.push p
            if not @nw?
                return entsInRange
            entsInRange = entsInRange.concat(@nw.findEntitiesInRectangle(range, matrix))
            entsInRange = entsInRange.concat(@ne.findEntitiesInRectangle(range, matrix))
            entsInRange = entsInRange.concat(@sw.findEntitiesInRectangle(range, matrix))
            entsInRange = entsInRange.concat(@se.findEntitiesInRectangle(range, matrix))
            return entsInRange

        divide: () ->
            w           = @bounds[2] * 0.5
            h           = @bounds[3] * 0.5
            @entities   = []
            @nw         = new QuadTree([@bounds[0], @bounds[1], w, h])
            @ne         = new QuadTree([@bounds[0] + w, @bounds[1], w, h])
            @sw         = new QuadTree([@bounds[0], @bounds[1] + h, w, h])
            @se         = new QuadTree([@bounds[0] + w, @bounds[1] + h, w, h])

    return QuadTree