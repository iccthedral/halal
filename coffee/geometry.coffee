"use strict"

define ["vec2", "matrix3", "mathutil"], 

(Vec2, Matrix3, MathUtil) ->

    Geometry = new Object()
    Geometry.toDegrees = (radians) -> radians * MathUtil.RADIAN
    Geometry.toRadians = (degrees) -> degrees * MathUtil.DEGREE

    ###
        Returns angle of point with respect to the origin (x-axis half-plane)
    ###
    Geometry.angleOfPoint = (p) ->
        atan = Math.atan2(-p[1], p[0])
        atan += (Math.PI*2) if atan < 0
        return atan

    ###
        Returns angle between two lines in radians (x-axis half-plane)
    ###
    Geometry.angleOfLines = (a, b) ->
        a1 = Vec2.acquire()
        b1 = Vec2.acquire()
        Vec2.normalize(a1, a)
        Vec2.normalize(b1, b)
        return Math.acos(Vec2.dot(a1, b1))

    ###
        Returns a set of points of a regular AA polygon, with the origin at [0, 0]
        numsides: Number of sides
        sidelen: Length of each side
    ###
    Geometry.createRegularPolygon = (numedges, edgelen) ->
        out = []
        ang_step = MathUtil.TAU / numedges
        ang = 0
        for t in [0...numedges]
            x = edgelen * Math.cos(ang)
            y = edgelen * Math.sin(ang)
            out.push(Vec2.from(x, y))
            ang += ang_step
        return out

    # bem ti krake
    Geometry.createStarPolygon = (base_radius, num_krakova, kraklen) ->
        base = @createRegularPolygon(num_krakova, base_radius)
        len = base.length
        p1 = Vec2.acquire()
        p2 = Vec2.acquire()
        mid = Vec2.acquire()
        i = 0
        while i < len
            Vec2.copy(p1, base[i])
            Vec2.copy(p2, base[(i + 1) % len])
            Vec2.addAndScale(mid, p1, p2, 0.5)
            p = Vec2.acquire()
            Vec2.sub(p, p2, p1)
            Vec2.perpendicular(p1, p)
            Vec2.normalize(p2, p1)
            Vec2.scale(p, p2, kraklen)
            p[0] += mid[0]
            p[1] += mid[1]
            base.push p
            ++i
        Vec2.release(p1)
        Vec2.release(p2)
        Vec2.release(mid)
        return @polygonSortVertices base

    ###
        Returns a set of 4 points, representing AA polygon with respect to the origin
    ###
    Geometry.createPolygonFromRectangle = (w2, h2) ->
        return [
            Vec2.from(-w2, -h2),
            Vec2.from(w2, -h2),
            Vec2.from(w2, h2),
            Vec2.from(-w2, h2)
        ]

    Geometry.isPointInRectangle = (p, rect) ->
        return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3])
    
    ###
        Returns true if point pt is in the circle
    ###
    Geometry.isPointInCircle = (pt, circpos, radius) ->
        distX = pt[0] - circpos[0] or 0 # let's assume 
        distY = pt[1] - circpos[1] or 0 # it's axis aligned
        dist  = Math.sqrt((distX * distX) + (distY * distY))
        return dist < radius

    ###
        This one has some strage corner cases, don't use it.
        @deprecated
    ###
    Geometry.isPointInPolygonDeprecated = (p, poly) ->
        e1 = Vec2.acquire() 
        Vec2.set(e1, -10000000, p[1] - MathUtil.EPSILON)
        e2 = p
        hits = 0
        len = poly.length
        for i in [0...len]
            if ((@lineIntersectsLine(e1, e2, poly[i], poly[(i+1) % len])))
                hits++
        Vec2.release(e1)
        return ((hits % 2) != 0)

    ###
        Returns true if polygon contains point, otherwise false
        How it works:
            For every polygon edge [v1,v2], check if the point is always on the same half-plane,
            as it winds around.
    ###
    Geometry.isPointInPolygon = (p, poly) ->
        v1 = v2 = lr = 0
        left = right = false
        len = poly.length
        v1 = len - 1
        for v2 in [0...len]
            lr = @isPointLeftOrRightOfLine(p, poly[v1], poly[v2])
            if lr > 0
                right = true
            if lr < 0
                left = true
            v1 = v2
        return not(left and right)

    ###
        Returns true if polygon is convex, otherwise false
        Same idea as above
    ###
    Geometry.isPolygonConvex = (poly) ->
        v0 = v1 = lr
        left = right = false
        len = poly.length
        return true if len <= 3

        v0 = len - 2
        v1 = len - 1
        for v2 in [0...len]
            lr = @isPointLeftOrRightOfLine(poly[v2], poly[v0], poly[v1])
            if lr > 0
                right = true
            if lr < 0
                left = true
            v0 = v1
            v1 = v2
        return not(left and right)

    ### 
        When delta is 0, point p is collinear to [a, b] segment
        When delta is less than 0, it's on the left (assuming ccw ordering)
        Otherwise, it's on the right (assuming ccw ordering)
    ### 
    Geometry.isPointLeftOrRightOfLine = (p, a, b) ->
        delta = (b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + a[1]*b[0] - a[0]*b[1]
        return delta

    ###
        @todo Need to revise these rect in rect, etc.
    ###
    Geometry.rectangleContainsRectangle = (rectA, rectB) ->
        return rectA[0] >= rectB[0] and rectA[1] >= rectB[1] and (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) and (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3])

    Geometry.rectangleContainsCircle = (circpos, radius, rect) ->
       return false

    Geometry.rectangleIntersectsRectangle = (rectA, rectB) ->
        return rectA[0] <= (rectB[0] + rectB[2]) and (rectA[0] + rectA[2]) >= rectB[0] and rectA[1] <= (rectB[1] + rectB[3]) and (rectA[3] + rectA[1]) >= rectB[1]

    Geometry.rectangleIntersectsOrContainsRectangle = (rectA, rectB) ->
        return @rectangleIntersectsRectangle(rectA, rectB) or 
            @rectangleContainsRectangle(rectA, rectB) or @rectangleContainsRectangle(rectB, rectA)

    Geometry.rectangleIntersectsOrContainsCircle = (rect, circpos, radius) ->
        return (
            @rectangleIntersectsCircle(rect, circpos, radius) or
            @isPointInRectangle(circpos, rect)
        )

    Geometry.rectangleIntersectsCircle = (rect, circpos, radius) ->
        return (
            @lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius)
        )

    Geometry.lineIntersectsLine = (x1, y1, x2, y2) ->
        ###
            Due to numerical instability, epsilon hack is necessarry 
        ###
        rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1])
        stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1])
        bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0])

        return false if bott is 0.0
        
        invbott = 1.0 / bott
        r = rtop * invbott
        s = stop * invbott

        return ((r > 0.0) and (r < 1.0) and (s > 0.0) and (s < 1.0))

    Geometry.lineIntersectsPolygon = (a, b, poly) ->
        len = poly.length
        for i in [0...len]
            if @lineIntersectsLine(a, b, poly[i], poly[(i + 1) % len])
                return true
        return false

    Geometry.lineIntersectsCircle = (line, circpos, radius) ->
        dist = @perpendicularDistanceToLine(circpos, line[0], line[1])
        return dist < radius

    Geometry.polygonPointInHull = (poly) ->
        pmax = poly[0]
        len = poly.length
        for point in [1...len]
            if point[0] > pmax[0] or (point[0] is pmax[0] and point[1] > pmax[1])
                pmax[0] = point[0]
                pmax[1] = point[1]
        return pmax

    Geometry.polygonSortVertices = (poly) ->
        a = new Array()
        t = @polygonMeanPoint(poly)
        len  = poly.length
        for i in [0...len]
            a[i] = @angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]])
        indices = new Array()
        for i in [0...len]
            val = a[i]
            mark = i
            while mark > 0 and val > a[mark - 1]
                a[mark] = a[mark - 1]
                indices[mark] = indices[mark - 1]
                mark--
            a[mark] = val
            indices[mark] = i
        for ind, i in indices
            a[i] = poly[ind]
        Vec2.release(t)
        return a

    ###
        Returns convex hull of a concave degenerate polygon
    ###
    Geometry.polygonConvexHull = (poly) ->
        len = poly.length
        if len <= 3
            return poly

        #find poly mean   
        t = @polygonMeanPoint(poly)

        #find angles
        a = new Array()
        for i in [0...len]
            a[i] = @angleOfPoint([poly[i][0] - t[0], poly[i][1] - t[1]])

        #find index of a hull point
        k = 0
        pmax = poly[0]
        for i in [1...len]
            point = poly[i]
            if point[0] > pmax[0] or point[0] is pmax[0] and point[1] > pmax[1]
                pmax = point
                k = i

        #sort angles (insertion sort is suitable, because stability)
        prev = new Array()
        next = new Array()
        first = last = j = 0
        for i in [1...len]
            if a[i] <= a[first]
                next[i] = first
                prev[first] = i
                first = i
            else if a[i] >= a[last]
                prev[i] = last
                next[last] = i
                last = i
            else
                j = first
                while a[j] < a[i]
                    j = next[j]
                next[i] = j
                prev[i] = prev[j]
                next[prev[j]] = i
                prev[j] = i

        prev[first] = last
        next[last] = first

        m = len
        done = false
        i = k

        loop
            if @isPointLeftOrRightOfLine(poly[next[next[i]]], poly[i], poly[next[i]]) >= 0
                m--
                j = next[next[i]]
                next[i] = j
                prev[j] = i
                i = prev[i]
            else
                i = next[i]
            if next[next[i]] is k
                done = true
            break unless (not done or (next[i] isnt k))

        convex = []
        for i in [0...m]
            convex[i] = poly[k]
            k = next[k]

        Vec2.release(t)
        return convex

    Geometry.polygonMeanPoint = (poly) ->
        mxy = Vec2.from(0.0, 0.0)
        len = poly.length
        for point in poly
            mxy[0] += point[0]
            mxy[1] += point[1]
        mxy[0] /= len
        mxy[1] /= len
        return mxy

    Geometry.polygonArea = (poly) ->
        ###
            This will come in handy as it signifies the ordering
            of vertices
        ###
        len = poly.length
        area = 0.0
        for i in [0...len]
            p1 = poly[i]
            p2 = poly[(i+1) % len]
            area += (p1[0]*p2[1] - p2[0]*p1[1])
        return area * 0.5

    ### @THIS_TRANSFORMATION_HAS_SIDE_EFFECTS because it is so fucking expensive###
    Geometry.transformPolygon = (poly, matrix) ->
        len = poly.length
        i = 0
        while i < len
            Vec2.release(poly[i])
            poly[i] = @transformPoint(poly[i][0], poly[i][1], matrix)
            ++i
        return poly

    Geometry.transformPoint = (x, y, matrix) ->
        p1 = Vec2.acquire()
        p2 = Vec2.acquire()
        Vec2.set(p1, x, y)
        Vec2.transformMat3(p2, p1, matrix)
        Vec2.release(p1)
        return p2

    Geometry.transformRectangle = (rect, matrix) ->
        pts = [
            @transformPoint(rect[0], rect[1], matrix),
            @transformPoint(rect[0], rect[1] + rect[3], matrix),
            @transformPoint(rect[0] + rect[2], rect[1], matrix),
            @transformPoint(rect[0] + rect[2], rect[1] + rect[3], matrix)
        ]
        left = pts[0][0]
        right = pts[0][0]
        top = pts[0][1]
        bottom = pts[0][1]
        i = 1
        while i < 4
            if pts[i][0] < left
                left = pts[i][0]
            else if pts[i][0] > right
                right = pts[i][0]
            if pts[i][1] < top
                top = pts[i][1]
            else if pts[i][1] > bottom
                bottom = pts[i][1]
            ++i
        Vec2.release(pts[0])
        Vec2.release(pts[1])
        Vec2.release(pts[2])
        Vec2.release(pts[3])
        pts[0] = left
        pts[1] = top
        pts[2] = right - left
        pts[3] = bottom - top
        return pts

    Geometry.polygonCentroidPoint = (poly) ->
        cxy = Vec2.from(0, 0)
        len = poly.length
        area = @polygonArea(poly) * 6
        for i in [0...len]
            p1 = poly[i]
            p2 = poly[(i+1) % len]
            fact = (p1[0]*p2[1] - p2[0]*p1[1])
            cxy[0] += (p1[0] + p2[0]) * fact
            cxy[1] += (p1[1] + p2[1]) * fact            
        cxy[0] = cxy[0] / area
        cxy[1] = cxy[1] / area
        return cxy

    Geometry.polygonIntersectsOrContainsPolygon = (polyA, polyB, inverseB, transformA) ->
        p1 = Vec2.acquire()
        p2 = Vec2.acquire()
        p1[0] = 0
        p1[1] = 0
        ret = false

        Vec2.transformMat3(p2, p1, transformA)
        Vec2.transformMat3(p1, p2, inverseB)

        #first check if polyB origin is contained within polyA
        ret = @isPointInPolygonDeprecated(p1, polyA)        
        Vec2.release(p1)
        Vec2.release(p2)
        return ret or @polygonIntersectsPolygon(polyA, polyB, inverseB, transformA)

    ###
        Note however, that this doesn't tell you if one polygon contains other
    ###
    Geometry.polygonIntersectsPolygon = (polyA, polyB, inverseB, transformA) ->
        lenA = polyA.length
        lenB = polyB.length
        pA1 = Vec2.acquire()
        pA2 = Vec2.acquire()
        pB1 = Vec2.acquire()
        pB2 = Vec2.acquire()
        ret = false
        for i in [0...lenA]
            break if ret
            Vec2.transformMat3(pA1, polyA[i], transformA)
            Vec2.transformMat3(pA2, pA1, inverseB)
            Vec2.transformMat3(pB1, polyA[(i + 1) % lenA], transformA)
            Vec2.transformMat3(pB2, pB1, inverseB)
            for i in [0...lenB]
                p1 = polyB[(i + 1) % lenB]
                p = polyB[i]
                rtop = (pA2[1] - p[1]) * (p1[0] - p[0]) - (pA2[0] - p[0]) * (p1[1] - p[1])
                stop = (pA2[1] - p[1]) * (pB2[0] - pA2[0]) - (pA2[0] - p[0]) * (pB2[1] - pA2[1])
                bott = (pB2[0] - pA2[0]) * (p1[1] - p[1]) - (pB2[1] - pA2[1]) * (p1[0] - p[0])
                continue if bott is 0.0
                invbott = 1.0 / bott
                r = rtop * invbott
                s = stop * invbott
                break if (ret = ((r >= 0.0) and (r <= 1.0) and (s >= 0.0) and (s <= 1.0)))
        Vec2.release(pA1)
        Vec2.release(pA2)
        Vec2.release(pB1)
        Vec2.release(pB2)
        return ret

    Geometry.polygonMinkowskiSum = (arrA, arrB, sign = 1) ->
        out = []
        for a in arrA
            for b in arrB
                out.push Vec2.from(a[0] + sign*b[0], a[1] + sign*b[1])
        return out

    Geometry.polygonBottomMostPoint = (poly) ->
        xymax = Vec2.from(Number.MAX_VALUE, Number.MAX_VALUE)
        for point in poly
            if point[0] < xymax[0]
                xymax[0] = point[0]
            if point[1] < xymax[1]
                xymax[1] = point[1]
        return xymax

    Geometry.polygonTopMostPoint = (poly) ->
        xymax = Vec2.from(Number.MIN_VALUE, Number.MIN_VALUE)
        for point in poly
            if point[0] > xymax[0]
                xymax[0] = point[0]
            if point[1] > xymax[1]
                xymax[1] = point[1]
        return xymax

    Geometry.projectPointOnLine = (pt, a, b) ->
        vecAB = Vec2.sub([], b, a)
        vecAC = Vec2.sub([], pt, a)
        Vec2.normalize(vecAB, vecAB)
        Vec2.normalize(vecAC, vecAC)
        dotProd = Vec2.dot(vecAC, vecAB)
        lenAC = Vec2.distance(a, pt)
        vecCProj = Vec2.scale([], vecAB, dotProd * lenAC)
        vecCProj = Vec2.from(a[0] + vecCProj[0], a[1] + vecCProj[1])
        return vecCProj

    #ovo ne radi kako se ocekuje na segmentu, ispod ima varijanta za segment
    Geometry.perpendicularDistanceToLine = (pt, a, b) ->
        c = @projectPointOnLine(pt, a, b)
        dist = Vec2.distance(pt, c)
        Vec2.release(c)
        return dist

    Geometry.perpendicularDistanceToLineSegment = (pt, a, b) ->
        c = @projectPointOnLine(pt, a, b)
        linelen = Vec2.distance(a, b)
        if Vec2.distance(a, c) > linelen or Vec2.distance(b, c) > linelen
            return Number.NaN
        dist = Vec2.distance(pt, c)
        Vec2.release(c)
        return dist

    Geometry.pointComparison = (a, b, center) ->
        if (a[0] >= 0 and b[0] < 0)
            return true
        if (a[0] is 0 and b[0] is 0)
            return a[1] > b[1]

        det = (a[0] - center[0]) * (b[1] - center[1]) - (b[0] - center[0]) * (a[1] - center[1])

        return true if (det < 0)
        return false if (det > 0)

        #they are on the same line 
        d1 = (a[0] - center[0]) * (a[0] - center[0]) + (a[1] - center[1]) * (a[1] - center[1])
        d2 = (b[0] - center[0]) * (b[0] - center[0]) + (b[1] - center[1]) * (b[1] - center[1])

        return d1 > d2
        
    return Geometry