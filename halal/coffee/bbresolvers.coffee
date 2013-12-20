"use strict"

define ["vec2", "mathutil", "geometry"],

(Vec2, MathUtil, Geometry) ->

    BBResolvers =
        # axis aligned bounding polygon
        AABPolygonFromSprite: (sprite, sampler = HorizontalSampler, downsampler = DouglasPecker) ->
            return BBSamplerResolver(
                sprite, 
                sampler, 
                downsampler
            )

        # axis aligned bounding box (rect)
        AABBoxFromSprite: (sprite) ->
            out = new MathUtil.ARRAY_TYPE(4)
            out[0] = -sprite.w*0.5
            out[1] = -sprite.h*0.5
            out[2] = sprite.w
            out[3] = sprite.h
            return out

        # axis aligned (lolwut) enclosing circle
        AABCircleFromSprite: (sprite) ->
            rad = Math.sqrt((sprite.w * sprite.w) + (sprite.h * sprite.h)) * 0.5
            return rad

        # axis aligned bounding box from a set of polygon points
        AABBFromPolygon: (polygon) ->
            minX = Number.MAX_VALUE
            minY = Number.MAX_VALUE
            maxX = -Number.MIN_VALUE
            maxY = -Number.MIN_VALUE
            for pt in polygon
                minX = Math.min(pt[0], minX)
                minY = Math.min(pt[1], minY)
                maxX = Math.max(pt[0], maxX)
                maxY = Math.max(pt[1], maxY)
            out = new MathUtil.ARRAY_TYPE(4)
            out[0] = minX
            out[1] = minY
            out[2] = Math.abs(minX) + maxX
            out[3] = Math.abs(minY) + maxY
            return out

    BBSamplerResolver = (sprite, sampler, downsampler) -> 
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
                return points

            for p,q in points
                next = points[q+1]
                break if not next?
                first = Vec2.from(p[0], p[1])
                second = Vec2.from(next[0], next[1])
                vecA = Vec2.sub([], second, first)
                
                if vecA?
                    third = points[q+2]
                    break if not third?
                    vecB = Vec2.sub([], second, Vec2.from(third[0], third[1]))
                
                if vecA? and vecB?
                    Vec2.normalize(vecA, vecA)
                    Vec2.normalize(vecB, vecB)
                    dot = Vec2.dot(vecA, vecB)
                    prev_degs = degs
                    degs = Vec2.dot(vecA, vecB)
                    degs_diff = Math.abs(degs - prev_degs)
                    if(degs_diff > angle_treshold)
                        pt = [points[q+2][0] - MathUtil.EPSILON, points[q+2][1] - MathUtil.EPSILON]
                        points.splice(0, q+2)
                        return pt

        points = new sampler(pixels.data, width, height)
        
        while (critical = findCriticalPoint())?
            criticals.push(critical)
        
        llogd "Number of critical points: #{criticals.length}"
        return new downsampler(criticals)

    class BBSampler
        constructor: (@data = [], @width, @height, @sample_rate = 1) ->
            return @samplingFunc()

        samplingFunc: () ->
            return []

        getPixelAt: (x, y) ->
            pos = (x + @width * y) * 4;
            return [
                @data[pos], 
                @data[pos+1], 
                @data[pos+2], 
                @data[pos+3]
            ]

    ###
        @todo Vertical sampler
    ###

    class HorizontalSampler extends BBSampler 
        samplingFunc: () ->
            alpha_treshold  = 130
            points          = []
            for i in [0...@width] by @sample_rate
                for j in [0...@height]
                    pix = @getPixelAt(i, j)
                    if (pix[3] > alpha_treshold)
                        points.push({x: i, y: j})
                        break

            for i in [0...@width] by @sample_rate
                for j in [@height...0] by -1
                    pix = @getPixelAt(i, j)
                    if (pix[3] > alpha_treshold)
                        points.unshift({x: i, y: j})
                        break
            return points
    
    class BBDownSampler
        constructor: (pts) ->
            return @downsamplingFunc(pts)

        downsamplingFunc: () ->
            return []

    class DouglasPecker extends BBDownSampler
        downsamplingFunc: (pts) ->
            epsilon     = 3
            start       = pts[0]
            len         = pts.length
            end         = pts[len - 1]
            max_dist    = 0
            index       = 0
            res         = []
            if len < 2
                return pts
            for i in [1...(len - 1)]
                dist = Geometry.perpDistance(pts[i], start, end)
                if(dist > max_dist)
                    index = i
                    max_dist = dist
            if (max_dist > epsilon)
                res1 = @downsamplingFunc(pts[0..index])
                res2 = @downsamplingFunc(pts[index...len]) #...pts.length?
                res1 = res1.slice(0, res1.length - 1)
                res = res1.concat(res2)
            else 
                res.push(start)
                res.push(end)
            return res

    return BBResolvers