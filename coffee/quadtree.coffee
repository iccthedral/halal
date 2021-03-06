"use strict"

define ["vec2", "geometry", "matrix3"], 

(Vec2, Geometry, Matrix3) ->
    
    total           = 0
    cache           = {}

    class QuadTree
        constructor: (@bounds, cap = 8, @part = true) ->
            @entities   = []
            @nw         = null
            @sw         = null
            @ne         = null
            @se         = null
            @id         = Hal.ID()
            @capacity_ = cap

        total: () ->
            return total

        insert: (ent) ->
            if not Geometry.isPointInRectangle(ent.position, @bounds)
                return false
            if (@entities.length < @capacity_ and not cache[ent.id]) or (not @part and not cache[ent.id])
                @entities.push(ent)
                cache[ent.id] = @
                total++
                return true
            if @part
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
            ind = @entities.indexOf(ent)
            if ind is -1
                #lloge "Entity #{ent.id} is not in quadspace"
                return
            total--
            delete cache[ent.id]
            @entities.splice(ind, 1)

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
            out = []
            root = @
            recurseTree = (root) ->
                out = out.concat root.entities
                if root.nw?
                    recurseTree(root.nw)
                    recurseTree(root.ne)
                    recurseTree(root.se)
                    recurseTree(root.sw)

            recurseTree(root)
            return out

                # while root?
                #     if root.nw?
                #         out = out.concat root.nw.entities
                #         root = root.nw
                #     if root.ne?
                #         out = out.concat root.ne.entities
                #         root = root.ne
                #     if root.se?
                #         out = out.concat root.se.entities
                #         root = root.se
                #     if root.sw?
                #         out = out.concat root.sw.entities
                #         root = root.sw

            # entsInRange = @entities.slice()
            # # for p in @entities
            # #     entsInRange.push p
            # if not @nw?
            #     return []
            # entsInRange = entsInRange.concat(@nw.findUnder())
            # entsInRange = entsInRange.concat(@ne.findUnder())
            # entsInRange = entsInRange.concat(@sw.findUnder())
            # entsInRange = entsInRange.concat(@se.findUnder())
            # #return @entities.slice()
            return entsInRange

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

        findEntitiesInRectangle: (range, matrix, out) ->
            transformBnds = Geometry.transformRectangle(@bounds, matrix)
            if Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)
                if @nw?
                    @nw.findEntitiesInRectangle(range, matrix, out)
                    @ne.findEntitiesInRectangle(range, matrix, out)
                    @sw.findEntitiesInRectangle(range, matrix, out)
                    @se.findEntitiesInRectangle(range, matrix, out)

                for p in @entities
                    ret = Geometry.rectangleIntersectsOrContainsRectangle(
                        Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)), range)
                    continue if not ret
                    out.push p
            return out.sort (a, b) -> return (a.position[1] + a?.sprite.h) - (b.position[1] + b?.sprite.h)

        
        # getAllInQuadRange: (subquad) ->
        #     while p in @entities
        #         transformBnds = Geometry.transformRectangle(@bounds, matrix)
        #         if Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)
        #             for p in @entities
        #                 ret = Geometry.rectangleIntersectsOrContainsRectangle(
        #                     Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)), range)
        #                 continue if not ret
        #                 out.push p if out.indexOf(p) is -1

        # findEntitiesInRectangleOut: (range, matrix, out) ->
        #     # out = @entities
        #     while p in @entities

        #     transformBnds = Geometry.transformRectangle(@bounds, matrix)
        #     if Geometry.rectangleIntersectsOrContainsRectangle(range, transformBnds)
        #         for p in @entities
        #             ret = Geometry.rectangleIntersectsOrContainsRectangle(
        #                 Geometry.transformRectangle(p._bbox, Matrix3.mul([], p.transform(), matrix)), range)
        #             continue if not ret
        #             out.push p if out.indexOf(p) is -1
        #     # if not @nw?
        #     #     return out
        #     # else
        #     if @nw?
        #         out.concat(@nw.findEntitiesInRectangle(range, matrix, out))
        #         out.concat(@ne.findEntitiesInRectangle(range, matrix, out))
        #         out.concat(@sw.findEntitiesInRectangle(range, matrix, out))
        #         out.concat(@se.findEntitiesInRectangle(range, matrix, out))
            
                # return out

        divide: () ->
            w           = @bounds[2] * 0.5
            h           = @bounds[3] * 0.5
            @nw         = new QuadTree([@bounds[0], @bounds[1], w, h])
            @ne         = new QuadTree([@bounds[0] + w, @bounds[1], w, h])
            @sw         = new QuadTree([@bounds[0], @bounds[1] + h, w, h])
            @se         = new QuadTree([@bounds[0] + w, @bounds[1] + h, w, h])
    
    QuadTree.fromCache = (entid) ->
        return cache[entid]

    return QuadTree