"use strict"

define ["Vec2"], 

(Vec2) ->
    
    MathUtil = {
        MAT_ARRAY: if (typeof Float32Array != 'undefined') then Float32Array else Array;
        epsilon: 0.000001
    }

    MathUtil.createRegularon = (numsides, sidelen) ->
        out = []
        ang_step = (Math.PI * 2) / numsides
        ang = 0

        for t in [0..numsides-1]
            x = sidelen * Math.cos(ang)
            y = sidelen * Math.sin(ang)
            out.push([x,y])
            ang += ang_step
        return out

    MathUtil.clamp = (val, from, to) ->
        if val < from
            val = from
        if val > to
            val = to
        return val
        
    MathUtil.toDegrees = (radians) ->
        return radians * 180 / Math.PI

    MathUtil.isPointInRect = (p, rect) ->
        return p[0] >= rect[0] && p[0] <= (rect[0] + rect[2]) && p[1] >= rect[1] && p[1] <= (rect[1] + rect[3])
    
    MathUtil.isRectInRect = (rectA, rectB) ->
        return rectA[0] >= rectB[0] and rectA[1] >= rectB[1] and (rectA[0] + rectA[2]) <= (rectB[0] + rectB[2]) and (rectA[1] + rectA[3]) <= (rectB[1] + rectB[3])

    MathUtil.rectIntersectsRect = (rectA, rectB) ->
        return rectA[0] < (rectB[0] + rectB[2]) and (rectA[0] + rectA[2]) > rectB[0] and rectA[1] < (rectB[1] + rectB[3]) and (rectA[3] + rectA[1]) > rectB[1]
    
    MathUtil.createRectPolygon = (x, y, w, h) ->
        return [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h]
        ]
        
    MathUtil.doLinesIntersect = (x1,y1,x2,y2) ->
        ###
            Due to numerical instability, epsilon hack is necessarry 
        ###
        rtop = (x1[1] - x2[1]) * (y2[0] - x2[0]) - (x1[0] - x2[0]) * (y2[1] - x2[1])
        stop = (x1[1] - x2[1]) * (y1[0] - x1[0]) - (x1[0] - x2[0]) * (y1[1] - x1[1])
        bott = (y1[0] - x1[0]) * (y2[1] - x2[1]) - (y1[1] - x1[1]) * (y2[0] - x2[0])

        if bott == 0
            return false

        invbott = 1 / bott
        r = rtop * invbott
        s = stop * invbott

        if ((r > 0) and (r < 1) and (s > 0) and (s < 1))
            return true

        return false

    MathUtil.isPointInPoly = (p, points) ->
        e1 = [-10000, p[1]]
        e2 = p
        hits = 0
        len = points.length
        for i in [0..len - 1]
            if ((@doLinesIntersect(e1, e2, points[i], points[(i+1) % len])))
                hits++
        return ((hits % 2) != 0)

    MathUtil.projectPointOnLine = (pt, a, b) ->
        vecAB = Vec2.sub([], b, a)
        vecAC = Vec2.sub([], pt, a)
        Vec2.normalize(vecAB, vecAB)
        Vec2.normalize(vecAC, vecAC)
        dotProd = Vec2.dot(vecAC, vecAB)
        lenAC = Vec2.distance(a, pt)
        vecCProj = Vec2.scale([], vecAB, dotProd * lenAC)
        vecCProj = Vec2.fromValues(a[0] + vecCProj[0], a[1] + vecCProj[1])
        return vecCProj

    MathUtil.rectIntersectsCircle = (rect, circpos, radius) ->
        return (
            @lineIntersectsCircle([[rect[0], rect[1]], [rect[0] + rect[2], rect[1]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0] + rect[2], rect[1]], [rect[0] + rect[2], rect[1] + rect[3]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0] + rect[2], rect[1] + rect[3]], [rect[0], rect[1] + rect[3]]], circpos, radius) or
            @lineIntersectsCircle([[rect[0], rect[1] + rect[3]], [rect[0], rect[1]]], circpos, radius)
        )

    MathUtil.rectIntersectsOrHullsCircle = (rect, circpos, radius) ->
        return (
            @rectIntersectsCircle(rect, circpos, radius) or
            @isPointInRect(circpos, rect)
        )

    #MathUtil.isCircleInRect = (circpos, radius, rect) ->
    #    return false

    MathUtil.lineIntersectsCircle = (line, circpos, radius) ->
        dist = @perpDistanceToSegment(circpos, line[0], line[1])
        return dist < radius

    #ovo ne radi kako se ocekuje na segmentu, ispod ima varijanta za duz
    MathUtil.perpDistance = (pt, a, b) ->
        c = @projectPointOnLine(pt, a, b)
        return Vec2.distance(pt, c)

    MathUtil.perpDistanceToSegment = (pt, a, b) ->
        c = @projectPointOnLine(pt, a, b)
        linelen = Vec2.distance(a, b)
        if Vec2.distance(a, c) > linelen or Vec2.distance(b, c) > linelen
            return Number.NaN
        return Vec2.distance(pt, c)

    MathUtil.isPointInCircle = (pt, circpos, radius) ->
        distX = pt[0] - circpos[0]
        distY = pt[1] - circpos[1]
        dist  = Math.sqrt((distX * distX) + (distY * distY))
        return dist < radius

    pointComparison = (a, b, center) ->
        if (a[0] >= 0 and b[0] < 0)
            return true
        if (a[0] == 0 and b[0] == 0)
            return a[1] > b[1]

        det = (a[0] - center[0]) * (b[1] - center[1]) - (b[0] - center[0]) * (a[1] - center[1])

        if (det < 0)
            return true
        if (det > 0)
            return false

        #they are on the same line 
        d1 = (a[0] - center[0]) * (a[0] - center[0]) + (a[1] - center[1]) * (a[1] - center[1])
        d2 = (b[0] - center[0]) * (b[0] - center[0]) + (b[1] - center[1]) * (b[1] - center[1])

        return d1 > d2

    return MathUtil