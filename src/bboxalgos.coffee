"use strict"

define ["vec2"],

(Vec2) ->

    BBoxAlgos = {
        polyBBoxFromSprite: (sprite, sampler = HorizontalSampler, downsampler = DouglasPecker) ->
            return BBoxResolver(
                sprite, 
                sampler, 
                downsampler
            )

        rectBBoxFromSprite: (sprite) ->
            return [
                -sprite.w*0.5, 
                -sprite.h*0.5,
                sprite.w,
                sprite.h
            ]

        rectFromPolyShape: (shape) ->
            minX = Number.MAX_VALUE
            minY = Number.MAX_VALUE
            maxX = -Number.MIN_VALUE
            maxY = -Number.MIN_VALUE
            for pt in shape
                minX = Math.min(pt[0], minX)
                minY = Math.min(pt[1], minY)
                maxX = Math.max(pt[0], maxX)
                maxY = Math.max(pt[1], maxY)
            return [minX, minY, Math.abs(minX) + maxX, Math.abs(minY) + maxY]

        circularBBoxFromSprite: (sprite) ->
            rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5
            return [rad]

        rectIntersectsRect: (rect) ->
            return Hal.math.rectIntersectsRect(rect, [@pos[0], @pos[1], @bounds[2], @bounds[3]])

        rectIntersectsCircle: (rect) ->
            return Hal.math.rectIntersectsAndHullsCircle(rect, @pos, @bounds[0])

        rectBoundCheck: (pos) ->
            return Hal.math.isPointInRect(pos, [@pos[0], @pos[1], @bounds[2], @bounds[3]])

        circularBoundCheck: (pos) ->
            return Hal.math.isPointInCircle(pos, @pos, @bounds[0])
    }

    BBoxResolver = (sprite, sampler, downsampler) -> 
        points      = []
        width       = sprite.w
        height      = sprite.h
        canvas      = Hal.dom.createCanvas(width, height)
        ctx         = canvas.getContext("2d")
        criticals   = []

        ctx.drawImage(sprite.img, 0, 0)
        pixels      = ctx.getImageData(0, 0, width, height);


        findCriticalPoint = () ->
            prev_degs       = 0
            degs            = 0
            angle_treshold  = 1/33

            if points.length < 2
                return undefined

            for p,q in points
                next = points[q+1]
                break if not next?
                first = Vec2.fromValues(p.x, p.y)
                second = Vec2.fromValues(next.x, next.y)
                vecA = Vec2.sub([], second, first)
                
                if vecA?
                    third = points[q+2]
                    break if not third?
                    vecB = Vec2.sub([], second, Vec2.fromValues(third.x, third.y))
                
                if vecA? and vecB?
                    Vec2.normalize(vecA, vecA)
                    Vec2.normalize(vecB, vecB)
                    dot = Vec2.dot(vecA, vecB)
                    prev_degs = degs
                    degs = Vec2.dot(vecA, vecB)
                    degs_diff = Math.abs(degs - prev_degs)
                    if(degs_diff > angle_treshold)
                        pt = [points[q+2].x - Hal.math.epsilon, points[q+2].y - Hal.math.epsilon]
                        points.splice(0, q+2)
                        return pt

        points = new sampler(pixels.data, width, height)
        
        while (critical = findCriticalPoint())
            criticals.push(critical)
        
        Hal.log.debug "num criticals: #{criticals.length}"
        return new downsampler(criticals)

    class BBoxSampler
        constructor: (@data = [], @width, @height, @sample_rate = 1) ->
            return @samplingFunc()

        samplingFunc: () ->
            return []

        getPixelAt: (x, y) ->
            pos = (x + @width * y) * 4; #4 channels
            return [
                @data[pos], 
                @data[pos+1], 
                @data[pos+2], 
                @data[pos+3]
            ]

    class HorizontalSampler extends BBoxSampler 
        samplingFunc: () ->
            alpha_treshold  = 130
            points          = []
            for i in [0..@width-1] by @sample_rate
                for j in [0..@height]
                    pix = @getPixelAt(i, j)
                    if (pix[3] > alpha_treshold)
                        points.push({x: i, y: j})
                        break

            for i in [0..@width-1] by @sample_rate
                for j in [@height..0] by -1
                    pix = @getPixelAt(i, j)
                    if (pix[3] > alpha_treshold)
                        points.unshift({x: i, y: j})
                        break
            return points
    

    class BBoxDownSampler
        constructor: (pts) ->
            return @downsamplingFunc(pts)

        downsamplingFunc: () ->
            return []

    class DouglasPecker extends BBoxDownSampler
        downsamplingFunc: (pts) ->
            epsilon     = 3
            start       = pts[0]
            end         = pts[pts.length - 1]
            max_dist    = 0
            index       = 0
            res         = []
            if pts.length < 2
                return pts
            for i in [1..(pts.length - 2)]
                dist = Hal.math.perpDistance(pts[i], start, end)
                if(dist > max_dist)
                    index = i
                    max_dist = dist
            if (max_dist > epsilon)
                res1 = @downsamplingFunc(pts[0..index])
                res2 = @downsamplingFunc(pts[index..pts.length-1])
                res1 = res1.slice(0, res1.length - 1)
                res = res1.concat(res2)
            else 
                res.push(pts[0])
                res.push(pts[pts.length - 1])
            return res

    return BBoxAlgos